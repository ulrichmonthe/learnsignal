// Seeded, deterministic randomness for the Orchestration Lab.
// Same seed → same run, always (spec §4.7, §10). Never use Math.random().

/** mulberry32 — tiny, fast, good-enough seeded PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number
  constructor(seed: number) {
    this.next = mulberry32(seed)
  }
  /** Uniform [0, 1). */
  float(): number {
    return this.next()
  }
  /** True with probability p. */
  bool(p: number): boolean {
    return this.next() < p
  }
  /** Standard normal via Box–Muller. */
  private normal(): number {
    let u = 0
    let v = 0
    while (u === 0) u = this.next()
    while (v === 0) v = this.next()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  /**
   * Lognormal latency with a given median (ms) and sigma (shape). Median maps to
   * the distribution's median exactly; sigma controls the tail (realistic p95).
   */
  lognormalMs(medianMs: number, sigma: number): number {
    const mu = Math.log(Math.max(1, medianMs))
    return Math.exp(mu + sigma * this.normal())
  }
}

/** p-th percentile of a numeric array (p in [0,100]). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}
