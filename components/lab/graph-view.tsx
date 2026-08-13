'use client'

import { useMemo } from 'react'
import { runGraph } from '@/lib/lab/engine'
import type { Graph, LabNode, Channel } from '@/lib/lab/types'
import { Badge, pct } from './lab-ui'

// Derive super-step columns from a single deterministic run: nodes sharing a
// SuperStep.executions array ran in parallel. Any node the run never reached
// (e.g. the reconciler after a fan-out conflict fails) is surfaced as a final
// "did not execute" column so the structure is never silently hidden.
function useColumns(graph: Graph): { columns: { index: number; nodeIds: string[] }[]; unreached: string[] } {
  return useMemo(() => {
    const run = runGraph(graph, graph.config.seed)
    const seen = new Set<string>()
    const columns = run.superSteps.map((s) => {
      const ids: string[] = []
      for (const ex of s.executions) {
        if (!ids.includes(ex.nodeId)) ids.push(ex.nodeId) // dedupe send fan-out instances
        seen.add(ex.nodeId)
      }
      return { index: s.index, nodeIds: ids }
    })
    const unreached = graph.nodes.filter((n) => !seen.has(n.id)).map((n) => n.id)
    return { columns, unreached }
  }, [graph])
}

function NodeCard({ node }: { node: LabNode }) {
  return (
    <div className="lab-node">
      <div className="lab-node-label">{node.label}</div>
      <div className="lab-node-badges">
        <Badge>{node.kind}</Badge>
        <Badge>{node.tier}</Badge>
        {node.ingestsUntrusted && <Badge tone="bad">untrusted in</Badge>}
        {node.canWrite && <Badge tone="amber">can write</Badge>}
      </div>
      <div className="lab-node-acc">
        {node.accuracy === null ? (
          <span className="lab-unmeasured">UNMEASURED</span>
        ) : (
          <>
            accuracy <span className="lab-accnum">{pct(node.accuracy, node.accuracy * 100 % 1 === 0 ? 0 : 1)}</span>
          </>
        )}
      </div>
    </div>
  )
}

function ChannelRow({ channel, writers }: { channel: Channel; writers: number }) {
  const conflict = channel.reducer === 'none' && writers >= 2
  const confidenceLike = /conf/i.test(channel.key)
  const orphanConfidence = confidenceLike && channel.readBy.length === 0

  return (
    <div className={`lab-chan${conflict ? ' lab-chan-flag' : ''}`}>
      <span className="lab-chan-key">{channel.key}</span>
      <Badge tone={conflict ? 'bad' : 'neutral'}>reducer: {channel.reducer}</Badge>
      {channel.private && <span className="lab-chan-note subtle">private · in stream, hidden from output</span>}
      {conflict && (
        <span className="lab-chan-note bad">
          {writers} writers, no reducer → nobody reconciles the conflict
        </span>
      )}
      {orphanConfidence && (
        <span className="lab-chan-note subtle">confidence signal written, but readBy is empty — nothing gates on it</span>
      )}
      <span className="lab-chan-spacer" />
      <span className="lab-chan-note subtle">
        {writers} writer{writers === 1 ? '' : 's'} · {channel.readBy.length} reader{channel.readBy.length === 1 ? '' : 's'}
      </span>
    </div>
  )
}

export function GraphView({ graph }: { graph: Graph }) {
  const { columns, unreached } = useColumns(graph)
  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph])

  const writerCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of graph.nodes) for (const k of n.writes) m.set(k, (m.get(k) ?? 0) + 1)
    return m
  }, [graph])

  return (
    <div>
      <div className="lab-panel">
        <div className="lab-seclabel">Execution order · {columns.length} super-step{columns.length === 1 ? '' : 's'}</div>
        <div className="lab-scroll">
          <div className="lab-cols">
            {columns.map((col, ci) => (
              <div key={col.index} style={{ display: 'contents' }}>
                <div className="lab-col">
                  <div className="lab-col-h">
                    <span>super-step {col.index}</span>
                    <span>{col.nodeIds.length} node{col.nodeIds.length === 1 ? '' : 's'}</span>
                  </div>
                  {col.nodeIds.map((id) => {
                    const node = byId.get(id)
                    return node ? <NodeCard key={id} node={node} /> : null
                  })}
                </div>
                {ci < columns.length - 1 && <span className="lab-arrow">→</span>}
              </div>
            ))}
            {unreached.length > 0 && (
              <>
                <span className="lab-arrow" style={{ color: 'var(--bad)' }}>⇥</span>
                <div className="lab-col">
                  <div className="lab-col-h">
                    <span style={{ color: 'var(--bad)' }}>did not execute</span>
                    <span>{unreached.length}</span>
                  </div>
                  {unreached.map((id) => {
                    const node = byId.get(id)
                    return node ? (
                      <div key={id} style={{ opacity: 0.5 }}>
                        <NodeCard node={node} />
                      </div>
                    ) : null
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="lab-panel" style={{ marginTop: 14 }}>
        <div className="lab-seclabel">Channels · {graph.channels.length}</div>
        <div className="lab-chans">
          {graph.channels.map((c) => (
            <ChannelRow key={c.key} channel={c} writers={writerCount.get(c.key) ?? 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
