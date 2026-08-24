import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { choiceSetHash, learnerKey, validateDecision } from '@/lib/calibration/core'

export const dynamic = 'force-dynamic'

// Calibration capture (roadmap D, Phase 0). Records one decision event per
// commit. Capture is best-effort by design: if the corpus table is missing or
// the write fails, the learner's scenario must continue unaffected — so we
// return { ok: false } rather than a 5xx, and the client ignores the result.

// The pepper severs the corpus from identity. A dedicated LEARNER_KEY_PEPPER is
// preferred (separate KMS scope); we fall back to an existing server-only secret
// so capture is never silently disabled in an environment that has one.
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

  const parsed = validateDecision(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const d = parsed.value

  const secret = pepper()
  if (!secret) {
    // No pepper → refuse to store rather than write an identifiable row.
    return NextResponse.json({ ok: false, reason: 'capture_disabled' })
  }
  const key = learnerKey(userId, secret)

  try {
    const supabase = await createServiceClient()

    const row = {
      attempt_id: d.attemptId ?? crypto.randomUUID(),
      learner_key: key,
      scenario_id: d.scenarioId,
      scenario_version: d.scenarioVersion,
      node_id: d.nodeId,
      choice_id: d.choiceId,
      choice_set_hash: choiceSetHash(d.optionIds, d.optionTexts),
      rationale_text: d.rationale,
      confidence_pct: d.confidencePct,
      pred_majority_id: d.predMajorityId,
      pred_majority_pct: d.predMajorityPct,
      time_to_decide_ms: d.timeToDecideMs,
      pressure_profile: d.pressureProfile,
      hints_used: d.hintsUsed,
      client_surface: 'web',
    }

    // Only first attempts are eligible for published distributions (D §5 rule 5),
    // so a duplicate "first" is corpus corruption. Counting first and inserting
    // second is a read-modify-write race, so the database arbitrates instead:
    // a partial unique index permits exactly one first attempt per
    // (learner, scenario, node). We optimistically claim it and, if the index
    // rejects us (23505), rewrite as a repeat attempt.
    const { count, error: countError } = await supabase
      .from('decision_events')
      .select('event_id', { count: 'exact', head: true })
      .eq('learner_key', key)
      .eq('scenario_id', d.scenarioId)
      .eq('node_id', d.nodeId)

    // A failed count must not manufacture a first attempt.
    const claimsFirst = !countError && (count ?? 0) === 0

    const { error } = await supabase
      .from('decision_events')
      .insert({ ...row, is_first_attempt: claimsFirst })

    if (error) {
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
