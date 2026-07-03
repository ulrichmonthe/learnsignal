import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { computeReveal, type RevealData } from '@/lib/eval-lab/reveal'
import RevealActions from '@/components/playground/eval-lab/reveal-actions'

async function getRevealData(userId: string, sessionId: string | null): Promise<RevealData | null> {
  // Call the Supabase service client directly to avoid a self-HTTP call
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = await createServiceClient()

  // Find the session
  let sessionQuery = supabase
    .from('vibe_check_sessions')
    .select('id, started_at, completed_at, last_ticket')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)

  if (sessionId) {
    sessionQuery = supabase
      .from('vibe_check_sessions')
      .select('id, started_at, completed_at, last_ticket')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .limit(1)
  }

  const { data: sessions } = await sessionQuery
  if (!sessions || sessions.length === 0) return null

  const session = sessions[0]

  const { data: labels } = await supabase
    .from('ticket_labels')
    .select('slot_number, label')
    .eq('session_id', session.id)

  if (!labels) return null

  return computeReveal(labels, session.started_at, session.completed_at)
}

export default async function RevealPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { session_id } = await searchParams
  const data = await getRevealData(userId, session_id ?? null)

  if (!data) {
    return (
      <div className="max-w-[640px] mx-auto px-6 pt-20">
        <p className="font-mono text-xs text-text3">No session found. <a href="/playground/eval-lab/vibe-check" className="text-accent">Start the vibe check →</a></p>
      </div>
    )
  }

  // If fewer than 20 tickets labelled, show resume state
  if (data.ticketsLabelled < 20) {
    return (
      <div className="max-w-[640px] mx-auto px-6 pt-20">
        <p className="font-mono text-[11px] tracking-[0.12em] text-text3 uppercase mb-4">Eval Lab</p>
        <h1 className="font-display font-medium text-text mb-3" style={{ fontSize: 'clamp(24px,4vw,32px)' }}>
          You've labelled {data.ticketsLabelled} of 20 tickets.
        </h1>
        <p className="mb-8" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.55', fontFamily: 'var(--font-dm-sans)' }}>
          Finish all 20 to see the pattern reveal. You can pick up right where you left off.
        </p>
        <a
          href="/playground/eval-lab/vibe-check"
          className="font-mono font-medium text-black hover:opacity-90 transition-opacity inline-block"
          style={{ fontSize: '12px', letterSpacing: '0.08em', background: '#C8F040', padding: '14px 24px', borderRadius: '8px', textDecoration: 'none' }}
        >
          CONTINUE LABELLING →
        </a>
      </div>
    )
  }

  const heroH1 = data.allCaught
    ? 'You caught all three patterns on your first vibe check.'
    : data.zeroCaught
      ? "You just finished 20 tickets. Here's what the agent was doing."
      : 'You just found three failure patterns.'

  const heroSubhead = data.allCaught
    ? "That's better than most teams do. You didn't go looking for these — you discovered them by doing the work."
    : data.zeroCaught
      ? "Here's what your labels reveal about this agent. Some of these were subtle — worth re-reading."
      : "Here's what your labels reveal about this agent. You didn't go looking for these. You discovered them by doing the work."

  return (
    <div className="max-w-[700px] mx-auto px-6 pt-12 pb-20">
      {/* Eyebrow */}
      <p
        className="font-mono uppercase mb-8"
        style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--accent)' }}
      >
        {data.ticketsLabelled} TICKETS LABELLED · {data.sessionMinutes} MINUTE{data.sessionMinutes !== 1 ? 'S' : ''}
      </p>

      {/* Hero */}
      <h1
        className="font-display font-medium text-text mb-4 leading-tight"
        style={{ fontSize: 'clamp(26px, 4vw, 32px)' }}
      >
        {heroH1}
      </h1>
      <p
        className="mb-10"
        style={{
          fontSize: '15px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: '1.55',
          fontFamily: 'var(--font-dm-sans)',
          maxWidth: '540px',
        }}
      >
        {heroSubhead}
      </p>

      {/* Pattern cards */}
      <div className="space-y-3 mb-10">
        {data.patterns.map(pattern => {
          const isConfirmed = pattern.tier === 'confirmed'

          return (
            <div
              key={pattern.id}
              style={{
                borderLeft: `2px solid ${isConfirmed ? '#C8F040' : 'rgba(255,255,255,0.3)'}`,
                background: isConfirmed
                  ? 'rgba(200,240,64,0.04)'
                  : 'rgba(255,255,255,0.025)',
                padding: '18px 22px',
                borderRadius: '0 8px 8px 0',
              }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3
                  className="font-display font-medium text-text"
                  style={{ fontSize: '18px', lineHeight: '1.3' }}
                >
                  {pattern.name}
                </h3>
                <span
                  className="font-mono flex-shrink-0"
                  style={{
                    fontSize: '11px',
                    color: isConfirmed ? 'rgba(200,240,64,0.7)' : 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                    paddingTop: '3px',
                  }}
                >
                  {`${pattern.caughtCount} OF ${pattern.totalCount} CAUGHT`}
                  {pattern.flaggedCount > 0 ? ` · ${pattern.flaggedCount} FLAGGED` : ''}
                </span>
              </div>

              {/* Card body */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '1.6',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {pattern.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Subverted pattern note (if user mis-labelled ticket 19) */}
      {data.subvertedPatternMissed && (
        <div
          className="mb-8 p-4 rounded-lg"
          style={{ background: 'rgba(245,200,66,0.06)', border: '0.5px solid rgba(245,200,66,0.2)', borderRadius: '8px' }}
        >
          <p
            className="font-mono uppercase mb-1"
            style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#F5C842' }}
          >
            One thing worth flagging
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontFamily: 'var(--font-dm-sans)' }}>
            You marked ticket 19 as a fail. The agent actually got that one — it correctly read the sarcasm as angry and escalated. Worth re-reading. The ticket that looked like a sarcasm failure was the one where the agent was right.
          </p>
        </div>
      )}

      {/* Synthesis */}
      <div
        style={{
          borderTop: '0.5px solid rgba(255,255,255,0.1)',
          borderBottom: '0.5px solid rgba(255,255,255,0.1)',
          padding: '20px 0',
          marginBottom: '32px',
        }}
      >
        <p
          className="font-mono uppercase mb-3"
          style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
        >
          What this means
        </p>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: '1.6',
            fontFamily: 'var(--font-dm-sans)',
            maxWidth: '580px',
          }}
        >
          These three patterns are the candidates for your first code-based evals. You found them in{' '}
          {data.sessionMinutes} minute{data.sessionMinutes !== 1 ? 's' : ''} — without writing a single line of code.
        </p>
      </div>

      {/* Actions — also pushes lab completion to skill credit on mount */}
      <RevealActions score={data.score} />

      {/* Voice pass note — internal reminder, not rendered to users */}
      {/* [VOICE PASS REQUIRED] Practitioner quotes omitted pending real sources */}
    </div>
  )
}
