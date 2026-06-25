// Shared visual primitives used by all lesson body components.
// Match the aesthetic established in the concept page (eval-lab/concept/page.tsx).

import type { ReactNode } from 'react'

// ── Horizontal rule ──────────────────────────────────────────
export function Divider() {
  return (
    <hr
      className="my-10"
      style={{ border: 'none', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
    />
  )
}

// ── Section with yellow-green label ─────────────────────────
export function Section({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="mb-10">
      <p
        className="font-mono uppercase mb-5"
        style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
      >
        {label}
      </p>
      <div
        className="space-y-4"
        style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.75)',
          lineHeight: '1.7',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {children}
      </div>
    </section>
  )
}

// ── Body paragraph ────────────────────────────────────────────
export function P({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: '16px',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: '1.7',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {children}
    </p>
  )
}

// ── Sub-heading within a section ─────────────────────────────
export function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3
      className="font-display font-medium text-text mt-8 mb-3"
      style={{ fontSize: '18px' }}
    >
      {children}
    </h3>
  )
}

// ── Pull quote with left bar ─────────────────────────────────
export function BlockQuote({
  children,
  attribution,
}: {
  children: ReactNode
  attribution?: string
}) {
  return (
    <div className="my-8">
      <blockquote
        style={{
          borderLeft: '2px solid var(--accent)',
          paddingLeft: '20px',
          margin: 0,
        }}
      >
        <p
          className="italic font-display"
          style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.65' }}
        >
          {children}
        </p>
        {attribution && (
          <p
            className="font-mono mt-3"
            style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}
          >
            — {attribution}
          </p>
        )}
      </blockquote>
    </div>
  )
}

// ── Code / terminal block ─────────────────────────────────────
export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre
      className="font-mono rounded-lg overflow-x-auto my-6"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        padding: '18px 20px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.8',
        whiteSpace: 'pre-wrap',
      }}
    >
      {children}
    </pre>
  )
}

// ── Inline code ───────────────────────────────────────────────
export function Code({ children }: { children: ReactNode }) {
  return (
    <code
      className="font-mono rounded"
      style={{
        background: 'rgba(255,255,255,0.06)',
        padding: '1px 6px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.8)',
      }}
    >
      {children}
    </code>
  )
}

// ── Support Triage Agent context box ─────────────────────────
export function AgentBox() {
  return (
    <div
      className="rounded-lg p-5 my-8"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      <p
        className="font-mono uppercase mb-2"
        style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
      >
        Throughout this course
      </p>
      <p className="font-display font-medium text-text mb-2" style={{ fontSize: '16px' }}>
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
        A background agent that reads incoming support tickets and automatically classifies each
        one by intent, sentiment, and urgency — so specialists see high-priority issues faster.
        Support leads spend ~4 hours/day on this manually. The agent should eliminate that.
      </p>
      <div className="mt-4 space-y-1">
        {[
          'Categorise ticket: Technical / Billing / Feature Request',
          'Assign sentiment: Positive / Neutral / Frustrated / Angry',
          'If Frustrated or Angry: flag for human review with urgency level',
        ].map((task, i) => (
          <div key={i} className="flex items-start gap-2">
            <span style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>
              ·
            </span>
            <p className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
              {task}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Atlas copilot context box ─────────────────────────────────
export function AtlasBox() {
  return (
    <div
      className="rounded-lg p-5 my-8"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      <p
        className="font-mono uppercase mb-2"
        style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
      >
        Throughout this course
      </p>
      <p className="font-display font-medium text-text mb-2" style={{ fontSize: '16px', fontStyle: 'italic' }}>
        Atlas — Acme Analytics support copilot
      </p>
      <p
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: '1.6',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        A doc-grounded support copilot that answers customer questions using only the company
        help center. Every lesson in this course modifies one part of Atlas — its system prompt,
        few-shot set, schema, context assembly, or retrieval pipeline.
      </p>
      <div className="mt-4 space-y-1">
        {[
          'Answer questions using only &lt;context&gt; — never invent features',
          'Return structured JSON: answer, sources, confidence, should_escalate',
          'If context is thin: low confidence + escalate. Never guess.',
        ].map((task, i) => (
          <div key={i} className="flex items-start gap-2">
            <span style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>·</span>
            <p className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
              {task.replace(/&lt;/g, '<').replace(/&gt;/g, '>')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Exercise lead-in block ────────────────────────────────────
export function ExerciseLeadIn({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg p-5 my-8"
      style={{
        border: '0.5px solid rgba(200,240,64,0.25)',
        background: 'rgba(200,240,64,0.03)',
      }}
    >
      <p
        className="font-mono uppercase mb-3"
        style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
      >
        Exercise
      </p>
      <div
        style={{
          fontSize: '14px',
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

// ── "Coming soon" exercise placeholder ───────────────────────
export function ExerciseSoon({ lessonTitle }: { lessonTitle: string }) {
  return (
    <div
      className="rounded-lg p-6 my-8 text-center"
      style={{
        border: '0.5px dashed rgba(200,240,64,0.2)',
        background: 'rgba(200,240,64,0.02)',
      }}
    >
      <p
        className="font-mono uppercase mb-2"
        style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(200,240,64,0.5)' }}
      >
        Interactive Exercise
      </p>
      <p
        className="font-display font-medium"
        style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}
      >
        Coming soon
      </p>
      <p
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        The hands-on exercise for this lesson is under construction.
        <br />
        Read the next lesson to keep building your mental model.
      </p>
    </div>
  )
}

// ── Two-column data table ─────────────────────────────────────
export function DataTable({
  rows,
}: {
  rows: { label: string; value: string; note?: string }[]
}) {
  return (
    <div className="my-6 rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3"
          style={{
            borderBottom: i < rows.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', minWidth: '180px', paddingTop: '2px' }}
          >
            {row.label}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>
              {row.value}
            </p>
            {row.note && (
              <p className="font-mono mt-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                {row.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
