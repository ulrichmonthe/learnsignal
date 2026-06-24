'use client'

import type { ScoreResult, SavedVersion } from '@/lib/pce-lab/types'

interface Props {
  score: ScoreResult
  targetScore: number
  versions: SavedVersion[]
  attemptCount: number
  attemptsAllowed: number | 'unlimited'
  missionComplete: boolean
  completionSynthesis: string
}

function scoreColor(n: number) {
  if (n >= 90) return 'var(--accent)'
  if (n >= 80) return '#4ade80'
  if (n >= 60) return '#f59e0b'
  return '#ef4444'
}

function DimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span className="font-mono" style={{ fontSize: '11px', color }}>
          {value}
        </span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  )
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export default function ScoreDashboard({
  score,
  targetScore,
  versions,
  attemptCount,
  attemptsAllowed,
  missionComplete,
  completionSynthesis,
}: Props) {
  const gap = targetScore - score.composite
  const pqColor = scoreColor(score.promptQuality)
  const ceColor = scoreColor(score.contextEfficiency)
  const psColor = scoreColor(score.productionSafety)
  const compositeColor = scoreColor(score.composite)

  // Last 5 versions for delta log
  const recentVersions = [...versions].reverse().slice(0, 5)

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto" style={{ gap: 0 }}>

      {/* Mission complete banner */}
      {missionComplete && (
        <div
          className="rounded-lg p-3 mb-4"
          style={{ background: 'rgba(200,240,64,0.08)', border: '0.5px solid rgba(200,240,64,0.3)' }}
        >
          <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--accent)' }}>
            Mission complete ✓
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.55', fontFamily: 'var(--font-dm-sans)', fontStyle: 'italic' }}>
            {completionSynthesis}
          </p>
        </div>
      )}

      {/* Composite score */}
      <div className="mb-5 text-center">
        <p className="font-mono uppercase mb-2" style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.3)' }}>
          Signal Score
        </p>
        <div
          className="font-display font-medium leading-none mb-2"
          style={{ fontSize: '64px', color: compositeColor, fontStyle: 'italic', transition: 'color 0.4s' }}
        >
          {score.composite}
        </div>

        {/* Score bar */}
        <div
          className="rounded-full overflow-hidden mx-auto mb-2"
          style={{ height: '4px', background: 'rgba(255,255,255,0.08)', width: '120px' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score.composite}%`, background: compositeColor }}
          />
        </div>

        {/* Target indicator */}
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
            Target
          </span>
          <span className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
            {targetScore}
          </span>
          {gap > 0 ? (
            <span className="font-mono" style={{ fontSize: '10px', color: '#f59e0b' }}>
              −{gap} pts
            </span>
          ) : (
            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent)' }}>
              ✓ reached
            </span>
          )}
        </div>
      </div>

      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />

      {/* Three dimension bars */}
      <DimBar label="Prompt Quality" value={score.promptQuality} color={pqColor} />
      <DimBar label="Context Efficiency" value={score.contextEfficiency} color={ceColor} />
      <DimBar label="Production Safety" value={score.productionSafety} color={psColor} />

      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />

      {/* Attempt counter */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono uppercase" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>
          Attempts
        </span>
        <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
          {attemptCount}{attemptsAllowed !== 'unlimited' ? ` / ${attemptsAllowed}` : ''}
          {attemptsAllowed === 'unlimited' && (
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>unlimited</span>
          )}
        </span>
      </div>

      {/* Delta log */}
      {recentVersions.length > 0 && (
        <>
          <p className="font-mono uppercase mb-2" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>
            Delta Log
          </p>
          <div className="space-y-1.5 mb-4">
            {recentVersions.map((v, i) => {
              const prev = recentVersions[i + 1]
              const delta = prev ? v.score.composite - prev.score.composite : v.score.composite - score.composite
              const isFirst = i === recentVersions.length - 1
              return (
                <div key={v.id} className="flex items-center gap-2 py-1">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '10px',
                      color: delta > 0 ? '#4ade80' : delta < 0 ? '#ef4444' : 'rgba(255,255,255,0.3)',
                      minWidth: '36px',
                    }}
                  >
                    {isFirst ? `${v.score.composite}` : delta > 0 ? `+${delta}` : `${delta}`}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </span>
                  <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    {timeAgo(v.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Ticket pass rate */}
      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />
      <div className="flex items-center justify-between">
        <span className="font-mono uppercase" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>
          Tickets passing
        </span>
        <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
          {score.ticketResults.filter(t => t.pass).length} / {score.ticketResults.length}
        </span>
      </div>
    </div>
  )
}
