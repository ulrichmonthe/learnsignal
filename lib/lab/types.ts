// Orchestration Lab — object model (spec §3). Framework-agnostic, no React.
// Vocabulary mirrors LangGraph deliberately so learners recognise the words.

export type Reducer = 'overwrite' | 'append' | 'merge' | 'none'
export type Tier = 'frontier' | 'mid' | 'cheap'
export type NodeKind = 'llm' | 'tool' | 'code' | 'router' | 'validator' | 'human' | 'map' | 'subgraph'
export type OnDetect = 'halt' | 'retry' | 'escalate'

export interface Channel {
  key: string
  reducer: Reducer
  private?: boolean // visible in stream, hidden from output — the leak
  readBy: string[] // node ids. Empty on a 'confidence' channel is a finding
}

export interface LabNode {
  id: string
  label: string
  kind: NodeKind
  tier: Tier

  // simulation profile
  accuracy: number | null // null = UNMEASURED (the Lab says so loudly)
  latency: { median_ms: number; sigma: number }
  tokensIn: number
  tokensOut: number
  cacheFrac: number // 0–1 of input that is a stable cached prefix
  cacheEnabled: boolean

  // behaviour
  reads: string[]
  writes: string[]
  retries: number
  idempotent: boolean
  detectRate?: number // validators only: fraction of taint caught
  onDetect?: OnDetect

  // risk flags
  ingestsUntrusted: boolean
  canWrite: boolean
  credentials: string[]

  interrupt?: { before: boolean; after: boolean; reviewSeconds: number; sees: string[] }
}

export type Edge =
  | { kind: 'normal'; from: string; to: string }
  | { kind: 'conditional'; from: string; to: string[]; decidedBy: 'code' | 'model' }
  | { kind: 'send'; from: string; to: string; itemCountRange: [number, number] }
  | { kind: 'command'; from: string; to: string[] } // swarm handoff

export interface PricingTable {
  effectiveDate: string
  tiers: Record<Tier, { in: number; out: number }> // $ per 1e6 tokens
  cacheReadMultiplier: number // fraction of input price paid to read cache
}

export interface GraphConfig {
  checkpointer: boolean
  stepCap: number | null // null = uncapped (compile error on swarm)
  budgetCapPerRequest: number | null
  seed: number
}

export interface Graph {
  id: string
  name: string
  pattern: 'pipeline' | 'fanout' | 'debate' | 'supervisor' | 'swarm' | 'custom'
  channels: Channel[]
  nodes: LabNode[]
  edges: Edge[]
  config: GraphConfig
}

// ── Runtime objects (spec §3) ───────────────────────────────────────────────

export interface NodeExecution {
  nodeId: string
  label: string
  latencyMs: number
  tokensIn: number
  tokensOut: number
  cachedTokens: number
  costUsd: number
  producedTaint: boolean
  consumedTaint: boolean
  detected: boolean
  retried: number
}

export interface SuperStep {
  index: number
  executions: NodeExecution[]
  stepLatencyMs: number // max latency in this super-step
  channelValuesTainted: string[] // channels tainted after this step
}

export type RunStatus = 'done' | 'failed' | 'capped'

export interface RunMetrics {
  costUsd: number
  latencyMs: number
  correct: boolean // output channels carry no taint
  silentFailure: boolean // wrong output that no validator caught
  caughtFailure: boolean // a validator halted/escalated
  superStepCount: number
  budgetTripped: boolean
  capTripped: boolean
}

export interface Run {
  id: string
  graphId: string
  seed: number
  status: RunStatus
  superSteps: SuperStep[]
  failureReason: string | null // e.g. InvalidUpdateError message
  invalidUpdateChannel: string | null
  metrics: RunMetrics
}
