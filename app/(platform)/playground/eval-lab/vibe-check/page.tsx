import { createServiceClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import VibeCheckWorkspace from '@/components/playground/eval-lab/vibe-check-workspace'

export default async function VibeCheckPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const clerkUser = await currentUser()
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ?? ''

  const supabase = await createServiceClient()

  // The session insert below FKs to users(id) — the mirror row must exist first.
  try {
    await ensureUser(supabase, userId, email)
  } catch (e) {
    return (
      <div className="p-8">
        <p className="font-mono text-xs text-red-400">
          {e instanceof Error ? e.message : 'Could not register user'}
        </p>
      </div>
    )
  }

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
    .eq('user_id', userId)
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
      .insert({ user_id: userId, last_ticket: 1 })
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
