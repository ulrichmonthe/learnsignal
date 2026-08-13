'use client'

import { useState } from 'react'
import { simulate } from '@/lib/lab/montecarlo'
import type { Graph } from '@/lib/lab/types'
import type { SimResult } from '@/lib/lab/montecarlo'
import { fmtUsd, fmtMs, pct } from './lab-ui'
import { DemoLuck } from './demo-luck'

function Stat({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: 'clay' | 'amber' }) {
  return (
    <div className={`lab-stat${tone ? ' ' + tone : ''}`}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

export function SimulateView({ graph }: { graph: Graph }) {
  const [sim, setSim] = useState<SimResult | null>(null)

  const gapPts = sim ? Math.round((sim.predictedAccuracy - sim.measuredAccuracy) * 1000) / 10 : 0
  const gapMatches = Math.abs(gapPts) < 0.5
  const gapLabel = gapMatches ? '≈0pt' : `${gapPts > 0 ? '−' : '+'}${Math.abs(gapPts)}pt`

  return (
    <div>
      <div className="lab-ctl">
        <button type="button" className="lab-btn" onClick={() => setSim(simulate(graph, 1000))}>
          Run 1,000 →
        </button>
        {sim && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>
            {sim.runs.toLocaleString('en-US')} seeded runs · main thread
          </span>
        )}
      </div>

      {!sim ? (
        <div className="lab-panel" style={{ color: 'var(--t3)', fontSize: 13 }}>
          Press <span className="mono" style={{ color: 'var(--t2)' }}>Run 1,000</span> to sweep the graph across a
          thousand seeds and see the distribution behind the demo.
        </div>
      ) : (
        <>
          {/* The single largest number on screen, per spec. */}
          <div className="lab-hero">
            <div className="lab-hero-k">Cost per completed task</div>
            <div className="lab-hero-num">{fmtUsd(sim.costPerCompletedTask)}</div>
            <div className="lab-hero-sub">
              Mean spend <b>{fmtUsd(sim.cost.mean)}</b> ÷ measured accuracy <b>{pct(sim.measuredAccuracy)}</b>. You pay
              for the failures too — this is what a task actually costs.
            </div>
          </div>

          {/* Measured vs predicted Π, with the gap called out. */}
          <div className="lab-gap">
            <div className="lab-gapbox">
              <div className="k">Predicted · Π of stages</div>
              <div className="v" style={{ color: 'var(--t2)' }}>{pct(sim.predictedAccuracy)}</div>
              <div className="note">the number the math promises</div>
            </div>
            <div className="lab-gapcall">
              <div className="d" style={gapMatches ? { color: 'var(--acc)' } : undefined}>{gapLabel}</div>
              <div className="l">{gapMatches ? 'math holds' : 'the gap'}</div>
            </div>
            <div className="lab-gapbox">
              <div className="k">Measured · 1,000 runs</div>
              <div className="v" style={{ color: 'var(--acc)' }}>{pct(sim.measuredAccuracy)}</div>
              <div className="note">what the engine actually delivered</div>
            </div>
          </div>

          <div className="lab-stats">
            <Stat k="Silent failures" v={pct(sim.silentFailureRate)} sub="wrong, uncaught" tone="clay" />
            <Stat k="Caught failures" v={pct(sim.caughtFailureRate)} sub="halted by a gate" tone="amber" />
            {sim.conflictFailureRate > 0 && (
              <Stat k="Conflict failures" v={pct(sim.conflictFailureRate)} sub="InvalidUpdateError" tone="clay" />
            )}
            <Stat k="Cost mean" v={fmtUsd(sim.cost.mean)} sub={`p50 ${fmtUsd(sim.cost.p50)} · p95 ${fmtUsd(sim.cost.p95)}`} />
            <Stat
              k="Latency p50"
              v={fmtMs(sim.latency.p50)}
              sub={`p95 ${fmtMs(sim.latency.p95)} · p99 ${fmtMs(sim.latency.p99)}`}
            />
            {sim.unmeasuredNodes > 0 && (
              <Stat
                k="Unmeasured nodes"
                v={String(sim.unmeasuredNodes)}
                sub="accuracy === null"
                tone="clay"
              />
            )}
          </div>

          <DemoLuck graph={graph} />
        </>
      )}
    </div>
  )
}
