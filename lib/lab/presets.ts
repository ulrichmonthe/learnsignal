import type { Graph, LabNode, Channel, Edge, Tier, NodeKind } from './types'

// Compact node factory with sane defaults.
function n(id: string, label: string, over: Partial<LabNode> = {}): LabNode {
  return {
    id,
    label,
    kind: (over.kind ?? 'llm') as NodeKind,
    tier: (over.tier ?? 'frontier') as Tier,
    accuracy: over.accuracy === undefined ? 0.97 : over.accuracy,
    latency: over.latency ?? { median_ms: 2600, sigma: 0.3 },
    tokensIn: over.tokensIn ?? 3000,
    tokensOut: over.tokensOut ?? 400,
    cacheFrac: over.cacheFrac ?? 0,
    cacheEnabled: over.cacheEnabled ?? false,
    reads: over.reads ?? [],
    writes: over.writes ?? [],
    retries: over.retries ?? 0,
    idempotent: over.idempotent ?? true,
    detectRate: over.detectRate,
    onDetect: over.onDetect,
    ingestsUntrusted: over.ingestsUntrusted ?? false,
    canWrite: over.canWrite ?? false,
    credentials: over.credentials ?? [],
    interrupt: over.interrupt,
  }
}

const ch = (key: string, reducer: Channel['reducer'], readBy: string[] = [], priv = false): Channel => ({
  key,
  reducer,
  private: priv,
  readBy,
})

// ── invoice-pipeline (Scenario 1, M0, M3) ───────────────────────────────────
// Five stages at 97.5%. Seeded so 1,000 runs measure ≈ 88.1% end-to-end —
// 0.975^5. This number is asserted in CI (spec §8).
function invoicePipeline(): Graph {
  const stages = [
    { id: 'extract', label: 'Extract line items', read: 'raw', write: 'items' },
    { id: 'match', label: 'Match to POs', read: 'items', write: 'po_match' },
    { id: 'resolve', label: 'Resolve customer ID', read: 'po_match', write: 'customer_id' },
    { id: 'flag', label: 'Flag discrepancies', read: 'customer_id', write: 'discrepancies' },
    { id: 'draft', label: 'Draft resolution email', read: 'discrepancies', write: 'email' },
  ]
  const nodes = stages.map((s) =>
    n(s.id, s.label, { accuracy: 0.975, reads: [s.read], writes: [s.write], canWrite: s.id === 'draft' }),
  )
  const channels: Channel[] = [
    ch('raw', 'overwrite', ['extract']),
    ch('items', 'overwrite', ['match']),
    ch('po_match', 'overwrite', ['resolve']),
    ch('customer_id', 'overwrite', ['flag']),
    ch('discrepancies', 'overwrite', ['draft']),
    ch('email', 'overwrite', []),
  ]
  const edges: Edge[] = []
  for (let i = 0; i < stages.length - 1; i++) edges.push({ kind: 'normal', from: stages[i].id, to: stages[i + 1].id })
  return {
    id: 'invoice-pipeline',
    name: 'Invoice reconciliation',
    pattern: 'pipeline',
    channels,
    nodes,
    edges,
    config: { checkpointer: false, stepCap: 50, budgetCapPerRequest: null, seed: 1 },
  }
}

// ── fanout-conflict (M2b) — the InvalidUpdateError teaching ──────────────────
function fanoutConflict(): Graph {
  const branches = ['b1', 'b2', 'b3', 'b4']
  const nodes: LabNode[] = [
    n('req', 'Request', { kind: 'code', accuracy: null, reads: ['input'], writes: ['ctx'] }),
    ...branches.map((b, i) => n(b, `Branch ${i + 1}`, { reads: ['ctx'], writes: ['result'] })),
    n('rec', 'Reconciler', { kind: 'code', accuracy: null, reads: ['result'], writes: ['output'], canWrite: true }),
  ]
  const channels: Channel[] = [
    ch('input', 'overwrite', ['req']),
    ch('ctx', 'overwrite', branches),
    ch('result', 'none', ['rec']), // ← no reducer: parallel writes will fail
    ch('output', 'overwrite', []),
  ]
  const edges: Edge[] = [
    ...branches.map((b): Edge => ({ kind: 'normal', from: 'req', to: b })),
    ...branches.map((b): Edge => ({ kind: 'normal', from: b, to: 'rec' })),
  ]
  return {
    id: 'fanout-conflict',
    name: 'Fan-out (no reconciler)',
    pattern: 'fanout',
    channels,
    nodes,
    edges,
    config: { checkpointer: false, stepCap: 50, budgetCapPerRequest: null, seed: 1 },
  }
}

// ── doc-intel-fanout (Scenario 2, M4, M8) — cost ────────────────────────────
function docIntelFanout(): Graph {
  const branches = [
    { id: 'classify', label: 'Classify', out: 'c_class' },
    { id: 'extract', label: 'Extract entities', out: 'c_ent' },
    { id: 'policy', label: 'Check policy', out: 'c_policy' },
    { id: 'retrieve', label: 'Retrieve precedent', out: 'c_prec' },
    { id: 'risk', label: 'Assess risk', out: 'c_risk' },
    { id: 'draft', label: 'Draft', out: 'c_draft' },
    { id: 'format', label: 'Format', out: 'c_fmt' },
  ]
  const nodes: LabNode[] = [
    n('req', 'Upload', { kind: 'code', accuracy: null, reads: ['doc'], writes: ['ctx'], ingestsUntrusted: true }),
    ...branches.map((b) =>
      n(b.id, b.label, {
        accuracy: 0.973,
        reads: ['ctx'],
        writes: [b.out],
        tokensIn: 9000,
        tokensOut: 500,
        cacheFrac: 0.67, // 6k of 9k is a shared prefix…
        cacheEnabled: false, // …but caching is OFF (the finding)
      }),
    ),
    n('merge', 'Reconciler', {
      kind: 'code',
      accuracy: null,
      reads: branches.map((b) => b.out),
      writes: ['output'],
      canWrite: true,
      credentials: ['payments'],
    }),
  ]
  const channels: Channel[] = [
    ch('doc', 'overwrite', ['req']),
    ch('ctx', 'overwrite', branches.map((b) => b.id)),
    ...branches.map((b) => ch(b.out, 'merge', ['merge'])),
    ch('output', 'overwrite', []),
  ]
  const edges: Edge[] = [
    ...branches.map((b): Edge => ({ kind: 'normal', from: 'req', to: b.id })),
    ...branches.map((b): Edge => ({ kind: 'normal', from: b.id, to: 'merge' })),
  ]
  return {
    id: 'doc-intel-fanout',
    name: 'Document intelligence (fan-out)',
    pattern: 'fanout',
    channels,
    nodes,
    edges,
    config: { checkpointer: false, stepCap: 50, budgetCapPerRequest: null, seed: 1 },
  }
}

// ── Pattern demos (M2) — one clean example of each shape ─────────────────────
function patternPipeline(): Graph {
  const g = invoicePipeline()
  return { ...g, id: 'pattern-pipeline', name: 'Pipeline' }
}
function patternFanout(): Graph {
  const g = docIntelFanout()
  return { ...g, id: 'pattern-fanout', name: 'Fan-out' }
}

export const PRESETS: Record<string, () => Graph> = {
  'invoice-pipeline': invoicePipeline,
  'fanout-conflict': fanoutConflict,
  'doc-intel-fanout': docIntelFanout,
  'pattern-pipeline': patternPipeline,
  'pattern-fanout': patternFanout,
}

export const PRESET_LIST = [
  { id: 'invoice-pipeline', name: 'Invoice reconciliation', blurb: 'Five-stage pipeline at 97.5%. Scenario 1.', pattern: 'pipeline' },
  { id: 'doc-intel-fanout', name: 'Document intelligence', blurb: 'Seven-branch fan-out, caching off. Scenario 2.', pattern: 'fanout' },
  { id: 'fanout-conflict', name: 'Fan-out, no reducer', blurb: 'Parallel writes to one channel. It fails — on purpose.', pattern: 'fanout' },
]

export function getPreset(id: string): Graph | null {
  const f = PRESETS[id]
  return f ? f() : null
}
