// Lesson body for the Agent Orchestration course, Module block 5.
// AOLesson11Body  ← source Module 9 (Capstone: the orchestration review)
// Server component — no 'use client'.

import type { ReactNode } from 'react'
import {
  Section,
  P,
  SubHead,
  Divider,
  BlockQuote,
  CodeBlock,
} from '@/components/courses/lesson-helpers'

// Local bulleted list for the review agenda — tight, accent-marked.
function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: '0', padding: '0' }} className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            aria-hidden
            style={{ color: 'var(--accent)', fontSize: '13px', lineHeight: '1.7', opacity: 0.7 }}
          >
            ·
          </span>
          <span
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: '1.7',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

// The timed section header — minute budget in the accent mono style.
function Timed({ title, minutes }: { title: string; minutes: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-8 mb-3">
      <h3 className="font-display font-medium text-text" style={{ fontSize: '18px' }}>
        {title}
      </h3>
      <span
        className="font-mono uppercase"
        style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}
      >
        {minutes}
      </span>
    </div>
  )
}

export function AOLesson11Body() {
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
        Everything in this course converges on a single meeting: a team proposes an agent
        architecture and you have forty minutes to work out whether it will survive production. This
        lesson is the meeting. An agenda ordered so the binding constraint gets its time, a one-page
        record you leave with, a checklist you run before launch — and the ten sentences that are
        still true after every framework in the field has been replaced.
      </p>

      <Section label="Why this is the capstone">
        <P>
          The failure mode of an architecture review is not asking bad questions. It is asking good
          questions in a random order and running out of time before the one that mattered. Need,
          shape, reliability, economics, state, autonomy — each of those can sink a system on its
          own, and each depends on the answers above it. Reliability is meaningless until you know
          the shape. Economics is unknowable until you know the completion rate reliability sets.
          Autonomy is the last question because it is the one you can only answer once the other five
          are on the table.
        </P>
        <P>
          So run them in the order the constraints bind. Not the order that is comfortable, not the
          order the team wants to present in. The order below is the order a system fails in.
        </P>
      </Section>

      <Divider />

      <Section label="The review agenda">
        <P>
          Six sections, forty minutes, timed. The clock is the point — it forces the room to spend
          its attention where the risk is, not where the enthusiasm is.
        </P>

        <Timed title="1 · Do we need this at all?" minutes="5 min" />
        <Bullets
          items={[
            <>What can these N agents do that one agent with N tools could not?</>,
            <>
              Which item on the decomposition test is the concrete yes, with a number?
            </>,
            <>What would the single-agent version cost us?</>,
          ]}
        />

        <Timed title="2 · Shape and failure mode" minutes="7 min" />
        <Bullets
          items={[
            <>
              Which of the five patterns is this? If composed, which two — and who owns the
              end-to-end metric?
            </>,
            <>Name the failure mode this shape has by construction.</>,
            <>Which parts of the route are decided by our code, and which by the model?</>,
          ]}
        />

        <Timed title="3 · Reliability" minutes="8 min" />
        <Bullets
          items={[
            <>Measured accuracy per stage, on a golden set?</>,
            <>End-to-end, measured not derived?</>,
            <>
              What does our product actually need, and what per-stage accuracy does the error budget
              demand?
            </>,
            <>
              What validates between stages, and does a caught error halt, retry or escalate?
            </>,
            <>Where does uncertainty go at each handoff?</>,
          ]}
        />

        <Timed title="4 · Economics" minutes="7 min" />
        <Bullets
          items={[
            <>Cost per completed task, and our ceiling given price and margin?</>,
            <>Cache hit rate — and when was it last verified after a prompt change?</>,
            <>Which frontier-model calls have a verifiable right answer?</>,
            <>Weekly spend on abandoned requests?</>,
            <>
              Per-request cap, per-user cap, kill switch — and when were they last tested?
            </>,
          ]}
        />

        <Timed title="5 · State and operations" minutes="6 min" />
        <Bullets
          items={[
            <>What resumes if this dies mid-run?</>,
            <>What happens if an action-taking step runs twice?</>,
            <>Which of the six kinds of state does the framework own?</>,
            <>Can you show me the trace for a specific run from last month?</>,
          ]}
        />

        <Timed title="6 · Autonomy and exposure" minutes="7 min" />
        <Bullets
          items={[
            <>What is the 24-hour blast radius?</>,
            <>Reversibility class of the most consequential action?</>,
            <>Detection latency, and detected by what?</>,
            <>Every untrusted&rarr;write path, and the control on each?</>,
            <>Is any checkpoint here passed in under fifteen seconds?</>,
          ]}
        />

        <BlockQuote>
          Forty minutes. If you run out, you ran out in the right order.
        </BlockQuote>
      </Section>

      <Divider />

      <Section label="The topology record — your exit artefact">
        <P>
          You do not leave the review with a decision. You leave with a document. One page per
          system, a living artefact, reviewed quarterly. Every field it leaves blank is a question
          the team has not answered — and the blanks are the point, the same way the UNMEASUREDs
          were the point in every exercise before this one.
        </P>
        <CodeBlock>{`SYSTEM:                                    OWNER:            DATE:

TOPOLOGY
  Pattern(s):
  Nodes:                          Route decided by: code / model / both
  End-to-end metric owner:

RELIABILITY
  Per-stage accuracy:                       [UNKNOWN counts]
  End-to-end measured:            Target:
  Per-stage requirement from error budget:
  Gates: where / type / halt|retry|escalate

ECONOMICS
  Cost per request:               Completion rate:
  COST PER COMPLETED TASK:        Ceiling:
  Abandonment waste/week:         Cache hit rate:
  Caps: per-request / per-user / kill switch — last tested:

STATE
  Framework:                      Owns:
  We own:
  Resume behaviour:               Idempotency keys: y/n
  Trace retention:                Per-claim provenance: y/n

AUTONOMY
  Highest rung in use:            Blast radius (24h):
  Reversibility class:            Detection latency:
  Checkpoints: where / median review time

EXPOSURE
  Untrusted->write paths:         Controls:
  Broadest credential holder:     ASI IDs:

TOP THREE RISKS          NEXT ACTION          OWNER          DATE
1.
2.
3.`}</CodeBlock>
      </Section>

      <Divider />

      <Section label="The pre-launch checklist">
        <P>
          Ten items. Any &quot;no&quot; is a launch conversation, not a ticket — because each one of
          these is a way the system fails silently in front of a customer, and none of them is
          something you retrofit calmly after the incident.
        </P>
        <CodeBlock>{`  1.  End-to-end accuracy measured on a golden set, not derived from stage estimates.
  2.  Every stage that can fail silently has a gate; caught errors halt or escalate
      rather than pass through.
  3.  Cost per completed task known, and under the ceiling implied by price and margin.
  4.  Prompt caching on, hit rate verified this month.
  5.  Per-request and per-user budget caps live and tested.
  6.  Kill switch exists, has a named owner, and has been pulled in a test within
      the last quarter.
  7.  Traces retained long enough to answer a customer question six weeks later,
      with per-claim provenance on factual output.
  8.  Idempotency keys on every action-taking step.
  9.  Autonomy grant written, signed and dated for every write-capable action.
 10.  Every untrusted->write path has a control that is not "we told the model not to."`}</CodeBlock>
      </Section>

      <Divider />

      <Section label="The diagnostic, revisited">
        <P>
          Go back to the three questions you wrote down in the very first lesson, before any of this
          had a name. Here is what you now know that you did not then.
        </P>

        <SubHead>1 · Five stages at 95% is 77.4%, not 95%</SubHead>
        <P>
          End-to-end accuracy is the product of per-stage accuracy, not the average. If you answered
          the first question by averaging, you were in good company — and you now understand exactly
          why the demo lied, and why four clean runs in a row was a coin flip that landed your way.
        </P>

        <SubHead>2 · Fan-out costs more than budgeted, and you can name how</SubHead>
        <P>
          Through duplicated, uncached context sent across every branch; through paying for all N
          branches on requests the user abandons; through branches whose value nobody has measured;
          and through straggler tails that tempt you toward more parallelism rather than less. Four
          named mechanisms where in Module 0 you could offer three guesses.
        </P>

        <SubHead>3 · Blast radius — the one that ends careers</SubHead>
        <P>
          The maximum money, data or damage your most autonomous agent could cause in 24 hours,
          starting at 2am on a Sunday. If you could not answer this in the first lesson and you can
          now write it down — as max value per action times max actions before someone notices —
          that is the single highest-value thing this course gave you. Everything else was in service
          of being able to fill in that one line honestly.
        </P>
      </Section>

      <Divider />

      <Section label="What to remember when the frameworks have all changed">
        <P>
          The framework table in this course has a shelf life of about two quarters. The five
          patterns will be renamed. The vendors will consolidate. None of that touches the ten
          sentences below — they are properties of the arithmetic, not of the tooling, and they are
          the last thing this course asks you to keep.
        </P>
        <div className="my-6 space-y-4">
          {[
            'You are not choosing a framework. You are choosing a failure mode and a cost curve.',
            'Most teams that need multi-agent need one agent with better tools.',
            'End-to-end accuracy is the product, not the average. Fewer stages beats better stages.',
            "Cost per token is the vendor's unit. Cost per completed task is yours.",
            'Own your state and framework choice stays reversible.',
            'Same model plus same context equals one opinion, billed N times.',
            'Reversibility justifies autonomy more than accuracy does.',
            'A checkpoint nobody has time to use is worse than no checkpoint.',
            'Untrusted content reaching an action-taking node is the shape that hurts you.',
            'If nobody owns the end-to-end number, nobody owns the system.',
          ].map((line, i) => (
            <div key={i} className="flex items-baseline gap-4">
              <span
                className="font-mono"
                style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  opacity: 0.6,
                  minWidth: '22px',
                  textAlign: 'right',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="font-display"
                style={{
                  fontSize: '17px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: '1.55',
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
        <BlockQuote>
          You did not come here to learn a framework. You came to learn how to interrogate an
          architecture, cost it, predict how it breaks, and decide how much autonomy it gets. Those
          skills survive the churn. On Monday, book the forty minutes.
        </BlockQuote>
      </Section>
    </div>
  )
}
