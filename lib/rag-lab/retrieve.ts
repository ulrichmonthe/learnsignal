// Retrieval engine — §6.2–6.4.
// Uses designed scoring (no runtime embedding model) so the Lab is deterministic and free.
// The scoring functions are calibrated so the spec's acceptance criteria (§14) hold.

import type { Chunk, Query, Span, ScoredChunk, RetrievalResult } from './types'
import type { EmbeddingModelId, RetrievalMethod } from './config'
import { CORPUS } from './corpus'

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic noise (no randomness — same inputs = same output)
// ─────────────────────────────────────────────────────────────────────────────

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

function deterministicNoise(seed: string, range = 0.04): number {
  const h = hashCode(seed)
  // Map hash to [-range, range]
  return ((h & 0xffff) / 0xffff) * 2 * range - range
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold span overlap (used by both retrieval and generation scoring)
// ─────────────────────────────────────────────────────────────────────────────

export function spanOverlapFraction(chunk: Chunk, span: Span): number {
  if (chunk.docId !== span.docId) return 0
  const overlapStart = Math.max(chunk.start, span.start)
  const overlapEnd = Math.min(chunk.end, span.end)
  if (overlapEnd <= overlapStart) return 0
  return (overlapEnd - overlapStart) / (span.end - span.start)
}

export function chunkMaxGoldOverlap(chunk: Chunk, goldSpans: Span[]): number {
  return Math.max(0, ...goldSpans.map(s => spanOverlapFraction(chunk, s)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Lexical overlap (BM25-ish: term frequency in chunk, IDF from corpus)
// ─────────────────────────────────────────────────────────────────────────────

// Build a simple IDF map from the full corpus at module load
const CORPUS_TERM_DOC_FREQ: Map<string, number> = (() => {
  const map = new Map<string, number>()
  const N = CORPUS.length
  for (const doc of CORPUS) {
    const terms = new Set(tokenize(doc.body))
    for (const t of terms) map.set(t, (map.get(t) ?? 0) + 1)
  }
  return map
  function tokenize(text: string): string[] {
    return text.toLowerCase().split(/\W+/).filter(t => t.length > 2)
  }
})()

const CORPUS_N = CORPUS.length

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter(t => t.length > 2)
}

function idf(term: string): number {
  const df = CORPUS_TERM_DOC_FREQ.get(term) ?? 0
  return df === 0 ? 0 : Math.log((CORPUS_N + 1) / (df + 1)) + 1
}

function bm25Score(queryText: string, chunkText: string): number {
  const k1 = 1.2, b = 0.75
  const queryTerms = tokenize(queryText)
  const chunkTerms = tokenize(chunkText)
  const chunkLen = chunkTerms.length
  const avgLen = 200 // approximate average chunk length in words

  let score = 0
  const termFreq = new Map<string, number>()
  for (const t of chunkTerms) termFreq.set(t, (termFreq.get(t) ?? 0) + 1)

  for (const term of queryTerms) {
    const tf = termFreq.get(term) ?? 0
    if (tf === 0) continue
    const numerator = tf * (k1 + 1)
    const denominator = tf + k1 * (1 - b + b * (chunkLen / avgLen))
    score += idf(term) * (numerator / denominator)
  }
  return score
}

function normalizeBm25(scores: number[]): number[] {
  const max = Math.max(...scores, 0.001)
  return scores.map(s => s / max)
}

// ─────────────────────────────────────────────────────────────────────────────
// Dense scoring (designed scoring function calibrated to spec §14 criteria)
// ─────────────────────────────────────────────────────────────────────────────

function getDenseScore(
  query: Query,
  chunk: Chunk,
  model: EmbeddingModelId,
  goldOverlap: number,
): number {
  const lexOverlap = Math.min(1, bm25Score(query.text, chunk.text) / 8)
  const noise = deterministicNoise(chunk.id + query.id + model)

  let base: number

  if (model === 'helix-embed-large') {
    // Strong semantic model.
    if (query.kind === 'exact') {
      // Dense embeddings represent opaque identifiers (codes, "Section 420")
      // poorly: the chunk that actually holds the identifier looks semantically
      // average, so dense actively buries it below generic chunks. Only sparse
      // (lexical term match) or hybrid recovers it.
      base = 0.34 + lexOverlap * 0.02 - goldOverlap * 0.16
    } else {
      // Semantic queries: gold chunks score high on meaning alone, even with
      // zero lexical overlap (e.g. q-lies-for-money).
      base = 0.22 + lexOverlap * 0.18 + goldOverlap * 0.66
    }
  } else {
    // Weak lexical model (mini-lex-32): essentially keyword matching. Strong when
    // the query shares vocabulary with the gold text; blind to pure semantics.
    base = 0.18 + lexOverlap * 0.74 + goldOverlap * 0.06
  }

  return Math.max(0, Math.min(0.99, base + noise))
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission 4 injection: artificially depress gold chunk to rank 6
// ─────────────────────────────────────────────────────────────────────────────

function applyLowRankGoldInjection(
  scored: ScoredChunk[],
  query: Query,
): ScoredChunk[] {
  // Find the top gold chunk and cap its score just below the 6th non-gold chunk
  const goldIdx = scored.findIndex(sc => sc.isGold)
  if (goldIdx < 0) return scored

  // Ensure it sits at position 5 (0-indexed) = rank 6
  if (goldIdx >= 5) return scored

  const result = [...scored]
  const goldItem = { ...result[goldIdx] }
  const rank5Score = result[5]?.score ?? 0.3
  // Depress gold chunk score to just below rank-5 score
  goldItem.score = Math.max(0.01, rank5Score - 0.02)
  goldItem.denseScore = goldItem.score
  result.splice(goldIdx, 1)
  result.splice(5, 0, goldItem)
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Method/model fit (designed discrimination, §6.3).
// The whole engine uses designed scoring (no real embeddings), so retrieval
// *quality* is modeled explicitly: a gold chunk is only surfaced when the chosen
// method and model actually fit the query kind. This makes the lessons bite:
//   • dense alone misses EXACT identifier lookups ("Section 420")
//   • sparse alone misses SEMANTIC queries with no shared vocabulary
//   • the weak lexical model misses semantic queries
//   • hybrid (with a balanced alpha) and the strong model serve both
// ─────────────────────────────────────────────────────────────────────────────

type Fit = 'hit' | 'miss'

function goldFit(
  method: RetrievalMethod,
  model: EmbeddingModelId,
  kind: Query['kind'],
  alpha: number,
): Fit {
  // The weak lexical model cannot represent pure semantics.
  if (model === 'mini-lex-32' && kind === 'semantic') return 'miss'

  if (kind === 'exact') {
    if (method === 'dense') return 'miss'          // dense buries opaque identifiers
    if (method === 'sparse') return 'hit'          // lexical term match nails it
    return alpha <= 0.7 ? 'hit' : 'miss'           // hybrid needs some sparse weight
  }
  if (kind === 'semantic') {
    if (method === 'sparse') return 'miss'         // no shared vocabulary
    if (method === 'dense') return 'hit'
    return alpha >= 0.3 ? 'hit' : 'miss'           // hybrid needs some dense weight
  }
  return 'hit' // multi-hop and any other kind: served by any method
}

// Reposition gold chunk(s) to the top (hit) or below any reasonable top-k (miss),
// and set a coherent display score. Mirrors applyLowRankGoldInjection's approach.
function applyGoldFit(scored: ScoredChunk[], fit: Fit): ScoredChunk[] {
  const golds = scored.filter(sc => sc.isGold)
  if (golds.length === 0) return scored
  const rest = scored.filter(sc => !sc.isGold)

  if (fit === 'hit') {
    golds.forEach((sc, i) => { sc.score = 0.92 - i * 0.01; sc.denseScore = sc.score })
    return [...golds, ...rest]
  }
  // miss: push gold below the top 8 distractors so no realistic top-k feeds it
  golds.forEach(sc => { sc.score = 0.12; sc.denseScore = sc.score })
  return [...rest.slice(0, 8), ...golds, ...rest.slice(8)]
}

// ─────────────────────────────────────────────────────────────────────────────
// Reranker simulation (§6.4): cross-encoder-style: cosine on strong model +
// exact-term overlap boost, so it can rescue a gold chunk ranked low by dense.
// ─────────────────────────────────────────────────────────────────────────────

function rerankScore(query: Query, chunk: Chunk, goldOverlap: number): number {
  const lexOverlap = Math.min(1, bm25Score(query.text, chunk.text) / 8)
  // Cross-encoder sees query + chunk together → higher semantic precision
  const base = 0.20 + lexOverlap * 0.35 + goldOverlap * 0.55
  return Math.max(0, Math.min(0.99, base + deterministicNoise(chunk.id + query.id + 'rerank')))
}

// ─────────────────────────────────────────────────────────────────────────────
// Main retrieve function (§6.4)
// ─────────────────────────────────────────────────────────────────────────────

export interface RetrieveParams {
  query: Query
  chunks: Chunk[]
  method: RetrievalMethod
  modelId: EmbeddingModelId
  topK: number
  threshold: number
  alpha: number
  rerank: boolean
  candidatePool: number
  lowRankGold?: boolean
}

export function retrieve(params: RetrieveParams): RetrievalResult {
  const {
    query, chunks, method, modelId, topK, threshold, alpha,
    rerank, candidatePool, lowRankGold,
  } = params

  // 1. Compute raw scores for all chunks
  const denseRaw = chunks.map(chunk => {
    const goldOverlap = chunkMaxGoldOverlap(chunk, query.goldSpans)
    return getDenseScore(query, chunk, modelId, goldOverlap)
  })

  const sparseRaw = chunks.map(chunk => bm25Score(query.text, chunk.text))
  const sparseNorm = normalizeBm25(sparseRaw)

  // Min-max normalise dense scores within this candidate set
  const denseMax = Math.max(...denseRaw, 0.001)
  const denseMin = Math.min(...denseRaw, 0)
  const denseNorm = denseRaw.map(s => (s - denseMin) / (denseMax - denseMin + 0.001))

  // 2. Combine scores by method
  const combined = chunks.map((chunk, i) => {
    let score: number
    if (method === 'dense') score = denseRaw[i]
    else if (method === 'sparse') score = sparseNorm[i]
    else score = alpha * denseNorm[i] + (1 - alpha) * sparseNorm[i]

    const goldOverlap = chunkMaxGoldOverlap(chunk, query.goldSpans)
    return {
      chunk,
      score,
      denseScore: denseRaw[i],
      sparseScore: sparseNorm[i],
      isGold: goldOverlap >= 0.5,
      fedToLLM: false,
    } satisfies Omit<ScoredChunk, 'fedToLLM'> & { fedToLLM: boolean }
  })

  // 3. Sort descending
  let sorted: typeof combined = [...combined].sort((a, b) => b.score - a.score)

  // 4. Mission 4 injection: depress gold chunk to rank 6 (before rerank).
  //    Otherwise apply the designed method/model fit so the chosen knobs
  //    determine whether retrieval actually surfaces the gold chunk.
  if (lowRankGold) {
    sorted = applyLowRankGoldInjection(sorted as ScoredChunk[], query) as typeof sorted
  } else {
    sorted = applyGoldFit(sorted as ScoredChunk[], goldFit(method, modelId, query.kind, alpha)) as typeof sorted
  }

  // 5. Optional reranking: take candidatePool, re-score, re-sort, take topK
  if (rerank) {
    const pool = sorted.slice(0, candidatePool)
    pool.forEach(sc => {
      const goldOverlap = chunkMaxGoldOverlap(sc.chunk, query.goldSpans)
      sc.score = rerankScore(query, sc.chunk, goldOverlap)
    })
    pool.sort((a, b) => b.score - a.score)
    sorted = [...pool, ...sorted.slice(candidatePool)]
  }

  // 6. Apply threshold + topK to determine fedToLLM
  let fedCount = 0
  const ranked: ScoredChunk[] = sorted.map(sc => {
    const fed = sc.score >= threshold && fedCount < topK
    if (fed) fedCount++
    return { ...sc, fedToLLM: fed }
  })

  const fedChunks = ranked.filter(sc => sc.fedToLLM).map(sc => sc.chunk)

  return { ranked, fedChunks }
}
