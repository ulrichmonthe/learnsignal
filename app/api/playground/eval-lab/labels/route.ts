import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

// POST — save a label for a ticket and advance last_ticket
// Body: { session_id, slot_number, label, note? }
export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { session_id, slot_number, label, note } = body

  if (!session_id || !slot_number || !label) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['PASS', 'NEEDS_EDITS', 'FAIL'].includes(label)) {
    return NextResponse.json({ error: 'Invalid label value' }, { status: 400 })
  }

  // Verify session belongs to user
  const { data: session } = await supabase
    .from('vibe_check_sessions')
    .select('id, last_ticket')
    .eq('id', session_id)
    .eq('user_id', userId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Upsert the label (allow re-labelling)
  const { error: labelError } = await supabase
    .from('ticket_labels')
    .upsert(
      { session_id, slot_number, label, note: note ?? null },
      { onConflict: 'session_id,slot_number' }
    )

  if (labelError) {
    return NextResponse.json({ error: 'Failed to save label' }, { status: 500 })
  }

  // Advance last_ticket to next unlabelled ticket
  const next_ticket = Math.max(session.last_ticket ?? 1, slot_number + 1)

  // Check if all 20 tickets are labelled
  const { count } = await supabase
    .from('ticket_labels')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session_id)

  const completed = (count ?? 0) >= 20

  // Update session progress
  await supabase
    .from('vibe_check_sessions')
    .update({
      last_ticket: completed ? 20 : next_ticket,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', session_id)

  return NextResponse.json({ ok: true, next_ticket, completed })
}
