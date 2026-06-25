import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

// GET — fetch or create the user's active vibe check session
// Returns: { session_id, last_ticket, labels, tickets }
export async function GET(_req: NextRequest) {
  const supabase = await createServiceClient()
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all 20 tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('eval_tickets')
    .select('slot_number, ticket_text, agent_category, agent_sentiment, agent_urgency, agent_reasoning, agent_escalate')
    .order('slot_number')

  if (ticketsError) {
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }

  // Look for an existing incomplete session for this user
  const { data: existingSessions } = await supabase
    .from('vibe_check_sessions')
    .select('id, last_ticket, completed_at')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)

  let session_id: string
  let last_ticket: number

  if (existingSessions && existingSessions.length > 0) {
    session_id = existingSessions[0].id
    last_ticket = existingSessions[0].last_ticket ?? 1
  } else {
    // Create a fresh session
    const { data: newSession, error: insertError } = await supabase
      .from('vibe_check_sessions')
      .insert({ user_id: userId, last_ticket: 1 })
      .select('id, last_ticket')
      .single()

    if (insertError || !newSession) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    session_id = newSession.id
    last_ticket = 1
  }

  // Fetch existing labels for this session
  const { data: labels } = await supabase
    .from('ticket_labels')
    .select('slot_number, label, note')
    .eq('session_id', session_id)

  return NextResponse.json({
    session_id,
    last_ticket,
    labels: labels ?? [],
    tickets: tickets ?? [],
  })
}
