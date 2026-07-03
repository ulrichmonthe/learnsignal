import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recomputeSkills } from '@/lib/skills/recompute'

// Lab progress cloud sync, keyed by the Clerk user id.
// Only known labs are accepted — this key feeds the skill recompute.
const KNOWN_LABS = new Set(['raglab', 'pcelab', 'evallab'])
const MAX_DATA_BYTES = 64_000

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lab = new URL(req.url).searchParams.get('lab')
  if (!lab || !KNOWN_LABS.has(lab)) {
    return NextResponse.json({ error: 'Unknown lab' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('lab_progress')
    .select('data')
    .eq('user_id', userId)
    .eq('lab', lab)
    .maybeSingle()

  return NextResponse.json({ data: data?.data ?? null })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lab, data } = await req.json().catch(() => ({ lab: null, data: null }))
  if (typeof lab !== 'string' || !KNOWN_LABS.has(lab) || !data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Missing or invalid lab/data' }, { status: 400 })
  }
  if (JSON.stringify(data).length > MAX_DATA_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const supabase = await createServiceClient()
  await supabase.from('lab_progress').upsert(
    { user_id: userId, lab, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,lab' },
  )
  await recomputeSkills(supabase, userId)

  return NextResponse.json({ ok: true })
}
