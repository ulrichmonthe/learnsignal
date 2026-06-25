import Link from 'next/link'

export default function EvalConceptPage() {
  return (
    <div className="min-h-[calc(100vh-57px)]">
      {/* Reading column */}
      <div className="max-w-[680px] mx-auto px-6 pt-14 pb-24">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="font-mono uppercase"
            style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
          >
            AI Evals · Lesson 1
          </span>
          <span style={{ color: 'var(--border2)', fontSize: '10px' }}>·</span>
          <span
            className="font-mono"
            style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.06em' }}
          >
            8 MIN READ
          </span>
        </div>

        {/* Hero headline */}
        <h1
          className="font-display font-medium text-text leading-tight mb-5"
          style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: '1.2' }}
        >
          Your AI shipped. Now how do you know if it's actually working?
        </h1>

        {/* Lede */}
        <p
          className="mb-10"
          style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: '1.65',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Evals are the discipline of measuring whether your AI does what you think it does.
          Not on benchmarks — on your product, for your users, on the tasks that actually matter.
          This lesson walks through how it works, starting from zero.
        </p>

        {/* ── Section 1 ── */}
        <Section label="The core problem">
          <p>
            Traditional software does what you code it to do. AI does what it{' '}
            <em>learned</em> to do — which is close, but not identical, and shifts with every
            model update, every new input pattern, every edge case your users discover.
          </p>
          <p>
            The old PM workflow — write PRD, spec features, ship, done — skips the most
            important step for AI products: defining what "good" means, and having a
            systematic way to check whether you're hitting it.
          </p>
          <p>
            Without evals, you're flying blind. Your agent could be hallucinating details
            in 30% of responses and you'd only find out from a support ticket six weeks later.
          </p>
        </Section>

        <Divider />

        {/* ── Case study intro ── */}
        <div className="mb-8">
          <p
            className="font-mono uppercase mb-4"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
          >
            Throughout this lesson
          </p>
          <div
            className="rounded-lg p-5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
          >
            <p
              className="font-display font-medium text-text mb-2"
              style={{ fontSize: '16px' }}
            >
              Support Triage Agent
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: '1.6',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              A background agent that reads incoming support tickets and automatically
              classifies each one by intent, sentiment, and urgency — so specialists see
              high-priority issues faster. Support leads spend ~4 hours/day on this manually.
              The agent should eliminate that.
            </p>
            <div className="mt-4 space-y-1">
              {[
                'Categorise ticket: Technical / Billing / Feature Request',
                'Assign sentiment: Positive / Neutral / Frustrated / Angry',
                'If Frustrated or Angry: flag for human review with urgency level',
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>·</span>
                  <p
                    className="font-mono"
                    style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}
                  >
                    {task}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* ── Stage 1: Vibe Check ── */}
        <Section label="Stage 1 — Vibe check">
          <p>
            Before writing a PRD. Before specifying features. Before a single line of
            production code. You run a vibe check.
          </p>
          <p>
            A vibe check is a manual review using a few dozen diverse inputs. The goal
            isn&apos;t to be rigorous — it&apos;s to build intuition about what the system can
            and can&apos;t do, and to seed your first dataset with golden outputs.
          </p>
          <BlockQuote>
            Rigor matters less than coverage. Which use cases does the model handle well?
            Where does it consistently fail? What surprising behaviours emerge?
          </BlockQuote>
          <p>The workflow is simple:</p>
        </Section>

        {/* Vibe check steps */}
        <Steps
          items={[
            'Generate 10–30 test inputs covering different personas and edge cases',
            'Run each through your prototype',
            'Label each output: ✓ would ship · ~ needs edits · ✗ unacceptable',
            'Note why something passed or failed — this becomes your first eval rubric',
          ]}
        />

        {/* What the triage agent reveals */}
        <div className="mt-8 mb-8">
          <p
            className="font-mono uppercase mb-4"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
          >
            What the triage agent reveals
          </p>
          <p
            className="mb-5"
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.6',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            A team vibe-checking the Support Triage Agent would immediately find these patterns —
            things you&apos;d never anticipate from a requirements doc:
          </p>
          <div className="space-y-3">
            {[
              {
                name: 'Short-input hallucinations',
                detail:
                  'Very short inputs like "Help!" cause the agent to fabricate error codes, browser types, and root causes that aren\'t in the ticket. It fills the ambiguity with plausible-sounding noise.',
                accent: true,
              },
              {
                name: 'Sarcasm read as neutral',
                detail:
                  'The sentiment analysis can\'t detect sarcasm. "Cool, ANOTHER charge I didn\'t authorise" gets labelled Neutral. Angry customers slip through without escalation.',
                accent: true,
              },
              {
                name: 'Multi-issue label drops',
                detail:
                  'When a ticket mentions two separate issues, the agent picks the first and ignores the second. "I can\'t log in and I need to update my billing" becomes a login ticket only.',
                accent: true,
              },
            ].map(p => (
              <div
                key={p.name}
                style={{
                  borderLeft: '2px solid rgba(200,240,64,0.3)',
                  paddingLeft: '16px',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                }}
              >
                <p
                  className="font-display font-medium text-text mb-1"
                  style={{ fontSize: '14px' }}
                >
                  {p.name}
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: '1.6',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
          <p
            className="mt-5"
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.6',
              fontFamily: 'var(--font-dm-sans)',
              fontStyle: 'italic',
            }}
          >
            These vibe check findings shape the PRD — not the other way around. The PRD
            is written <em>after</em> you know what the agent actually does.
          </p>
        </div>

        <Divider />

        {/* ── Stage 2: Offline Evals ── */}
        <Section label="Stage 2 — Offline evals">
          <p>
            Once you know what failure looks like, you automate the check. Offline evals
            run your agent against a stored dataset of golden outputs — the examples you
            collected during the vibe check — and score every new version automatically.
          </p>
          <p>
            The workflow: engineer makes a change (new prompt, model upgrade). System runs
            it against your reference dataset. Results are compared to baseline. If quality
            holds or improves, ship. If it regresses, investigate before it hits users.
          </p>
          <BlockQuote>
            Notion&apos;s AI team went from fixing 3 issues per day to 30 — a 10× improvement —
            by building systematic evals. When a new model drops, they can ship to production
            in under 24 hours. The bottleneck on most teams isn&apos;t the model. It&apos;s measurement.
          </BlockQuote>
        </Section>

        {/* Eval metrics table */}
        <div className="mb-8">
          <p
            className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
          >
            Sample eval targets — triage agent v1
          </p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}
          >
            {[
              { metric: 'Categorisation accuracy', target: '> 92%', why: 'Avoid routing Billing issues to Dev teams' },
              { metric: 'Sentiment precision', target: '> 85%', why: 'Avoid false alarms on frustrated users' },
              { metric: 'Latency', target: '< 2s', why: 'Must be faster than manual triage' },
              { metric: 'Hallucination rate', target: '0%', why: 'Never invent ticket IDs or usernames' },
            ].map((row, i) => (
              <div
                key={row.metric}
                className="flex items-start gap-4"
                style={{
                  padding: '12px 16px',
                  borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                }}
              >
                <span
                  className="font-mono flex-shrink-0"
                  style={{ fontSize: '11px', color: 'var(--text)', width: '160px' }}
                >
                  {row.metric}
                </span>
                <span
                  className="font-mono flex-shrink-0"
                  style={{ fontSize: '11px', color: 'var(--accent)', width: '52px' }}
                >
                  {row.target}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'var(--font-dm-sans)',
                    lineHeight: '1.5',
                  }}
                >
                  {row.why}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* ── Stage 3: User Monitoring ── */}
        <Section label="Stage 3 — User monitoring">
          <p>
            Offline evals only test what you already know to look for. Online monitoring
            catches what you didn&apos;t anticipate — emerging failure modes, shifts in user
            behaviour, gaps between your golden dataset and what real users actually send.
          </p>
          <p>
            The gap between your offline eval score and your production quality score is
            called <strong style={{ color: 'var(--text)' }}>drift</strong>. If offline
            metrics say quality is improving but user complaints are rising, you&apos;re measuring
            the wrong thing.
          </p>
        </Section>

        {/* Eval flywheel visual */}
        <div
          className="mb-10 p-5 rounded-lg"
          style={{
            background: 'rgba(200,240,64,0.03)',
            border: '0.5px solid rgba(200,240,64,0.12)',
            borderRadius: '8px',
          }}
        >
          <p
            className="font-mono uppercase mb-4"
            style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(200,240,64,0.6)' }}
          >
            The eval flywheel
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { stage: '01', label: 'Vibe check', sub: 'Find failure modes' },
              { stage: '02', label: 'Offline evals', sub: 'Automate the check' },
              { stage: '03', label: 'User monitoring', sub: 'Track drift in prod' },
              { stage: '04', label: 'Iterate', sub: 'Feed new cases back' },
            ].map((s, i) => (
              <div key={s.stage} className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono"
                      style={{ fontSize: '9px', color: 'var(--accent)', opacity: 0.6 }}
                    >
                      {s.stage}
                    </span>
                    <span
                      className="font-mono"
                      style={{ fontSize: '11px', color: 'var(--text)' }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {s.sub}
                  </p>
                </div>
                {i < 3 && (
                  <span style={{ color: 'rgba(200,240,64,0.3)', fontSize: '12px', marginLeft: '4px' }}>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── The PM's role ── */}
        <Section label="Where PMs fit in">
          <p>
            Engineers can implement your eval rubric. They can&apos;t define what "great" means
            for your users — that&apos;s your job.
          </p>
          <p>
            AI PM work requires more time defining and refining the solution than traditional
            PM roles did. The heavy lifting is in defining failure modes, building golden
            datasets, calibrating automated judges, and reading traces personally to find
            patterns that automated scoring misses.
          </p>
          <p>
            Teams that let ML engineers exclusively own evaluation discover quickly that
            product taste matters — and that development slows down when PMs aren&apos;t in
            the loop.
          </p>
        </Section>

        <Divider />

        {/* ── CTA ── */}
        <div className="mt-10">
          <p
            className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
          >
            Ready to practice
          </p>
          <p
            className="mb-6"
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: '1.55',
              fontFamily: 'var(--font-dm-sans)',
              maxWidth: '520px',
            }}
          >
            You&apos;ve seen the three failure patterns on paper. Now find them yourself —
            by labelling the same 20 tickets the triage agent processed. It takes about
            8 minutes. You&apos;ll end up knowing the patterns in a way reading never produces.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/playground/eval-lab/vibe-check"
              className="font-mono font-medium text-black hover:opacity-90 transition-opacity inline-block"
              style={{
                fontSize: '12px',
                letterSpacing: '0.08em',
                background: '#C8F040',
                padding: '14px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              START THE VIBE CHECK →
            </Link>
            <Link
              href="/playground/confirm?q=how+do+I+run+evals+on+my+AI"
              className="font-mono"
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                borderBottom: '0.5px dotted rgba(255,255,255,0.2)',
              }}
            >
              ← Back to start
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─── Layout helpers ─── */

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <p
        className="font-mono uppercase mb-4"
        style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
      >
        {label}
      </p>
      <div
        className="space-y-4"
        style={{
          fontSize: '15px',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '1.65',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function BlockQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      style={{
        borderLeft: '2px solid rgba(200,240,64,0.25)',
        paddingLeft: '16px',
        margin: '24px 0',
        fontStyle: 'italic',
        fontSize: '15px',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.65',
        fontFamily: 'var(--font-playfair)',
      }}
    >
      {children}
    </blockquote>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <div className="space-y-2 mb-8">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <span
            className="font-mono flex-shrink-0"
            style={{
              fontSize: '10px',
              color: 'var(--accent)',
              opacity: 0.6,
              marginTop: '3px',
              width: '18px',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {item}
          </p>
        </div>
      ))}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        marginBottom: '32px',
        marginTop: '8px',
      }}
    />
  )
}
