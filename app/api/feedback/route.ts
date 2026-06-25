import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_TYPES = ['helpful', 'not_helpful', 'saved', 'shared', 'clicked_source'] as const

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (!VALID_TYPES.includes(body.feedbackType)) {
    return NextResponse.json({ error: 'Invalid feedback_type' }, { status: 400 })
  }

  await supabase.from('feedback').insert({
    user_id: user.id,
    evidence_id: body.evidenceId ?? null,
    signal_id: body.signalId ?? null,
    feedback_type: body.feedbackType,
  })

  return NextResponse.json({ ok: true })
}
