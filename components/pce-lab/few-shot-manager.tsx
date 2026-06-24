'use client'

import { useState } from 'react'
import type { FewShotExample } from '@/lib/pce-lab/types'

interface Props {
  examples: FewShotExample[]
  onChange: (examples: FewShotExample[]) => void
}

const LABEL_COLORS: Record<string, string> = {
  resolve: 'rgba(74,222,128,0.7)',
  escalate: '#f59e0b',
  'low-confidence': 'rgba(255,255,255,0.4)',
}

const LABEL_BG: Record<string, string> = {
  resolve: 'rgba(74,222,128,0.08)',
  escalate: 'rgba(245,158,11,0.08)',
  'low-confidence': 'rgba(255,255,255,0.04)',
}

export default function FewShotManager({ examples, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const escalateCount = examples.filter(e => e.label === 'escalate').length
  const resolveCount = examples.filter(e => e.label === 'resolve').length
  const lowConfCount = examples.filter(e => e.label === 'low-confidence').length

  function updateExample(id: string, updates: Partial<FewShotExample>) {
    onChange(examples.map(e => (e.id === id ? { ...e, ...updates } : e)))
  }

  function removeExample(id: string) {
    onChange(examples.filter(e => e.id !== id))
  }

  function addExample() {
    const newEx: FewShotExample = {
      id: `ex-${Date.now()}`,
      input: '',
      expectedOutput: { answer: '', sources: [], confidence: 'high', should_escalate: false },
      label: 'resolve',
    }
    onChange([...examples, newEx])
    setExpanded(newEx.id)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...examples]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  function moveDown(idx: number) {
    if (idx === examples.length - 1) return
    const next = [...examples]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  const isImbalanced =
    examples.length > 0 &&
    (escalateCount / examples.length > 0.65 || escalateCount / examples.length < 0.2)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono uppercase" style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)' }}>
          Few-Shot Examples
        </p>
        <span className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          {examples.length}
        </span>
      </div>

      {/* Distribution badge */}
      <div
        className="flex items-center gap-3 rounded px-2.5 py-1.5 mb-3"
        style={{
          background: isImbalanced ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.02)',
          border: `0.5px solid ${isImbalanced ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        {[
          { label: 'resolve', count: resolveCount, color: LABEL_COLORS.resolve },
          { label: 'escalate', count: escalateCount, color: LABEL_COLORS.escalate },
          { label: 'low-conf', count: lowConfCount, color: LABEL_COLORS['low-confidence'] },
        ].map(({ label, count, color }) => (
          <span key={label} className="font-mono" style={{ fontSize: '9px', color, whiteSpace: 'nowrap' }}>
            {count} {label}
          </span>
        ))}
        {isImbalanced && (
          <span style={{ fontSize: '9px', color: '#f59e0b', fontFamily: 'var(--font-dm-sans)', marginLeft: 'auto' }}>
            ⚠ imbalanced
          </span>
        )}
      </div>

      {/* Example rows */}
      <div className="space-y-1">
        {examples.map((ex, idx) => (
          <div
            key={ex.id}
            className="rounded-lg overflow-hidden"
            style={{
              border: expanded === ex.id
                ? '0.5px solid rgba(200,240,64,0.2)'
                : '0.5px solid rgba(255,255,255,0.06)',
              background: LABEL_BG[ex.label],
            }}
          >
            {/* Row header */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  style={{ fontSize: '8px', color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: 0 }}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === examples.length - 1}
                  style={{ fontSize: '8px', color: idx === examples.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: idx === examples.length - 1 ? 'default' : 'pointer', padding: 0 }}
                >
                  ▼
                </button>
              </div>

              <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', minWidth: '14px' }}>
                {idx + 1}
              </span>

              <span
                className="font-mono rounded px-1.5 py-0.5 flex-shrink-0"
                style={{ fontSize: '8px', color: LABEL_COLORS[ex.label], background: LABEL_BG[ex.label], border: `0.5px solid ${LABEL_COLORS[ex.label]}40` }}
              >
                {ex.label}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-dm-sans)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ex.input || <em style={{ opacity: 0.5 }}>Empty</em>}
              </span>

              <button
                onClick={e => { e.stopPropagation(); removeExample(ex.id) }}
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            {/* Expanded editor */}
            {expanded === ex.id && (
              <div style={{ padding: '4px 10px 10px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div className="mb-2">
                  <p className="font-mono mb-1" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Input</p>
                  <textarea
                    value={ex.input}
                    onChange={e => updateExample(ex.id, { input: e.target.value })}
                    rows={2}
                    placeholder="Customer message..."
                    className="w-full font-mono rounded"
                    style={{
                      fontSize: '11px',
                      lineHeight: '1.6',
                      color: 'rgba(255,255,255,0.75)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '0.5px solid rgba(255,255,255,0.07)',
                      padding: '6px 8px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="mb-2">
                  <p className="font-mono mb-1" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Expected answer</p>
                  <textarea
                    value={ex.expectedOutput.answer}
                    onChange={e => updateExample(ex.id, { expectedOutput: { ...ex.expectedOutput, answer: e.target.value } })}
                    rows={2}
                    placeholder="What Atlas should answer..."
                    className="w-full font-mono rounded"
                    style={{
                      fontSize: '11px',
                      lineHeight: '1.6',
                      color: 'rgba(255,255,255,0.75)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '0.5px solid rgba(255,255,255,0.07)',
                      padding: '6px 8px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>label</label>
                    <select
                      value={ex.label}
                      onChange={e => updateExample(ex.id, { label: e.target.value as FewShotExample['label'] })}
                      className="font-mono rounded"
                      style={{
                        fontSize: '10px',
                        color: LABEL_COLORS[ex.label],
                        background: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.1)',
                        padding: '2px 6px',
                      }}
                    >
                      <option value="resolve">resolve</option>
                      <option value="escalate">escalate</option>
                      <option value="low-confidence">low-confidence</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ex.expectedOutput.should_escalate}
                      onChange={e => updateExample(ex.id, { expectedOutput: { ...ex.expectedOutput, should_escalate: e.target.checked } })}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>should_escalate</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <label className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>conf</label>
                    <select
                      value={ex.expectedOutput.confidence}
                      onChange={e => updateExample(ex.id, { expectedOutput: { ...ex.expectedOutput, confidence: e.target.value as 'high' | 'low' } })}
                      className="font-mono rounded"
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.55)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.1)',
                        padding: '2px 6px',
                      }}
                    >
                      <option value="high">high</option>
                      <option value="low">low</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add example button */}
      <button
        onClick={addExample}
        className="w-full mt-2 rounded py-2 font-mono transition-colors"
        style={{
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px dashed rgba(255,255,255,0.1)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,240,64,0.3)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'
        }}
      >
        + ADD EXAMPLE
      </button>
    </div>
  )
}
