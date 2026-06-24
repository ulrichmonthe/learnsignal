import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VibeCheckWorkspace from '@/components/playground/eval-lab/vibe-check-workspace'

export default async function VibeCheckPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Ensure the user exists in our custom users table (synced from auth.users).
  // Supabase Auth creates rows in auth.users; our FK references the public users table.
  await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id' }
    )

  // Fetch all 20 tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('eval_tickets')
    .select(
      'slot_number, ticket_text, agent_category, agent_sentiment, agent_urgency, agent_reasoning, agent_escalate'
    )
    .order('slot_number')

  if (ticketsError || !tickets) {
    return (
      <div className="p-8">
        <p className="font-mono text-xs text-red-400">
          Failed to load tickets. Make sure the eval_tickets table is seeded.
        </p>
        <pre className="text-xs text-text3 mt-2">{ticketsError?.message}</pre>
      </div>
    )
  }

  // Get or create session
  const { data: existingSessions } = await supabase
    .from('vibe_check_sessions')
    .select('id, last_ticket, completed_at')
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)

  let sessionId: string
  let lastTicket: number

  if (existingSessions && existingSessions.length > 0) {
    sessionId = existingSessions[0].id
    lastTicket = existingSessions[0].last_ticket ?? 1
  } else {
    const { data: newSession, error: insertError } = await supabase
      .from('vibe_check_sessions')
      .insert({ user_id: user.id, last_ticket: 1 })
      .select('id, last_ticket')
      .single()

    if (insertError || !newSession) {
      return (
        <div className="p-8">
          <p className="font-mono text-xs text-red-400">
            Failed to create session: {insertError?.message}
          </p>
        </div>
      )
    }
    sessionId = newSession.id
    lastTicket = 1
  }

  // Fetch existing labels for this session
  const { data: existingLabels } = await supabase
    .from('ticket_labels')
    .select('slot_number, label, note')
    .eq('session_id', sessionId)

  return (
    <VibeCheckWorkspace
      sessionId={sessionId}
      initialTicket={lastTicket}
      tickets={tickets}
      existingLabels={existingLabels ?? []}
    />
  )
}
