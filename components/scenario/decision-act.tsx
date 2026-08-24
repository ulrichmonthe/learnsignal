'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  id: string
  text: string
  consequence: string
  isExpertPath: boolean
}

export interface DecisionCommit {
  choiceId: string
  rationale: string
  confidencePct: number
  predMajorityId: string | null
  timeToDecideMs: number
}

interface Props {
  options: Option[]
  onDecide: (commit: DecisionCommit) => void
}

const RATIONALE_MIN = 120

export function DecisionAct({ options, onDecide }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [rationale, setRationale] = useState('')
  // Null until the learner actually sets it. Defaulting to a number would record
  // an opinion they never expressed and quietly poison calibration scoring.
  const [confidence, setConfidence] = useState<number | null>(null)
  const [predMajority, setPredMajority] = useState<string | null>(null)
  const startedAt = useRef<number>(Date.now())

  // Time-to-decide runs from the first render of the decision point.
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const remaining = Math.max(0, RATIONALE_MIN - rationale.trim().length)
  const missing = useMemo(() => {
    const m: string[] = []
    if (!selected) m.push('a decision')
    if (remaining > 0) m.push(`${remaining} more characters of reasoning`)
    if (confidence === null) m.push('your confidence')
    if (!predMajority) m.push('your prediction')
    return m
  }, [selected, remaining, confidence, predMajority])

  const ready = missing.length === 0

  function commit() {
    if (!ready || !selected || confidence === null) return
    onDecide({
      choiceId: selected,
      rationale: rationale.trim(),
      confidencePct: confidence,
      predMajorityId: predMajority,
      timeToDecideMs: Date.now() - startedAt.current,
    })
  }

  return (
    <div>
      <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-2">
        Decision point
      </p>
      <h2 className="font-display text-2xl font-black italic text-text mb-6">
        What do you do?
      </h2>

      <div className="space-y-3 mb-8">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            aria-pressed={selected === opt.id}
            className={cn(
              'tap w-full text-left border px-5 py-4',
              selected === opt.id
                ? 'border-accent bg-surface2 text-text'
                : 'border-border text-text2 hover:border-border2 hover:text-text',
            )}
          >
            <span className="font-mono text-xs text-text3 mr-3">
              {String(i + 1).padStart(2, '0')}
            </span>
            {opt.text}
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="rounded-lg p-5 mb-6"
          style={{
            border: '0.5px solid rgba(200,240,64,0.28)',
            background: 'rgba(200,240,64,0.03)',
          }}
        >
          <p className="font-mono text-[10px] text-accent uppercase tracking-wide mb-3">
            Commit your call
          </p>

          {/* Rationale — required. Recorded, never published. */}
          <label className="block mb-1 text-sm text-text">
            Why this call?
          </label>
          <p className="text-text3 text-xs mb-2 leading-relaxed">
            Write it before you see what happens. This is the part that separates a decision
            from a guess — and it&apos;s recorded with your answer.
          </p>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            placeholder="The constraint I'm optimising for is… and I'm accepting the risk that…"
            className="w-full rounded p-3 text-sm mb-1"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border2)',
              color: 'var(--text)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <p
            className="font-mono text-[10px] mb-5"
            style={{ color: remaining > 0 ? 'var(--text3)' : 'var(--accent)' }}
          >
            {remaining > 0
              ? `${remaining} more characters`
              : `${rationale.trim().length} characters ✓`}
          </p>

          {/* Confidence — enables Brier scoring later. */}
          <label htmlFor="confidence" className="block mb-2 text-sm text-text">
            How confident are you?{' '}
            <span className="font-mono text-xs" style={{ color: confidence === null ? 'var(--text3)' : 'var(--accent)' }}>
              {confidence === null ? 'drag to set' : `${confidence}%`}
            </span>
          </label>
          <input
            id="confidence"
            type="range"
            min={0}
            max={100}
            step={5}
            value={confidence ?? 50}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full mb-5"
            style={{ accentColor: 'var(--accent)', opacity: confidence === null ? 0.55 : 1 }}
          />

          {/* Peer prediction — the surprisingly-popular input. */}
          <p className="block mb-2 text-sm text-text">
            What do you think <em>most</em> AI PMs chose?
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => setPredMajority(opt.id)}
                aria-pressed={predMajority === opt.id}
                className={cn(
                  'tap font-mono text-[11px] rounded px-3 py-2 border',
                  predMajority === opt.id
                    ? 'border-accent text-accent'
                    : 'border-border text-text3 hover:text-text2',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={commit}
            disabled={!ready}
            className="tap bg-accent text-bg font-mono text-sm font-medium px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            See what happens →
          </button>
          {!ready && (
            <span className="font-mono text-[11px] text-text3">
              Still needed: {missing.join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
