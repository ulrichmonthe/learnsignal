'use client'

import type { ContextBlueprintRow } from '@/lib/pce-lab/types'

interface Props {
  rows: ContextBlueprintRow[]
  onChange: (rows: ContextBlueprintRow[]) => void
}

type Move = ContextBlueprintRow['move']

const MOVE_COLORS: Record<Move, string> = {
  stable:   'rgba(200,240,64,0.8)',
  write:    '#60a5fa',
  select:   '#a78bfa',
  compress: '#f59e0b',
  volatile: '#fb923c',
  isolate:  '#f87171',
}

const MOVE_BG: Record<Move, string> = {
  stable:   'rgba(200,240,64,0.06)',
  write:    'rgba(96,165,250,0.06)',
  select:   'rgba(167,139,250,0.06)',
  compress: 'rgba(245,158,11,0.06)',
  volatile: 'rgba(251,146,60,0.06)',
  isolate:  'rgba(248,113,113,0.06)',
}

const MOVE_DESCRIPTIONS: Record<Move, string> = {
  stable:   'Cached at session start. Zero per-turn cost.',
  write:    'Injected fresh every turn. Highest accuracy.',
  select:   'Retrieved at runtime — pick the right chunks.',
  compress: 'Summarised before injection. Saves budget.',
  volatile: 'Changes every turn. Cannot be cached.',
  isolate:  'Sandboxed to prevent prompt injection.',
}

const MOVES: Move[] = ['stable', 'write', 'select', 'compress', 'volatile', 'isolate']

function moveUp(rows: ContextBlueprintRow[], idx: number): ContextBlueprintRow[] {
  if (idx === 0) return rows
  const next = [...rows]
  ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
  return next
}

function moveDown(rows: ContextBlueprintRow[], idx: number): ContextBlueprintRow[] {
  if (idx === rows.length - 1) return rows
  const next = [...rows]
  ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
  return next
}

export default function ContextBlueprint({ rows, onChange }: Props) {
  function updateRow(id: string, updates: Partial<ContextBlueprintRow>) {
    onChange(rows.map(r => (r.id === id ? { ...r, ...updates } : r)))
  }

  const totalBudget = rows.reduce((sum, r) => {
    const n = parseInt(r.budget, 10)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  const budgetColor =
    totalBudget > 3000 ? '#ef4444' : totalBudget > 2000 ? '#f59e0b' : 'rgba(255,255,255,0.35)'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p
          className="font-mono uppercase"
          style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)' }}
        >
          Context Blueprint
        </p>
        <span
          className="font-mono"
          style={{ fontSize: '10px', color: budgetColor }}
          title="Total estimated token budget across all context sources"
        >
          ~{totalBudget}t
        </span>
      </div>

      {/* Legend strip */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MOVES.map(m => (
          <span
            key={m}
            className="font-mono rounded px-1.5 py-0.5"
            style={{
              fontSize: '8px',
              color: MOVE_COLORS[m],
              background: MOVE_BG[m],
              border: `0.5px solid ${MOVE_COLORS[m]}40`,
            }}
            title={MOVE_DESCRIPTIONS[m]}
          >
            {m}
          </span>
        ))}
      </div>

      {/* Blueprint rows */}
      <div className="space-y-1">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="rounded-lg overflow-hidden"
            style={{
              border: `0.5px solid ${MOVE_COLORS[row.move]}30`,
              background: MOVE_BG[row.move],
            }}
          >
            {/* Row header (always visible) */}
            <div className="flex items-center gap-2 px-2.5 py-2">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5" style={{ flexShrink: 0 }}>
                <button
                  onClick={() => onChange(moveUp(rows, idx))}
                  disabled={idx === 0}
                  style={{
                    fontSize: '7px',
                    color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                    background: 'none',
                    border: 'none',
                    cursor: idx === 0 ? 'default' : 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => onChange(moveDown(rows, idx))}
                  disabled={idx === rows.length - 1}
                  style={{
                    fontSize: '7px',
                    color:
                      idx === rows.length - 1
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(255,255,255,0.3)',
                    background: 'none',
                    border: 'none',
                    cursor: idx === rows.length - 1 ? 'default' : 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ▼
                </button>
              </div>

              {/* Position index */}
              <span
                className="font-mono"
                style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', minWidth: '12px' }}
              >
                {idx + 1}
              </span>

              {/* Source name */}
              <span
                style={{
                  flex: 1,
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.65)',
                  fontFamily: 'var(--font-dm-sans)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.source}
              >
                {row.source}
              </span>

              {/* Move badge */}
              <span
                className="font-mono rounded px-1.5 py-0.5 flex-shrink-0"
                style={{
                  fontSize: '8px',
                  color: MOVE_COLORS[row.move],
                  background: 'rgba(0,0,0,0.3)',
                  border: `0.5px solid ${MOVE_COLORS[row.move]}50`,
                }}
              >
                {row.move}
              </span>
            </div>

            {/* Editable controls row */}
            <div
              className="flex items-center gap-2 px-2.5 pb-2"
              style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}
            >
              {/* Move select */}
              <div className="flex items-center gap-1">
                <label
                  className="font-mono"
                  style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}
                >
                  move
                </label>
                <select
                  value={row.move}
                  onChange={e => updateRow(row.id, { move: e.target.value as Move })}
                  className="font-mono rounded"
                  style={{
                    fontSize: '9px',
                    color: MOVE_COLORS[row.move],
                    background: 'rgba(0,0,0,0.4)',
                    border: `0.5px solid ${MOVE_COLORS[row.move]}40`,
                    padding: '1px 4px',
                    outline: 'none',
                  }}
                >
                  {MOVES.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget input */}
              <div className="flex items-center gap-1">
                <label
                  className="font-mono"
                  style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}
                >
                  budget
                </label>
                <input
                  type="text"
                  value={row.budget}
                  onChange={e => updateRow(row.id, { budget: e.target.value })}
                  className="font-mono rounded"
                  style={{
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.55)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    padding: '1px 5px',
                    width: '52px',
                    outline: 'none',
                  }}
                  placeholder="~0t"
                />
              </div>

              {/* Notes */}
              <input
                type="text"
                value={row.notes}
                onChange={e => updateRow(row.id, { notes: e.target.value })}
                className="font-mono rounded"
                style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.05)',
                  padding: '1px 5px',
                  flex: 1,
                  minWidth: 0,
                  outline: 'none',
                }}
                placeholder="notes..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Move reference footer */}
      <div
        className="mt-3 rounded p-2"
        style={{
          background: 'rgba(255,255,255,0.01)',
          border: '0.5px solid rgba(255,255,255,0.04)',
        }}
      >
        <p
          className="font-mono uppercase mb-1.5"
          style={{ fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}
        >
          Move reference
        </p>
        {MOVES.map(m => (
          <div key={m} className="flex items-start gap-1.5 mb-0.5">
            <span
              className="font-mono flex-shrink-0"
              style={{ fontSize: '8px', color: MOVE_COLORS[m], minWidth: '52px' }}
            >
              {m}
            </span>
            <span
              style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-dm-sans)',
                lineHeight: '1.4',
              }}
            >
              {MOVE_DESCRIPTIONS[m]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
