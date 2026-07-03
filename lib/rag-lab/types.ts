// Core TypeScript types for the RAG Lab engine.

import type { RetrievalMethod, EmbeddingModelId } from './config'

// ── Corpus ───────────────────────────────────────────────────────────────────

export type DocType = 'support' | 'policy' | 'legal' | 'changelog'

export interface Document {
  id: string
  title: string
  type: DocType
  version: string
  body: string
}

// ── Chunks ───────────────────────────────────────────────────────────────────

export interface Chunk {
  id: string       // "${docId}:${size}:${overlap}:${index}"
  docId: string
  start: number    // char offset in Document.body
  end: number
  text: string
  index: number    // position within document's chunk sequence
}

// ── Span ─────────────────────────────────────────────────────────────────────

export interface Span {
  docId: string
  start: number  // char offset
  end: number
}

// ── Queries ──────────────────────────────────────────────────────────────────

export type QueryKind = 'semantic' | 'exact' | 'multi-hop'

export interface GoldClaim {
  text: string
  goldSpan: Span           // the specific char range that supports this claim
  distractorText: string   // hallucinated version if span not covered
}

export interface Query {
  id: string
  text: string
  goldAnswer: string
  goldClaims: GoldClaim[]
  goldSpans: Span[]        // all spans relevant to the answer (union of goldClaim spans)
  kind: QueryKind
}

// ── Retrieval ────────────────────────────────────────────────────────────────

export interface ScoredChunk {
  chunk: Chunk
  score: number        // combined score after method + optional rerank
  denseScore: number
  sparseScore: number
  rerankScore?: number
  isGold: boolean      // overlap >= 50% with any goldSpan
  fedToLLM: boolean    // survived threshold + topK cut
}

export interface RetrievalResult {
  ranked: ScoredChunk[]
  fedChunks: Chunk[]   // convenience: ranked where fedToLLM=true
}

// ── Generation ───────────────────────────────────────────────────────────────

export interface GeneratedClaim {
  text: string
  supportedBySpan: Span | null  // null = hallucinated
  isHallucinated: boolean
  /** Grounded in a fed chunk, but the chunk comes from a stale document version
   *  (Mission 7 injection) — the claim is faithful to its context yet WRONG. */
  isStale?: boolean
}

export interface GeneratedAnswer {
  text: string
  claims: GeneratedClaim[]
}

// ── Eval ─────────────────────────────────────────────────────────────────────

export interface RetrievalScore {
  precision: number
  recall: number
  f1: number
  goldHit: boolean     // at least one gold span covered by a fed chunk
}

export interface GenerationScore {
  correctness: number        // fraction of gold claims present, supported AND current
  groundedness: number       // fraction of answer claims that are supported
  hallucinatedClaims: number
  /** Claims grounded in a stale document version — grounded but wrong (M7). */
  staleClaims?: number
}

export interface HopResult {
  hopIndex: number
  query: string
  retrieval: RetrievalResult
  answer: GeneratedAnswer
}

export interface MultiHopScore {
  perHop: { hopIndex: number; goldHit: boolean; f1: number }[]
  fabricatedAtHop: number | null
  finalCorrectness: number
}

// ── Pipeline run ─────────────────────────────────────────────────────────────

export interface KnobState {
  chunkSize: number
  overlap: number
  embeddingModel: EmbeddingModelId
  method: RetrievalMethod
  topK: number
  threshold: number
  alpha: number
  rerank: boolean
  candidatePool: number
  staleIndex?: boolean       // Mission 7 injection
  lowRankGold?: boolean      // Mission 4 injection
  cache?: boolean            // Mission 13 cost lever
  routing?: boolean          // Mission 13 cost lever
  policyConstraints?: boolean // Mission 11 per-query routing policy
}

export interface RunResult {
  retrieval: RetrievalResult
  answer: GeneratedAnswer
  retrievalScore: RetrievalScore
  generationScore: GenerationScore
  runCost: number
  latencySec: number
}

// ── Missions ─────────────────────────────────────────────────────────────────

export type KnobId =
  | 'chunkSize' | 'overlap' | 'embeddingModel' | 'method' | 'topK'
  | 'threshold' | 'alpha' | 'rerank' | 'candidatePool' | 'monitors'
  | 'modelChoice' | 'diagnosis' | 'policyConstraints' | 'cache' | 'routing'

export type InjectionType = 'staleIndex' | 'lowRankGold' | 'driftQueries' | 'none'

export interface MonitorThresholds {
  retrievalRate: number
  relevanceScore: number
  faithfulness: number
  costPerRun: number
}

export interface Mission {
  id: string
  order: number
  module: 1 | 2 | 3 | 4
  anchorLessons: number[]
  title: string
  brief: string
  queryIds: string[]
  exposedKnobs: KnobId[]
  lockedKnobs: Partial<KnobState>
  /** Starting values for exposed knobs so a mission opens in its "broken" state
   *  (e.g. M2 starts with chunks too small, M3 with the wrong method). */
  initialKnobs?: Partial<KnobState>
  injection: InjectionType
  passThreshold: number
  budgetTokens: number
  artifactId?: string
  diagnosisChoices?: { id: string; label: string }[]
  diagnosisCorrect?: string
  scenarioCards?: ScenarioCard[]
}

export interface ScenarioCard {
  id: string
  description: string
  corpusSize: 'large' | 'small'
  volatility: 'high' | 'low'
  queryType: 'semantic' | 'structured'
  correctChoice: 'rag' | 'long-context' | 'fine-tune'
}

// ── Game progress ─────────────────────────────────────────────────────────────

export type MissionRating = 'retry' | 'pass' | 'gold'

export interface MissionProgress {
  bestScore: number
  rating: MissionRating
  attempts: number
  completed: boolean
}

export interface Badge {
  id: string
  name: string
  description: string
  unlocked: boolean
}

export interface GameProgress {
  missions: Record<string, MissionProgress>
  totalXP: number
  level: number
  streak: number
  lastActiveDate: string
  badges: Record<string, boolean>
  artifacts: Record<string, string>  // artifactId → exported text
  seenStages: Set<string>            // stage IDs opened in runs
}
