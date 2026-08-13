import { Rng } from './prng'
import { DEFAULT_PRICING } from './pricing'
import type {
  Graph,
  LabNode,
  Edge,
  PricingTable,
  Run,
  SuperStep,
  NodeExecution,
  Tier,
} from './types'

// ── Cost (spec §4.2) ────────────────────────────────────────────────────────
export function nodeCost(node: LabNode, pricing: PricingTable): { costUsd: number; cachedTokens: number } {
  const price = pricing.tiers[node.tier as Tier]
  const cacheOn = node.cacheEnabled ? 1 : 0
  const cachedIn = node.tokensIn * node.cacheFrac * cacheOn
  const uncachedIn = node.tokensIn - cachedIn
  const cost =
    (uncachedIn * price.in +
      cachedIn * price.in * pricing.cacheReadMultiplier +
      node.tokensOut * price.out) /
    1e6
  return { costUsd: cost, cachedTokens: cachedIn }
}

function rngInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng.float() * (hi - lo + 1))
}

function incomingCount(graph: Graph): Map<string, number> {
  const m = new Map<string, number>()
  graph.nodes.forEach((n) => m.set(n.id, 0))
  for (const e of graph.edges) {
    const tos = e.kind === 'normal' || e.kind === 'send' ? [e.to] : e.to
    for (const t of tos) m.set(t, (m.get(t) ?? 0) + 1)
  }
  return m
}

function outgoing(graph: Graph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.from === nodeId)
}

/**
 * Run one graph once with a fixed seed. Deterministic: same graph + seed = same
 * run. Implements LangGraph's super-step semantics over probabilistic nodes,
 * so latency (max in a step), cost (Σ executions) and reliability (taint reaching
 * output) all fall out of the execution model rather than being calculated.
 */
export function runGraph(graph: Graph, seed: number, pricing: PricingTable = DEFAULT_PRICING): Run {
  const rng = new Rng(seed)
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const chan = new Map(graph.channels.map((c) => [c.key, c]))
  const incoming = incomingCount(graph)
  const stepCap = graph.config.stepCap ?? 1000
  const budget = graph.config.budgetCapPerRequest

  // Start nodes = no incoming edges.
  let active: string[] = graph.nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id)

  const tainted = new Set<string>()
  const superSteps: SuperStep[] = []
  let runCost = 0
  let runLatency = 0
  let caughtFailure = false
  let budgetTripped = false
  let capTripped = false
  let failureReason: string | null = null
  let invalidUpdateChannel: string | null = null
  let step = 0

  while (active.length > 0) {
    if (step >= stepCap) {
      capTripped = true
      break
    }
    const taintedBefore = new Set(tainted)
    const executions: NodeExecution[] = []
    // channelKey -> { count, anyTaint } collected across this step's writes
    const stepWrites = new Map<string, { count: number; anyTaint: boolean }>()
    let stepMaxLatency = 0
    let caughtThisStep = false

    for (const nodeId of active) {
      const node = byId.get(nodeId)
      if (!node) continue

      const latencyMs = rng.lognormalMs(node.latency.median_ms, node.latency.sigma)
      const { costUsd, cachedTokens } = nodeCost(node, pricing)
      runCost += costUsd
      stepMaxLatency = Math.max(stepMaxLatency, latencyMs)

      const consumedTaint = node.reads.some((k) => taintedBefore.has(k))
      // accuracy draw: null = UNMEASURED, simulated as always-correct
      const accuracyOk = node.accuracy === null ? true : rng.bool(node.accuracy)

      let detected = false
      let producedTaint: boolean

      if (node.kind === 'validator' && node.detectRate !== undefined) {
        // A validator can catch upstream taint; clean output if it does.
        if (consumedTaint && rng.bool(node.detectRate)) {
          detected = true
          caughtThisStep = true
          producedTaint = false
        } else {
          producedTaint = consumedTaint // undetected taint passes through silently
        }
      } else {
        // Downstream stages decorate upstream errors regardless of their accuracy.
        producedTaint = consumedTaint || !accuracyOk
      }

      for (const key of node.writes) {
        const prev = stepWrites.get(key) ?? { count: 0, anyTaint: false }
        stepWrites.set(key, { count: prev.count + 1, anyTaint: prev.anyTaint || producedTaint })
      }

      executions.push({
        nodeId,
        label: node.label,
        latencyMs: Math.round(latencyMs),
        tokensIn: node.tokensIn,
        tokensOut: node.tokensOut,
        cachedTokens: Math.round(cachedTokens),
        costUsd,
        producedTaint,
        consumedTaint,
        detected,
        retried: 0,
      })
    }

    // Apply reducers. Two writes to an un-reduced channel = InvalidUpdateError.
    for (const [key, w] of stepWrites) {
      const c = chan.get(key)
      const reducer = c?.reducer ?? 'overwrite'
      if (w.count > 1 && reducer === 'none') {
        failureReason =
          `InvalidUpdateError: ${w.count} parallel writes to channel "${key}" with no reducer. ` +
          `Nobody reconciles the conflicting outputs — pick a reducer (append / merge) or a tie-break.`
        invalidUpdateChannel = key
        break
      }
      if (w.anyTaint) tainted.add(key)
      else tainted.delete(key) // a clean overwrite cleans the channel
    }

    runLatency += stepMaxLatency
    superSteps.push({
      index: step,
      executions,
      stepLatencyMs: Math.round(stepMaxLatency),
      channelValuesTainted: [...tainted],
    })

    if (failureReason) break

    if (caughtThisStep) {
      caughtFailure = true
      break // halt on catch (onDetect: halt / escalate)
    }

    if (budget !== null && budget !== undefined && runCost > budget) {
      budgetTripped = true
      break
    }

    // Resolve next active. Normal/conditional/command dedupe; send expands.
    const nextSet = new Set<string>()
    const sendInstances: string[] = []
    for (const nodeId of active) {
      for (const e of outgoing(graph, nodeId)) {
        if (e.kind === 'normal') nextSet.add(e.to)
        else if (e.kind === 'command') e.to.forEach((t) => nextSet.add(t))
        else if (e.kind === 'conditional') {
          const target = e.decidedBy === 'model' ? e.to[Math.floor(rng.float() * e.to.length)] : e.to[0]
          if (target) nextSet.add(target)
        } else if (e.kind === 'send') {
          const k = rngInt(rng, e.itemCountRange[0], e.itemCountRange[1])
          for (let i = 0; i < k; i++) sendInstances.push(e.to)
        }
      }
    }
    active = [...nextSet, ...sendInstances]
    step++
  }

  // Output = channels written by sink nodes (no outgoing edges).
  const sinkIds = graph.nodes.filter((n) => outgoing(graph, n.id).length === 0).map((n) => n.id)
  const outputChannels = new Set<string>()
  for (const id of sinkIds) {
    const n = byId.get(id)
    n?.writes.forEach((k) => outputChannels.add(k))
  }
  const outputTainted =
    outputChannels.size > 0 ? [...outputChannels].some((k) => tainted.has(k)) : tainted.size > 0

  const failed = failureReason !== null
  const status = failed || budgetTripped || capTripped ? (failed ? 'failed' : 'capped') : 'done'
  const correct = !failed && !caughtFailure && !outputTainted
  const silentFailure = !failed && !caughtFailure && outputTainted

  return {
    id: `run_${seed}`,
    graphId: graph.id,
    seed,
    status,
    superSteps,
    failureReason,
    invalidUpdateChannel,
    metrics: {
      costUsd: runCost,
      latencyMs: Math.round(runLatency),
      correct,
      silentFailure,
      caughtFailure,
      superStepCount: superSteps.length,
      budgetTripped,
      capTripped,
    },
  }
}
