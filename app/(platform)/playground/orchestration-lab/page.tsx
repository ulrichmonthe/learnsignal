'use client'

import { useMemo, useState } from 'react'
import { getPreset } from '@/lib/lab/presets'
import { LabStyles } from '@/components/lab/lab-ui'
import { PresetPicker } from '@/components/lab/preset-picker'
import { GraphView } from '@/components/lab/graph-view'
import { RunView } from '@/components/lab/run-view'
import { SimulateView } from '@/components/lab/simulate-view'

// NOTE (future optimization): the engine is fast enough (~100ms for 1,000 runs)
// to run on the main thread. If graphs grow or sim counts climb, move runGraph /
// simulate into a Web Worker so the reveal animations never jank.

type Mode = 'graph' | 'run' | 'simulate'

const MODES: { id: Mode; label: string }[] = [
  { id: 'graph', label: 'The graph' },
  { id: 'run', label: 'Run once' },
  { id: 'simulate', label: 'Run 1,000' },
]

export default function OrchestrationLabPage() {
  const [presetId, setPresetId] = useState('invoice-pipeline')
  const [mode, setMode] = useState<Mode>('graph')

  const graph = useMemo(() => getPreset(presetId), [presetId])

  return (
    <div className="lab">
      <LabStyles />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 20px 96px' }}>
        {/* Header */}
        <div className="lab-eyebrow">The Orchestration Lab · Track 02</div>
        <h1 className="lab-title">See what the graph actually costs</h1>
        <p className="lab-frame">
          Don&apos;t calculate the cost curve. <em>Run it.</em> Every preset is a real LangGraph-shaped orchestration —
          pick one, read its structure, then run it once or a thousand times.
        </p>

        {/* Preset picker — the landing */}
        <div style={{ marginTop: 26 }}>
          <PresetPicker selected={presetId} onSelect={setPresetId} />
        </div>

        {/* Modes */}
        <div className="lab-tabs" role="tablist" aria-label="Lab modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              className="lab-tab"
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {!graph ? (
          <div className="lab-panel" style={{ color: 'var(--clay)' }}>
            Preset not found.
          </div>
        ) : (
          <>
            {mode === 'graph' && <GraphView graph={graph} />}
            {mode === 'run' && <RunView graph={graph} />}
            {mode === 'simulate' && <SimulateView graph={graph} />}
          </>
        )}

        <p className="lab-foot">
          Runs are simulated, seeded, and free — no model is called. Same graph + same seed = same run, every time.
        </p>
      </div>
    </div>
  )
}
