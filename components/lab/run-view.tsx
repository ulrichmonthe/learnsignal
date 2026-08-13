'use client'

import { useState } from 'react'
import { runGraph } from '@/lib/lab/engine'
import type { Graph, Run, NodeExecution } from '@/lib/lab/types'
import { Badge, fmtUsd, fmtMs, fmtSecs } from './lab-ui'

function ExecCard({ ex }: { ex: NodeExecution }) {
  const cls = ex.detected ? 'lab-exec detect' : ex.producedTaint ? 'lab-exec taint' : 'lab-exec'
  return (
    <div className={cls}>
      <div className="lab-exec-top">
        <span className="lab-exec-label">{ex.label}</span>
      </div>
      <div className="lab-exec-badges">
        {ex.detected && <Badge tone="amber">caught</Badge>}
        {ex.producedTaint && !ex.detected && <Badge tone="clay">taint out</Badge>}
        {ex.consumedTaint && !ex.producedTaint && !ex.detected && <Badge tone="neutral">taint in</Badge>}
        {!ex.producedTaint && !ex.consumedTaint && !ex.detected && <Badge tone="neutral">clean</Badge>}
      </div>
      <div className="lab-exec-margin">
        <span>
          <b>cost</b> {fmtUsd(ex.costUsd)}
        </span>
        <span>
          <b>lat</b> {fmtMs(ex.latencyMs)}
        </span>
      </div>
    </div>
  )
}

function ResultBanner({ run }: { run: Run }) {
  const m = run.metrics
  if (run.failureReason) {
    return (
      <div className="lab-banner lab-banner-failed" role="alert">
        <div className="lab-banner-head" style={{ color: 'var(--bad)' }}>✕ Run failed</div>
        <div className="lab-banner-err">{run.failureReason}</div>
        <div className="lab-banner-teach">
          This IS <b>&ldquo;nobody reconciles conflicting outputs&rdquo;</b> — parallel branches wrote the same channel and
          the graph never declared how to merge them.
        </div>
      </div>
    )
  }
  if (m.caughtFailure) {
    return (
      <div className="lab-banner lab-banner-caught">
        <div className="lab-banner-head" style={{ color: 'var(--amber)' }}>▲ Caught failure</div>
        <div className="lab-banner-body">A validator detected the taint and halted the run — loud, recoverable, and cheap.</div>
      </div>
    )
  }
  if (m.silentFailure) {
    return (
      <div className="lab-banner lab-banner-silent">
        <div className="lab-banner-head" style={{ color: 'var(--clay)' }}>● Silent failure</div>
        <div className="lab-banner-body">
          The output is <b>wrong, and no gate caught it</b>. It shipped looking exactly like a good run.
        </div>
      </div>
    )
  }
  if (m.capTripped) {
    return (
      <div className="lab-banner lab-banner-caught">
        <div className="lab-banner-head" style={{ color: 'var(--amber)' }}>▲ Step cap tripped</div>
        <div className="lab-banner-body">The graph hit its step cap before completing.</div>
      </div>
    )
  }
  return (
    <div className="lab-banner lab-banner-correct">
      <div className="lab-banner-head" style={{ color: 'var(--acc)' }}>✓ Correct</div>
      <div className="lab-banner-body">Output carries no taint. One clean run — but one run tells you almost nothing.</div>
    </div>
  )
}

export function RunView({ graph }: { graph: Graph }) {
  const [seed, setSeed] = useState(graph.config.seed)
  const [run, setRun] = useState<Run | null>(null)

  return (
    <div>
      <div className="lab-ctl">
        <div className="lab-field">
          <label htmlFor="lab-seed">seed</label>
          <input
            id="lab-seed"
            className="lab-input"
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
          />
        </div>
        <button type="button" className="lab-btn" onClick={() => setRun(runGraph(graph, seed))}>
          Run once →
        </button>
        {run && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>
            seed {run.seed} · {run.superSteps.length} super-steps
          </span>
        )}
      </div>

      {!run ? (
        <div className="lab-panel" style={{ color: 'var(--t3)', fontSize: 13 }}>
          Press <span className="mono" style={{ color: 'var(--t2)' }}>Run once</span> to execute the graph one time and
          watch the super-steps resolve.
        </div>
      ) : (
        <>
          <div className="lab-panel">
            <div className="lab-seclabel">Timeline · one column per super-step</div>
            <div className="lab-scroll">
              <div className="lab-cols">
                {run.superSteps.map((s, si) => (
                  <div key={s.index} style={{ display: 'contents' }}>
                    <div className="lab-tlcol">
                      <div className="lab-col-h">
                        <span>step {s.index}</span>
                        <span>{fmtMs(s.stepLatencyMs)}</span>
                      </div>
                      {s.executions.map((ex, ei) => (
                        <ExecCard key={`${ex.nodeId}-${ei}`} ex={ex} />
                      ))}
                    </div>
                    {si < run.superSteps.length - 1 && <span className="lab-arrow">→</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="lab-runmetrics">
              <div className="lab-runmetric">
                <div className="k">run latency · Σ step maxes</div>
                <div className="v">
                  {fmtMs(run.metrics.latencyMs)} <small>{fmtSecs(run.metrics.latencyMs)}</small>
                </div>
              </div>
              <div className="lab-runmetric">
                <div className="k">run cost · Σ executions</div>
                <div className="v">{fmtUsd(run.metrics.costUsd)}</div>
              </div>
            </div>
          </div>

          <ResultBanner run={run} />
        </>
      )}
    </div>
  )
}
