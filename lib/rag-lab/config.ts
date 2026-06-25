// RAG Lab master config — §4 of the build spec.
// All tunable values live here. Referenced by name everywhere else.

export const CONFIG = {
  // ── Signal Score weights (positive weights sum to 100) ──────────────────────
  score: {
    weights: {
      answerCorrectness: 50,
      groundedness:      30,
      retrievalQuality:  20,
    },
    penalties: {
      hallucinationPerClaim:    12,
      irrelevantChunkPenalty:    2,
      irrelevantChunkCap:       10,
      overBudgetPerToken:     0.03,
      latencyPenaltyPerSec:    1.5,
    },
    passThreshold:    70,
    perfectThreshold: 95,
    latencyTargetSec:  4,
  },

  // ── Token budget ────────────────────────────────────────────────────────────
  budget: {
    perMissionTokens:       12000,
    perRunBaseTokens:         400,
    tokensPerRetrievedChunk:  180,
    tokensPerRerankCandidate:  25,
    embeddingCostPerQuery:     60,
    cacheDiscount:            0.5,
  },

  // ── Chunking knob ranges ────────────────────────────────────────────────────
  chunking: {
    sizeMin: 64, sizeMax: 1024, sizeStep: 64, sizeDefault: 256,
    overlapMin: 0, overlapMax: 256, overlapStep: 16, overlapDefault: 0,
  },

  // ── Retrieval knobs ─────────────────────────────────────────────────────────
  retrieval: {
    topKMin: 1, topKMax: 20, topKDefault: 5,
    thresholdMin: 0, thresholdMax: 1, thresholdStep: 0.01, thresholdDefault: 0,
    methods: ['dense', 'sparse', 'hybrid'] as const,
    hybridAlphaDefault: 0.5,
  },

  // ── Embedding models ────────────────────────────────────────────────────────
  embeddingModels: {
    strong: { id: 'helix-embed-large', label: 'helix-embed-large (strong)' },
    weak:   { id: 'mini-lex-32',       label: 'mini-lex-32 (weak)' },
    default: 'helix-embed-large',
  },

  // ── Reranker ────────────────────────────────────────────────────────────────
  rerank: { enabledDefault: false, candidatePoolDefault: 20 },

  // ── XP economy ──────────────────────────────────────────────────────────────
  xp: {
    perMissionPass:        100,
    perfectBonus:           50,
    firstTryBonus:          25,
    noHallucinationBonus:   20,
    underHalfBudgetBonus:   15,
    streakStep:             10,
    streakCapDays:           7,
  },

  // ── Agentic engine ──────────────────────────────────────────────────────────
  agent: {
    maxHops:                4,
    routerEasyThreshold: 0.82,
  },
} as const

export type RetrievalMethod = typeof CONFIG.retrieval.methods[number]
export type EmbeddingModelId = 'helix-embed-large' | 'mini-lex-32'
