'use client'

import { useEffect, useRef, useState } from 'react'
import { runGraph } from '@/lib/lab/engine'
import { simulate, demoLuck } from '@/lib/lab/montecarlo'
import type { Graph } from '@/lib/lab/types'
import { pct, useReducedMotion } from './lab-ui'

// The Scenario 1 punchline, delivered by the tool. Runs 4 individual seeded
// runs (the same seeds that begin the 1,000-run sweep), reveals them ✓/✗ one at
// a time, then contrasts your demo luck against the true measured accuracy.
// Everything here calls the real engine — no hard-coded numbers.
interface DemoState {
  demos: { seed: number; correct: boolean }[]
  luck: number // demoLuck(measuredAccuracy, 4)
  measuredAccuracy: number
  cleanCount: number
}

export function DemoLuck({ graph }: { graph: Graph }) {
  const reduced = useReducedMotion()
  const [state, setState] = useState<DemoState | null>(null)
  const [shown, setShown] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const run = () => {
    clearTimers()
    const base = graph.config.seed
    const demos = [0, 1, 2, 3].map((i) => {
      const r = runGraph(graph, base + i)
      return { seed: base + i, correct: r.metrics.correct }
    })
    const sim = simulate(graph, 1000)
    const cleanCount = demos.filter((d) => d.correct).length
    setState({ demos, luck: demoLuck(sim.measuredAccuracy, 4), measuredAccuracy: sim.measuredAccuracy, cleanCount })

    if (reduced) {
      setShown(4)
      setRevealed(true)
      return
    }
    setShown(0)
    setRevealed(false)
    for (let i = 1; i <= 4; i++) timers.current.push(setTimeout(() => setShown(i), i * 520))
    timers.current.push(setTimeout(() => setRevealed(true), 4 * 520 + 420))
  }

  return (
    <div className="lab-demo">
      <div className="lab-demo-title">The demo that lies</div>
      <div className="lab-demo-sub">
        You&apos;re about to show your boss four runs. They&apos;re seeds {graph.config.seed}–{graph.config.seed + 3} — the
        exact runs that start the 1,000-run sweep. Watch them land, then see what you couldn&apos;t.
      </div>

      <div className="lab-demo-chips" aria-live="polite">
        {!state ? (
          <span className="mono" style={{ fontSize: 12, color: 'var(--t3)' }}>4 slots, waiting…</span>
        ) : (
          state.demos.map((d, i) => (
            <div
              key={d.seed}
              className={`lab-demochip ${d.correct ? 'ok' : 'no'} ${i < shown ? 'in' : ''}`}
            >
              <span className="mark">{d.correct ? '✓' : '✗'}</span>
              <span className="sd">seed {d.seed}</span>
            </div>
          ))
        )}
      </div>

      <button type="button" className="lab-btn lab-btn-ghost" onClick={run} style={{ marginTop: 6 }}>
        {state ? 'Run 4 demos again' : 'Run 4 demos'}
      </button>

      {state && (
        <div className={`lab-demo-reveal ${revealed ? 'in' : ''}`}>
          <div className="lab-demo-punch">
            {state.cleanCount === 4 ? 'Four clean runs in a row.' : `${state.cleanCount} of 4 came up clean.`} You had a{' '}
            <b>{pct(state.luck, 0)}</b> chance of 4 clean demos with this graph.
          </div>
          <div className="lab-demo-truth">
            The truth, over 1,000 seeded runs: <b>{pct(state.measuredAccuracy)}</b> end-to-end accuracy. The demo felt
            like a product. The distribution is the product.
          </div>
        </div>
      )}
    </div>
  )
}
