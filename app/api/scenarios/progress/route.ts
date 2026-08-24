import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'

export const dynamic = 'force-dynamic'

// Scenario progress. This directory existed but was empty: the scenario page
// read `scenario_completions` on load while nothing ever wrote it, so decisions
// lived in React state and died on refresh. This closes that loop.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { scenarioId, currentAct, decisions, completed } = body as {
    scenarioId?: unknown
    currentAct?: unknown
    decisions?: unknown
    completed?: unknown
  }

  if (typeof scenarioId !== 'string' || !UUID_RE.test(scenarioId)) {
    return NextResponse.json({ error: 'scenarioId must be a uuid' }, { status: 400 })
  }
  if (
    typeof currentAct !== 'number' ||
    !Number.isInteger(currentAct) ||
    currentAct < 1 ||
    currentAct > 100
  ) {
    return NextResponse.json({ error: 'currentAct must be an integer 1–100' }, { status: 400 })
  }
  if (decisions !== undefined && (typeof decisions !== 'object' || decisions === null || Array.isArray(decisions))) {
    return NextResponse.json({ error: 'decisions must be an object' }, { status: 400 })
  }
  // Guard the jsonb column against unbounded payloads.
  const decisionMap: Record<string, string> = {}
  for (const [k, v] of Object.entries((decisions ?? {}) as Record<string, unknown>).slice(0, 50)) {
    if (typeof v === 'string') decisionMap[k.slice(0, 64)] = v.slice(0, 128)
  }

  try {
    const supabase = await createServiceClient()
    await ensureUser(supabase, userId)

    const { error } = await supabase.from('scenario_completions').upsert(
      {
        user_id: userId,
        scenario_id: scenarioId,
        current_act: currentAct,
        decisions: decisionMap,
        completed: completed === true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,scenario_id' },
    )

    if (error) return NextResponse.json({ ok: false, reason: error.message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, reason: 'unavailable' })
  }
}
