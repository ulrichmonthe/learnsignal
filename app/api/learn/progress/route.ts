import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recomputeSkills } from '@/lib/skills/recompute'

// Course lesson-completion, stored under lab_progress with key `course:<slug>`.
// data shape: { completedSlugs: string[], lastSlug: string | null, total: number }

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const course = new URL(req.url).searchParams.get('course')
  if (!course) return NextResponse.json({ error: 'Missing course' }, { status: 400 })

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('lab_progress')
    .select('data')
    .eq('user_id', userId)
    .eq('lab', `course:${course}`)
    .maybeSingle()

  return NextResponse.json({ data: data?.data ?? null })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const course = body?.course
  const lessonSlug = body?.lessonSlug
  const total = Number(body?.total) || 0
  if (typeof course !== 'string' || typeof lessonSlug !== 'string' || !total) {
    return NextResponse.json({ error: 'Missing course, lessonSlug, or total' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const key = `course:${course}`

  // Merge: add this lesson to the completed set, advance lastSlug.
  const { data: existing } = await supabase
    .from('lab_progress')
    .select('data')
    .eq('user_id', userId)
    .eq('lab', key)
    .maybeSingle()

  const prev = (existing?.data ?? {}) as { completedSlugs?: string[] }
  const completedSlugs = Array.from(new Set([...(prev.completedSlugs ?? []), lessonSlug]))
  const data = { completedSlugs, lastSlug: lessonSlug, total }

  await supabase.from('lab_progress').upsert(
    { user_id: userId, lab: key, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,lab' },
  )
  await recomputeSkills(supabase, userId)

  return NextResponse.json({ ok: true, completedSlugs })
}
