// Eval — §6.7. LOAD-BEARING. Three independent, composable functions.
// scoreRetrieval and scoreGeneration are separate so Mission 5 (L7) can show
// them independently, and scoreMultiHop (Mission 12 / L15) reuses both.

import type {
  Chunk, Span, ScoredChunk, GeneratedAnswer, Query,
  RetrievalScore, GenerationScore, HopResult, MultiHopScore,
} from './types'
import { spanOverlapFraction } from './retrieve'

// ─────────────────────────────────────────────────────────────────────────────
// §6.7 — chunkIsGold
// ─────────────────────────────────────────────────────────────────────────────

export function chunkIsGold(chunk: Chunk, goldSpans: Span[]): boolean {
  return goldSpans.some(s => spanOverlapFraction(chunk, s) >= 0.5)
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.7 — scoreRetrieval
// Operates on the full ranked list (pre-threshold and post-threshold).
// precision and recall are over *fedToLLM* chunks.
// ─────────────────────────────────────────────────────────────────────────────

export function scoreRetrieval(
  ranked: ScoredChunk[],
  goldSpans: Span[],
): RetrievalScore {
  const fed = ranked.filter(sc => sc.fedToLLM)

  const goldInFed = fed.filter(sc => chunkIsGold(sc.chunk, goldSpans)).length
  const totalGoldInCorpus = ranked.filter(sc => chunkIsGold(sc.chunk, goldSpans)).length

  const precision = fed.length === 0 ? 0 : goldInFed / fed.length
  const recall = totalGoldInCorpus === 0 ? 1 : goldInFed / totalGoldInCorpus
  const f1 =
    precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)

  const goldHit = goldInFed > 0

  return { precision, recall, f1, goldHit }
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.7 — scoreGeneration
// Operates on GeneratedAnswer.claims.
// ─────────────────────────────────────────────────────────────────────────────

export function scoreGeneration(
  answer: GeneratedAnswer,
  query: Query,
): GenerationScore {
  const totalGoldClaims = query.goldClaims.length
  const supportedClaims = answer.claims.filter(
    c => !c.isHallucinated
  ).length
  const hallucinatedClaims = answer.claims.filter(c => c.isHallucinated).length

  const correctness =
    totalGoldClaims === 0 ? 1 : supportedClaims / totalGoldClaims

  const totalAnswerClaims = answer.claims.length
  const groundedness =
    totalAnswerClaims === 0
      ? 1
      : (totalAnswerClaims - hallucinatedClaims) / totalAnswerClaims

  return { correctness, groundedness, hallucinatedClaims }
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.7 — scoreMultiHop (Mission 12 / L15)
// ─────────────────────────────────────────────────────────────────────────────

export function scoreMultiHop(
  hops: HopResult[],
  finalAnswer: GeneratedAnswer,
  query: Query,
): MultiHopScore {
  const perHop = hops.map(hop => {
    const retrieval = scoreRetrieval(hop.retrieval.ranked, query.goldSpans)
    return {
      hopIndex: hop.hopIndex,
      goldHit: retrieval.goldHit,
      f1: retrieval.f1,
    }
  })

  // Find the first hop where a hallucination was introduced
  let fabricatedAtHop: number | null = null
  for (const hop of hops) {
    const anyHallucinated = hop.answer.claims.some(c => c.isHallucinated)
    if (anyHallucinated) {
      fabricatedAtHop = hop.hopIndex
      break
    }
  }

  const genScore = scoreGeneration(finalAnswer, query)
  const finalCorrectness = genScore.correctness

  return { perHop, fabricatedAtHop, finalCorrectness }
}
