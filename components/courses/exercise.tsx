'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type {
  ExerciseSpec,
  Verdict,
  Reveal,
  ChoiceOption,
} from '@/lib/courses/exercise-types'
// Client-safe module only — @/lib/calibration/exercise reaches node:crypto,
// which webpack cannot bundle for the browser.
import { parseLessonPath } from '@/lib/calibration/lesson-path'

const ACCENT = 'var(--accent)'

/**
 * Records a committed Commit-Loop decision into the calibration corpus.
 *
 * Course and lesson come from the route, so none of the ~51 `<Exercise />` call
 * sites need to change. Fire-and-forget: the reveal must never wait on this, and
 * a failure must be invisible to the learner.
 */
function captureCommit(args: {
  pathname: string | null
  choiceId: string
  options: ChoiceOption[]
  verdict: Verdict
  confidencePct: number | null
  rationale: string
  timeToDecideMs: number
}) {
  const where = args.pathname ? parseLessonPath(args.pathname) : null
  if (!where) return // not a lesson route — capture nothing rather than a junk row

  void fetch('/api/exercises/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course: where.course,
      lesson: where.lesson,
      choiceId: args.choiceId,
      optionIds: args.options.map((o) => o.id),
      optionLabels: args.options.map((o) => o.label),
      expertVerdict: args.verdict,
      confidencePct: args.confidencePct,
      rationale: args.rationale.trim() || null,
      timeToDecideMs: args.timeToDecideMs,
    }),
  }).catch(() => {})
}

/** Optional confidence control. Stays null until touched — a default would
 *  record an opinion the learner never expressed. */
function ConfidenceField({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const BANDS: Array<{ label: string; pct: number }> = [
    { label: 'Not sure', pct: 25 },
    { label: 'Fairly sure', pct: 60 },
    { label: 'Confident', pct: 90 },
  ]
  return (
    <div className="mt-4">
      <p
        className="font-mono uppercase mb-2"
        style={{ fontSize: '8.5px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}
      >
        How sure are you? · optional
      </p>
      <div className="flex gap-2 flex-wrap">
        {BANDS.map((b) => (
          <button
            key={b.pct}
            type="button"
            disabled={disabled}
            onClick={() => onChange(b.pct)}
            aria-pressed={value === b.pct}
            className="tap rounded px-3 py-1.5 disabled:cursor-default"
            style={{
              fontSize: '11.5px',
              fontFamily: 'var(--font-dm-sans)',
              border: `0.5px solid ${value === b.pct ? 'rgba(200,240,64,0.5)' : 'rgba(255,255,255,0.14)'}`,
              background: value === b.pct ? 'rgba(200,240,64,0.08)' : 'transparent',
              color: value === b.pct ? ACCENT : 'rgba(255,255,255,0.55)',
              opacity: disabled && value !== b.pct ? 0.4 : 1,
            }}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  'on-it': { label: 'On it', color: 'rgb(200,240,64)' },
  directional: { label: 'Directionally right', color: 'rgb(240,200,80)' },
  miss: { label: 'Instructive miss', color: 'rgb(240,140,120)' },
}

// ── Shared chrome ───────────────────────────────────────────────────────────

function Eyebrow({ type, dimensions }: { type: string; dimensions: string[] }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <p
        className="font-mono uppercase"
        style={{ fontSize: '10px', letterSpacing: '0.14em', color: ACCENT }}
      >
        Interactive Exercise · {type}
      </p>
      <div className="flex gap-1.5">
        {dimensions.map((d) => (
          <span
            key={d}
            className="font-mono uppercase"
            style={{
              fontSize: '8.5px',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
              border: '0.5px solid rgba(255,255,255,0.14)',
              borderRadius: '3px',
              padding: '2px 6px',
            }}
          >
            {d.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stake({ children }: { children: string }) {
  return (
    <p
      className="mb-5"
      style={{
        fontSize: '15px',
        lineHeight: '1.65',
        color: 'rgba(255,255,255,0.82)',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {children}
    </p>
  )
}

function CommitButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-mono font-medium rounded px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ fontSize: '11px', letterSpacing: '0.08em', background: ACCENT, color: 'black' }}
    >
      {children}
    </button>
  )
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const meta = VERDICT_META[verdict]
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: '9px',
        letterSpacing: '0.12em',
        color: meta.color,
        border: `0.5px solid ${meta.color}55`,
        background: `${meta.color}12`,
        borderRadius: '4px',
        padding: '3px 8px',
      }}
    >
      {meta.label}
    </span>
  )
}

function RevealBody({
  reveal,
  replay,
  verdict,
  verdictNote,
  extra,
}: {
  reveal: Reveal
  replay: string
  verdict?: Verdict
  verdictNote?: string
  extra?: React.ReactNode
}) {
  return (
    <div className="mt-6 pt-5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
      {/* Replay the commitment */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {verdict && <VerdictBadge verdict={verdict} />}
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
          {replay}
        </p>
      </div>

      {verdictNote && (
        <p className="mb-4" style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-dm-sans)' }}>
          {verdictNote}
        </p>
      )}

      {extra}

      {/* Run it forward to the consequence */}
      <RevealRow label="What happens" body={reveal.consequence} />
      {/* Name the principle */}
      <RevealRow label="The principle" body={reveal.principle} />

      {/* The KEEP line */}
      <div
        className="mt-5 rounded-lg p-4"
        style={{ background: 'rgba(200,240,64,0.06)', border: '0.5px solid rgba(200,240,64,0.25)' }}
      >
        <p className="font-mono uppercase mb-2" style={{ fontSize: '9px', letterSpacing: '0.14em', color: ACCENT }}>
          Keep this
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.5', color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--font-dm-sans)', fontStyle: 'italic' }}>
          {reveal.keep}
        </p>
      </div>
    </div>
  )
}

function RevealRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono uppercase mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', lineHeight: '1.65', color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-dm-sans)' }}>
        {body}
      </p>
    </div>
  )
}

function Shell({
  type,
  dimensions,
  stake,
  children,
}: {
  type: string
  dimensions: string[]
  stake: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-lg p-6 my-9"
      style={{ border: '0.5px solid rgba(200,240,64,0.22)', background: 'rgba(200,240,64,0.025)' }}
    >
      <Eyebrow type={type} dimensions={dimensions} />
      <Stake>{stake}</Stake>
      {children}
    </div>
  )
}

// ── Optional rationale field ────────────────────────────────────────────────

function RationaleField({
  value,
  onChange,
  prompt,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  prompt: string
  disabled: boolean
}) {
  return (
    <div className="mt-4">
      <label className="font-mono uppercase block mb-2" style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
        {prompt}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        placeholder="One sentence…"
        className="w-full rounded p-3 disabled:opacity-60"
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.85)',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.14)',
          fontFamily: 'var(--font-dm-sans)',
          resize: 'vertical',
        }}
      />
    </div>
  )
}

// ── CHOICE / PREDICT-CHOICE ─────────────────────────────────────────────────

function ChoiceExerciseView({
  spec,
}: {
  spec: Extract<ExerciseSpec, { kind: 'choice' | 'predict-choice' }>
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [rationale, setRationale] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [committed, setCommitted] = useState(false)
  const requiresRationale = spec.kind === 'choice' && !!spec.rationale
  const selected = spec.options.find((o) => o.id === picked) as ChoiceOption | undefined

  const pathname = usePathname()
  // Timed from first engagement, not from mount: the exercise sits far down a
  // long lesson, so mount-time would record time-on-page and be meaningless
  // next to the scenario surface's genuine time-to-decide.
  const engagedAt = useRef<number | null>(null)
  // Ref, not state: a second click in the same frame would pass a state-based
  // guard because the re-render hasn't flushed yet.
  const committing = useRef(false)

  function pick(id: string) {
    if (committed) return
    if (engagedAt.current === null) engagedAt.current = Date.now()
    setPicked(id)
  }

  function commit() {
    if (committing.current || committed || !selected) return
    committing.current = true
    setCommitted(true)
    captureCommit({
      pathname,
      choiceId: selected.id,
      options: spec.options,
      verdict: selected.verdict,
      confidencePct: confidence,
      rationale,
      timeToDecideMs: Date.now() - (engagedAt.current ?? Date.now()),
    })
  }

  return (
    <Shell type={spec.type} dimensions={spec.dimensions} stake={spec.stake}>
      <p className="mb-3" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)' }}>
        {spec.commitPrompt}
      </p>

      <div className="flex flex-col gap-2">
        {spec.options.map((o) => {
          const isPicked = picked === o.id
          const show = committed && isPicked
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={committed}
              className="text-left rounded-lg p-3.5 transition-colors disabled:cursor-default"
              style={{
                border: `0.5px solid ${isPicked ? 'rgba(200,240,64,0.5)' : 'rgba(255,255,255,0.12)'}`,
                background: isPicked ? 'rgba(200,240,64,0.06)' : 'rgba(255,255,255,0.015)',
                opacity: committed && !isPicked ? 0.4 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 rounded-full mt-0.5"
                  style={{
                    width: 14,
                    height: 14,
                    border: `1.5px solid ${isPicked ? ACCENT : 'rgba(255,255,255,0.3)'}`,
                    background: isPicked ? ACCENT : 'transparent',
                  }}
                />
                <span style={{ fontSize: '14px', lineHeight: '1.5', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-dm-sans)' }}>
                  {o.label}
                </span>
              </div>
              {show && (
                <div className="mt-3 ml-7 flex items-start gap-2 flex-wrap">
                  <VerdictBadge verdict={o.verdict} />
                  <span style={{ fontSize: '13px', lineHeight: '1.55', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm-sans)' }}>
                    {o.feedback}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {requiresRationale && spec.kind === 'choice' && spec.rationale && (
        <RationaleField value={rationale} onChange={setRationale} prompt={spec.rationale.prompt} disabled={committed} />
      )}

      {picked && <ConfidenceField value={confidence} onChange={setConfidence} disabled={committed} />}

      {!committed && (
        <div className="mt-5">
          <CommitButton
            disabled={!picked || (requiresRationale && rationale.trim().length < 3)}
            onClick={commit}
          >
            Commit
          </CommitButton>
        </div>
      )}

      {committed && selected && (
        <RevealBody
          reveal={spec.reveal}
          replay={`You committed to: ${selected.label}`}
          verdict={selected.verdict}
          extra={
            requiresRationale && spec.kind === 'choice' && spec.rationale && rationale.trim() ? (
              <div className="mb-4 rounded p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                <p className="font-mono uppercase mb-1" style={{ fontSize: '8.5px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>
                  Your reasoning · the tell
                </p>
                <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)' }}>
                  {spec.rationale.tell}
                </p>
              </div>
            ) : undefined
          }
        />
      )}
    </Shell>
  )
}

// ── PREDICT-NUMBER ──────────────────────────────────────────────────────────

function PredictNumberView({
  spec,
}: {
  spec: Extract<ExerciseSpec, { kind: 'predict-number' }>
}) {
  const mid = Math.round((spec.min + spec.max) / 2)
  const [value, setValue] = useState(mid)
  const [committed, setCommitted] = useState(false)

  const verdict: Verdict = !committed
    ? 'miss'
    : value === spec.actual || (value >= spec.band[0] && value <= spec.band[1] && Math.abs(value - spec.actual) <= Math.abs(spec.band[1] - spec.band[0]) / 4)
      ? 'on-it'
      : value >= spec.band[0] && value <= spec.band[1]
        ? 'directional'
        : 'miss'

  const pct = (n: number) => ((n - spec.min) / (spec.max - spec.min)) * 100

  return (
    <Shell type={spec.type} dimensions={spec.dimensions} stake={spec.stake}>
      <p className="mb-4" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)' }}>
        {spec.commitPrompt}
      </p>

      <div className="flex items-center gap-4 mb-2">
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={value}
          disabled={committed}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#C8F040' }}
        />
        <span className="font-mono" style={{ fontSize: '15px', color: ACCENT, minWidth: '70px', textAlign: 'right' }}>
          {value}{spec.unit ?? ''}
        </span>
      </div>

      {committed && (
        <div className="relative mb-2" style={{ height: '26px' }}>
          {/* actual marker */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${pct(spec.actual)}%`, transform: 'translateX(-50%)' }}
          >
            <span style={{ width: '2px', height: '10px', background: ACCENT }} />
            <span className="font-mono" style={{ fontSize: '10px', color: ACCENT, whiteSpace: 'nowrap' }}>
              actual {spec.actual}{spec.unit ?? ''}
            </span>
          </div>
        </div>
      )}

      {!committed && (
        <div className="mt-5">
          <CommitButton disabled={false} onClick={() => setCommitted(true)}>
            Lock prediction
          </CommitButton>
        </div>
      )}

      {committed && (
        <RevealBody
          reveal={spec.reveal}
          replay={`You predicted ${value}${spec.unit ?? ''}. The actual answer is ${spec.actual}${spec.unit ?? ''}.`}
          verdict={verdict}
          verdictNote={spec.result}
        />
      )}
    </Shell>
  )
}

// ── RANK ────────────────────────────────────────────────────────────────────

function RankView({ spec }: { spec: Extract<ExerciseSpec, { kind: 'rank' }> }) {
  const [order, setOrder] = useState<string[]>(spec.items.map((i) => i.id))
  const [committed, setCommitted] = useState(false)

  const move = (idx: number, dir: -1 | 1) => {
    if (committed) return
    const next = [...order]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setOrder(next)
  }

  const labelOf = (id: string) => spec.items.find((i) => i.id === id)?.label ?? id
  const correctIdx = (id: string) => spec.correctOrder.indexOf(id)
  const matches = order.filter((id, i) => correctIdx(id) === i).length
  const verdict: Verdict = matches === order.length ? 'on-it' : matches >= Math.ceil(order.length / 2) ? 'directional' : 'miss'

  return (
    <Shell type={spec.type} dimensions={spec.dimensions} stake={spec.stake}>
      <p className="mb-3" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)' }}>
        {spec.commitPrompt}
      </p>

      <div className="flex flex-col gap-2">
        {order.map((id, idx) => {
          const right = committed && correctIdx(id) === idx
          const wrong = committed && correctIdx(id) !== idx
          return (
            <div
              key={id}
              className="flex items-center gap-3 rounded-lg p-3"
              style={{
                border: `0.5px solid ${right ? 'rgba(200,240,64,0.5)' : wrong ? 'rgba(240,140,120,0.4)' : 'rgba(255,255,255,0.12)'}`,
                background: right ? 'rgba(200,240,64,0.05)' : 'rgba(255,255,255,0.015)',
              }}
            >
              <span className="font-mono" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', minWidth: '18px' }}>
                {idx + 1}
              </span>
              <span className="flex-1" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-dm-sans)' }}>
                {labelOf(id)}
              </span>
              {committed && wrong && (
                <span className="font-mono" style={{ fontSize: '10px', color: 'rgba(240,140,120,0.85)' }}>
                  → should be #{correctIdx(id) + 1}
                </span>
              )}
              {!committed && (
                <span className="flex flex-col gap-0.5">
                  <button onClick={() => move(idx, -1)} className="hover:opacity-70" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>▲</button>
                  <button onClick={() => move(idx, 1)} className="hover:opacity-70" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>▼</button>
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!committed && (
        <div className="mt-5">
          <CommitButton disabled={false} onClick={() => setCommitted(true)}>
            Commit ranking
          </CommitButton>
        </div>
      )}

      {committed && (
        <RevealBody
          reveal={spec.reveal}
          replay={`You matched ${matches} of ${order.length} positions to the high-leverage order.`}
          verdict={verdict}
          verdictNote={spec.rationale}
        />
      )}
    </Shell>
  )
}

// ── REFLECT ─────────────────────────────────────────────────────────────────

function ReflectView({ spec }: { spec: Extract<ExerciseSpec, { kind: 'reflect' }> }) {
  const [text, setText] = useState('')
  const [committed, setCommitted] = useState(false)

  return (
    <Shell type={spec.type} dimensions={spec.dimensions} stake={spec.stake}>
      <p className="mb-3" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)' }}>
        {spec.commitPrompt}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={committed}
        rows={4}
        placeholder="Commit your answer before revealing…"
        className="w-full rounded p-3 disabled:opacity-70"
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.85)',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.14)',
          fontFamily: 'var(--font-dm-sans)',
          resize: 'vertical',
        }}
      />

      {!committed && (
        <div className="mt-5">
          <CommitButton disabled={text.trim().length < 10} onClick={() => setCommitted(true)}>
            Commit &amp; reveal
          </CommitButton>
        </div>
      )}

      {committed && (
        <RevealBody
          reveal={spec.reveal}
          replay="Compare your answer against what a strong one contains:"
          extra={
            <ul className="mb-4 flex flex-col gap-2">
              {spec.modelAnswer.map((m, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span style={{ color: ACCENT, fontSize: '13px', lineHeight: '1.6' }}>→</span>
                  <span style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-dm-sans)' }}>{m}</span>
                </li>
              ))}
            </ul>
          }
        />
      )}
    </Shell>
  )
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

export function Exercise({ spec }: { spec: ExerciseSpec }) {
  switch (spec.kind) {
    case 'choice':
    case 'predict-choice':
      return <ChoiceExerciseView spec={spec} />
    case 'predict-number':
      return <PredictNumberView spec={spec} />
    case 'rank':
      return <RankView spec={spec} />
    case 'reflect':
      return <ReflectView spec={spec} />
  }
}
