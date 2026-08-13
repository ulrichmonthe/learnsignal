import { describe, it, expect } from 'vitest'
import { runGraph } from '@/lib/lab/engine'
import { simulate, demoLuck, predictedAccuracy } from '@/lib/lab/montecarlo'
import { getPreset } from '@/lib/lab/presets'

describe('engine — determinism', () => {
  it('same graph + same seed = identical run', () => {
    const g = getPreset('invoice-pipeline')!
    const a = runGraph(g, 12345)
    const b = runGraph(g, 12345)
    expect(a.metrics).toEqual(b.metrics)
    expect(a.superSteps.length).toBe(b.superSteps.length)
  })
})

describe('invoice-pipeline — the course numbers (spec §8)', () => {
  const g = getPreset('invoice-pipeline')!

  it('predicts 0.975^5 = 88.1% end-to-end', () => {
    expect(predictedAccuracy(g)).toBeCloseTo(0.881, 2)
  })

  it('measures ~88.1% over 1,000 seeded runs (course & Lab must agree)', () => {
    const sim = simulate(g, 1000)
    // MC noise on 1,000 runs is ~±1pt; keep a tight-but-safe band around 88.1%.
    expect(sim.measuredAccuracy).toBeGreaterThan(0.85)
    expect(sim.measuredAccuracy).toBeLessThan(0.91)
  })

  it('runs as five sequential super-steps (latency = Σ stages)', () => {
    const r = runGraph(g, 7)
    expect(r.metrics.superStepCount).toBe(5)
    expect(r.status).toBe('done')
  })

  it('demo-luck: four clean runs at ~88% is ~60% (Scenario 1 punchline)', () => {
    const sim = simulate(g, 1000)
    expect(demoLuck(sim.measuredAccuracy, 4)).toBeGreaterThan(0.5)
    expect(demoLuck(sim.measuredAccuracy, 4)).toBeLessThan(0.7)
  })
})

describe('fan-out with no reducer — InvalidUpdateError (spec §0, §4.1)', () => {
  it('parallel writes to an un-reduced channel fail the run', () => {
    const g = getPreset('fanout-conflict')!
    const r = runGraph(g, 1)
    expect(r.status).toBe('failed')
    expect(r.invalidUpdateChannel).toBe('result')
    expect(r.failureReason).toMatch(/InvalidUpdateError/)
  })

  it('every seed fails the same way (structural, not probabilistic)', () => {
    const g = getPreset('fanout-conflict')!
    for (const seed of [1, 2, 3, 99, 4471]) {
      expect(runGraph(g, seed).invalidUpdateChannel).toBe('result')
    }
  })
})

describe('taint — downstream stages decorate upstream errors', () => {
  it('a validator converts silent failures into caught (loud) ones', () => {
    const g = getPreset('invoice-pipeline')!
    // Insert a validator after resolve that catches 90% of taint and halts.
    const withGate = structuredClone(g)
    withGate.nodes.push({
      id: 'gate',
      label: 'Customer-ID check',
      kind: 'validator',
      tier: 'cheap',
      accuracy: 1,
      latency: { median_ms: 30, sigma: 0.1 },
      tokensIn: 0,
      tokensOut: 0,
      cacheFrac: 0,
      cacheEnabled: false,
      reads: ['customer_id'],
      writes: ['customer_id'],
      retries: 0,
      idempotent: true,
      detectRate: 0.9,
      onDetect: 'halt',
      ingestsUntrusted: false,
      canWrite: false,
      credentials: [],
    })
    // reroute resolve → gate → flag
    withGate.edges = withGate.edges.filter((e) => !(e.from === 'resolve' && 'to' in e && e.to === 'flag'))
    withGate.edges.push({ kind: 'normal', from: 'resolve', to: 'gate' })
    withGate.edges.push({ kind: 'normal', from: 'gate', to: 'flag' })

    const base = simulate(g, 1000)
    const gated = simulate(withGate, 1000)
    // The gate should cut silent failures materially (some become caught).
    expect(gated.silentFailureRate).toBeLessThan(base.silentFailureRate)
    expect(gated.caughtFailureRate).toBeGreaterThan(0)
  })
})

describe('cost & caching (spec §4.2)', () => {
  it('doc-intel fan-out is expensive; enabling cache lowers spend', () => {
    const g = getPreset('doc-intel-fanout')!
    const off = simulate(g, 200).cost.mean
    const cachedGraph = structuredClone(g)
    cachedGraph.nodes.forEach((node) => {
      if (node.cacheFrac > 0) node.cacheEnabled = true
    })
    const on = simulate(cachedGraph, 200).cost.mean
    expect(on).toBeLessThan(off)
  })
})
