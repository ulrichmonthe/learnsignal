// Signal Score formula — §8.1 and §8.2.
// Every term is surfaced to the UI so users see the cost/accuracy trade-off.

import type { RetrievalScore, GenerationScore, ScoredChunk } from './types'
import { CONFIG } from './config'

export interface ScoreBreakdown {
  // Base components (each 0–1 scaled by weight → max 100 total)
  answerCorrectnessPoints: number   // correctness * 50
  groundednessPoints: number        // groundedness * 30
  retrievalQualityPoints: number    // f1 * 20
  baseScore: number                 // sum of above

  // Penalties
  hallucinationPenalty: number
  irrelevantChunkPenalty: number
  overBudgetPenalty: number
  latencyPenalty: number
  totalPenalty: number

  // Final
  signalScore: number    // 0–100
  rating: 'retry' | 'pass' | 'gold'

  // Run cost
  runCost: number
  tokensUsed: number
}

export interface ScoreInputs {
  retrieval: RetrievalScore
  generation: GenerationScore
  ranked: ScoredChunk[]
  runCost: number
  tokensUsed: number      // cumulative for this mission attempt
  latencySec: number
  passThreshold?: number
  budgetTokens?: number   // mission token budget (defaults to the global budget)
}

export function computeSignalScore(inputs: ScoreInputs): ScoreBreakdown {
  const { retrieval, generation, ranked, runCost, tokensUsed, latencySec } = inputs
  const w = CONFIG.score.weights
  const p = CONFIG.score.penalties
  const passThreshold = inputs.passThreshold ?? CONFIG.score.passThreshold

  // ── Base ──────────────────────────────────────────────────────────────────
  const answerCorrectnessPoints = w.answerCorrectness * generation.correctness
  const groundednessPoints = w.groundedness * generation.groundedness
  const retrievalQualityPoints = w.retrievalQuality * retrieval.f1
  const baseScore = answerCorrectnessPoints + groundednessPoints + retrievalQualityPoints

  // ── Penalties ─────────────────────────────────────────────────────────────
  const hallucinationPenalty = p.hallucinationPerClaim * generation.hallucinatedClaims

  const irrelevantFedChunks = ranked.filter(sc => sc.fedToLLM && !sc.isGold).length
  const irrelevantChunkPenaltyRaw = p.irrelevantChunkPenalty * irrelevantFedChunks
  const irrelevantChunkPenalty = Math.min(irrelevantChunkPenaltyRaw, p.irrelevantChunkCap)

  const budget = inputs.budgetTokens ?? CONFIG.budget.perMissionTokens
  const overBudgetTokens = Math.max(0, tokensUsed - budget)
  const overBudgetPenalty = overBudgetTokens * p.overBudgetPerToken

  const latencyOver = Math.max(0, latencySec - CONFIG.score.latencyTargetSec)
  const latencyPenalty = latencyOver * p.latencyPenaltyPerSec

  const totalPenalty = hallucinationPenalty + irrelevantChunkPenalty + overBudgetPenalty + latencyPenalty

  // ── Final ─────────────────────────────────────────────────────────────────
  const raw = baseScore - totalPenalty
  const signalScore = Math.max(0, Math.min(100, Math.round(raw)))

  const rating =
    signalScore >= CONFIG.score.perfectThreshold
      ? 'gold'
      : signalScore >= passThreshold
      ? 'pass'
      : 'retry'

  return {
    answerCorrectnessPoints: Math.round(answerCorrectnessPoints * 10) / 10,
    groundednessPoints: Math.round(groundednessPoints * 10) / 10,
    retrievalQualityPoints: Math.round(retrievalQualityPoints * 10) / 10,
    baseScore: Math.round(baseScore * 10) / 10,
    hallucinationPenalty: Math.round(hallucinationPenalty * 10) / 10,
    irrelevantChunkPenalty: Math.round(irrelevantChunkPenalty * 10) / 10,
    overBudgetPenalty: Math.round(overBudgetPenalty * 10) / 10,
    latencyPenalty: Math.round(latencyPenalty * 10) / 10,
    totalPenalty: Math.round(totalPenalty * 10) / 10,
    signalScore,
    rating,
    runCost,
    tokensUsed,
  }
}

// ── Run cost (§8.2) ──────────────────────────────────────────────────────────

export function computeRunCost(params: {
  fedChunkCount: number
  rerankEnabled: boolean
  candidatePool: number
  cacheDiscount?: number // Mission 13
  cachedChunkCount?: number
}): number {
  const b = CONFIG.budget
  const { fedChunkCount, rerankEnabled, candidatePool, cacheDiscount = 1, cachedChunkCount = 0 } = params
  const regularChunks = fedChunkCount - cachedChunkCount
  return (
    b.perRunBaseTokens +
    b.embeddingCostPerQuery +
    (rerankEnabled ? candidatePool * b.tokensPerRerankCandidate : 0) +
    regularChunks * b.tokensPerRetrievedChunk +
    cachedChunkCount * b.tokensPerRetrievedChunk * cacheDiscount
  )
}

// ── XP award (§8.3) ──────────────────────────────────────────────────────────

export function computeXP(params: {
  rating: 'retry' | 'pass' | 'gold'
  attemptCount: number
  hallucinatedClaims: number
  tokensUsed: number
  streak: number
}): number {
  const { rating, attemptCount, hallucinatedClaims, tokensUsed, streak } = params
  if (rating === 'retry') return 0

  const x = CONFIG.xp
  let xp = x.perMissionPass
  if (rating === 'gold') xp += x.perfectBonus
  if (attemptCount === 1) xp += x.firstTryBonus
  if (hallucinatedClaims === 0) xp += x.noHallucinationBonus
  if (tokensUsed <= CONFIG.budget.perMissionTokens / 2) xp += x.underHalfBudgetBonus

  const streakBonus = Math.min(streak, x.streakCapDays) * x.streakStep
  xp += streakBonus

  return xp
}

// ── Level from total XP (§8.3 triangular formula) ────────────────────────────

export function levelFromXP(totalXP: number): { level: number; xpToNext: number; progress: number } {
  let level = 1
  while (100 * level * (level + 1) / 2 <= totalXP) level++
  const currentThreshold = 100 * (level - 1) * level / 2
  const nextThreshold = 100 * level * (level + 1) / 2
  const xpToNext = nextThreshold - totalXP
  const progress = (totalXP - currentThreshold) / (nextThreshold - currentThreshold)
  return { level, xpToNext, progress: Math.max(0, Math.min(1, progress)) }
}
