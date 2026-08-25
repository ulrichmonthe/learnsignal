import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { learnerKey } from '@/lib/calibration/core'
import { validateExercise } from '@/lib/calibration/exercise'

export const dynamic = 'force-dynamic'

// Commit-Loop exercise capture (US-03). Writes into the same decision_events
// corpus as the scenario surface, distinguished by client_surface so the two
// pressure conditions are never silently pooled.
//
// Best-effort by design: the learner's reveal must never wait on, or be blocked
// by, this call. Failures return { ok: false }, not a 5xx.

function pepper(): string | null {
  return process.env.LEARNER_KEY_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = validateExercise(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const d = parsed.value

  const secret = pepper()
  if (!secret) return NextResponse.json({ ok: false, reason: 'capture_disabled' })
  const key = learnerKey(userId, secret)

  const scenarioId = `course:${d.course}`

  try {
    const supabase = await createServiceClient()

    const row = {
      attempt_id: crypto.randomUUID(),
      learner_key: key,
      scenario_id: scenarioId,
      scenario_version: '1',
      node_id: d.lesson,
      choice_id: d.choiceId,
      choice_set_hash: d.choiceSetHash,
      // Stored at decision time so later content edits cannot retroactively
      // change whether a past answer matched the practitioner call.
      expert_verdict: d.expertVerdict,
      rationale_text: d.rationale,
      confidence_pct: d.confidencePct,
      time_to_decide_ms: d.timeToDecideMs,
      pressure_profile: 'untimed',
      client_surface: 'course-exercise',
    }

    const { count, error: countError } = await supabase
      .from('decision_events')
      .select('event_id', { count: 'exact', head: true })
      .eq('learner_key', key)
      .eq('scenario_id', scenarioId)
      .eq('node_id', d.lesson)

    const claimsFirst = !countError && (count ?? 0) === 0

    const { error } = await supabase
      .from('decision_events')
      .insert({ ...row, is_first_attempt: claimsFirst })

    if (error) {
      // The partial unique index is the arbiter of "first attempt"; losing that
      // race means someone else already claimed it, so record a repeat.
      if (claimsFirst && error.code === '23505') {
        const { error: retryError } = await supabase
          .from('decision_events')
          .insert({ ...row, is_first_attempt: false })
        if (retryError) return NextResponse.json({ ok: false, reason: 'write_failed' })
        return NextResponse.json({ ok: true, firstAttempt: false })
      }
      return NextResponse.json({ ok: false, reason: 'write_failed' })
    }
    return NextResponse.json({ ok: true, firstAttempt: claimsFirst })
  } catch {
    return NextResponse.json({ ok: false, reason: 'unavailable' })
  }
}
