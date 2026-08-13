import { runGraph } from './engine'
import { percentile } from './prng'
import { DEFAULT_PRICING } from './pricing'
import type { Graph, PricingTable } from './types'

export interface SimResult {
  runs: number
  measuredAccuracy: number // fraction of runs whose output is correct
  predictedAccuracy: number // Π of stage accuracies (the course's derived value)
  silentFailureRate: number
  caughtFailureRate: number
  conflictFailureRate: number // InvalidUpdateError share
  capTripRate: number
  budgetTripRate: number
  cost: { mean: number; p50: number; p95: number }
  latency: { p50: number; p95: number; p99: number }
  costPerCompletedTask: number
  unmeasuredNodes: number // nodes with accuracy === null (honesty)
}

/** Π of per-stage accuracy — the *predicted* reliability the course teaches. */
export function predictedAccuracy(graph: Graph): number {
  return graph.nodes
    .filter((n) => n.kind !== 'validator' && n.accuracy !== null)
    .reduce((acc, n) => acc * (n.accuracy as number), 1)
}

/** Run the same graph N times with incrementing seeds (spec §4.4). */
export function simulate(
  graph: Graph,
  runs = 1000,
  pricing: PricingTable = DEFAULT_PRICING,
): SimResult {
  const base = graph.config.seed
  let correct = 0
  let silent = 0
  let caught = 0
  let conflict = 0
  let capTrip = 0
  let budgetTrip = 0
  const costs: number[] = []
  const latencies: number[] = []

  for (let i = 0; i < runs; i++) {
    const r = runGraph(graph, base + i, pricing)
    if (r.metrics.correct) correct++
    if (r.metrics.silentFailure) silent++
    if (r.metrics.caughtFailure) caught++
    if (r.invalidUpdateChannel) conflict++
    if (r.metrics.capTripped) capTrip++
    if (r.metrics.budgetTripped) budgetTrip++
    costs.push(r.metrics.costUsd)
    latencies.push(r.metrics.latencyMs)
  }

  const measuredAccuracy = correct / runs
  const mean = costs.reduce((a, b) => a + b, 0) / runs
  return {
    runs,
    measuredAccuracy,
    predictedAccuracy: predictedAccuracy(graph),
    silentFailureRate: silent / runs,
    caughtFailureRate: caught / runs,
    conflictFailureRate: conflict / runs,
    capTripRate: capTrip / runs,
    budgetTripRate: budgetTrip / runs,
    cost: { mean, p50: percentile(costs, 50), p95: percentile(costs, 95) },
    latency: { p50: percentile(latencies, 50), p95: percentile(latencies, 95), p99: percentile(latencies, 99) },
    costPerCompletedTask: measuredAccuracy > 0 ? mean / measuredAccuracy : Infinity,
    unmeasuredNodes: graph.nodes.filter((n) => n.accuracy === null).length,
  }
}

/** Probability of k clean runs in a row given a measured per-run accuracy. */
export function demoLuck(measuredAccuracy: number, k: number): number {
  return Math.pow(measuredAccuracy, k)
}
