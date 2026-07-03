// Lesson 1 body — "Your AI shipped. Now what?"
// This lesson links to the full concept page and the vibe-check exercise
// rather than duplicating the existing lesson content.

import Link from 'next/link'
import {
  Divider,
  Section,
  P,
  BlockQuote,
  CodeBlock,
  AgentBox,
} from '@/components/courses/lesson-helpers'
import { Exercise } from '@/components/courses/exercise'
import { EVALS_EXERCISES } from '@/lib/courses/exercises/evals-foundations'

export default function Lesson1Body() {
  return (
    <div>
      <p
        className="mb-10"
        style={{
          fontSize: '17px',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '1.65',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        Evals are the discipline of measuring whether your AI does what you think it does. Not on
        benchmarks — on your product, for your users, on the tasks that actually matter.
      </p>

      <P>
        Most AI PMs don&apos;t think about evals until something goes wrong. The feature ships, users
        start using it, and then a specialist reports it&apos;s &ldquo;getting worse.&rdquo; You
        spot-check 20 outputs, they seem fine. Who&apos;s right? You have no way to answer.
      </P>
      <P>
        This course fixes that. By the end of lesson 10, you&apos;ll have a full eval system: a
        rubric that captures what &ldquo;good&rdquo; means for your product, an evaluator
        architecture that scales, a calibrated judge that replaces your manual spot-checks, and a
        production monitoring plan that catches drift before users do.
      </P>
      <P>
        The whole course threads through a single example: a Support Triage Agent. By lesson 10,
        you&apos;ll know this product better than most real ones.
      </P>

      <AgentBox />

      <Divider />

      <Section label="Three stages of eval maturity">
        <P>
          Every AI product moves through three stages. Most teams get stuck at stage one.
        </P>

        <div className="space-y-6 mt-4">
          <div
            style={{
              borderLeft: '2px solid var(--accent)',
              paddingLeft: '16px',
            }}
          >
            <p className="font-mono uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}>
              Stage 1 — Vibe Check
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontFamily: 'var(--font-dm-sans)' }}>
              Manual review of a few dozen diverse inputs. You build intuition about what works
              and what doesn&apos;t. This is where you discover your first failure patterns — the
              short-input hallucinations, the sarcasm read as neutral, the multi-issue drops.
              Covered in lessons 1–5.
            </p>
          </div>
          <div
            style={{
              borderLeft: '2px solid rgba(255,255,255,0.15)',
              paddingLeft: '16px',
            }}
          >
            <p className="font-mono uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
              Stage 2 — Offline Evals
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6', fontFamily: 'var(--font-dm-sans)' }}>
              Your failure patterns become a rubric, the rubric becomes automated checks, the
              checks run on every change. Your team can ship faster because you know if a change
              broke something before it reaches users. Covered in lessons 6–8.
            </p>
          </div>
          <div
            style={{
              borderLeft: '2px solid rgba(255,255,255,0.15)',
              paddingLeft: '16px',
            }}
          >
            <p className="font-mono uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
              Stage 3 — Production Monitoring
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6', fontFamily: 'var(--font-dm-sans)' }}>
              Offline evals test what you already know to look for. Production monitoring catches
              what you didn&apos;t anticipate. You track input drift, output distribution shifts,
              and leading indicators that move weeks before user complaints do. Covered in
              lessons 9–10.
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      <Section label="The failure patterns you'll find">
        <P>
          The Triage Agent has three recurring failure patterns that thread through the entire course.
          You discovered them in the vibe check. You&apos;ll build evals to catch them. You&apos;ll
          trace them to root cause when they appear in production.
        </P>
        <CodeBlock>{`PATTERN 1: Short-input hallucinations
  Very short inputs ("broken", "help") cause the agent to fabricate
  error codes, browser types, and root causes not in the ticket.

PATTERN 2: Sarcasm read as neutral
  "Cool, ANOTHER charge I didn't authorise" gets labelled Neutral.
  Angry customers slip through without escalation.

PATTERN 3: Multi-issue label drops
  "I can't log in and I need to update my billing" becomes a login
  ticket only — the billing issue is silently dropped.`}</CodeBlock>
        <P>
          These aren&apos;t exotic edge cases. They appear in the first 20 outputs any PM looks at.
          The vibe check is where you see them. The rest of the course is about what you do next.
        </P>
      </Section>

      <BlockQuote>
        Rigor matters less than coverage. Which use cases does the model handle well? Where does it
        consistently fail? What surprising behaviours emerge?
      </BlockQuote>

      <Divider />

      <Section label="The bottleneck isn't the model">
        <P>
          Notion&apos;s AI team went from fixing 3 issues per day to 30 — a 10× improvement — by
          building systematic evals. When a new model drops, they can ship to production in under 24
          hours.
        </P>
        <P>
          The bottleneck on most AI teams isn&apos;t the model. It&apos;s measurement. By the end of
          this course, measurement won&apos;t be the bottleneck for you either.
        </P>
      </Section>

      <Divider />

      {/* CTA */}
      <div className="mt-10">
        <p
          className="font-mono uppercase mb-3"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
        >
          Your first exercise
        </p>
        <p
          className="mb-5"
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: '1.65',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Run a vibe check on the Support Triage Agent. You&apos;ll label 20 real outputs, discover
          the failure patterns described above, and see how your intuitions compare to a senior eval
          engineer&apos;s labels. Takes about 15 minutes.
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <Link
            href="/playground/eval-lab/vibe-check"
            className="font-mono font-medium text-black hover:opacity-90 transition-opacity"
            style={{
              fontSize: '12px',
              letterSpacing: '0.08em',
              background: 'var(--accent)',
              padding: '14px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            RUN A VIBE CHECK →
          </Link>
          <Link
            href="/playground/eval-lab/concept"
            className="font-mono"
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              borderBottom: '0.5px dotted rgba(255,255,255,0.25)',
              textDecoration: 'none',
            }}
          >
            Read the full concept page first
          </Link>
        </div>
      </div>
      <Exercise spec={EVALS_EXERCISES['lesson-1']} />
    </div>
  )
}
