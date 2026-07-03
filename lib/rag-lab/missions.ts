// All 13 mission configurations — §9.
// Each mission exposes a specific set of knobs and has a designed win condition.

import type { Mission, ScenarioCard } from './types'
import { CONFIG } from './config'

// ── Scenario cards for Mission 10 ─────────────────────────────────────────────
const SCENARIO_CARDS: ScenarioCard[] = [
  {
    id: 'card-1',
    description: 'A legal research tool for a 50-firm consortium. 2M+ case documents. New rulings added daily.',
    corpusSize: 'large', volatility: 'high', queryType: 'semantic',
    correctChoice: 'rag',
  },
  {
    id: 'card-2',
    description: 'An internal FAQ bot for a team of 12. The company handbook is 40 pages and changes once a year.',
    corpusSize: 'small', volatility: 'low', queryType: 'semantic',
    correctChoice: 'long-context',
  },
  {
    id: 'card-3',
    description: 'A customer service bot that needs to match the exact brand voice of every response, not answer from documents.',
    corpusSize: 'small', volatility: 'low', queryType: 'structured',
    correctChoice: 'fine-tune',
  },
  {
    id: 'card-4',
    description: 'A product support copilot for a SaaS with 5000+ help articles updated weekly.',
    corpusSize: 'large', volatility: 'high', queryType: 'semantic',
    correctChoice: 'rag',
  },
  {
    id: 'card-5',
    description: 'An output formatter that always generates structured JSON in a proprietary schema — no factual lookup required.',
    corpusSize: 'small', volatility: 'low', queryType: 'structured',
    correctChoice: 'fine-tune',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export const MISSIONS: Mission[] = [

  // ── MODULE 1 ──────────────────────────────────────────────────────────────

  {
    id: 'mission-1',
    order: 1,
    module: 1,
    anchorLessons: [3],
    title: 'Isolate the Failure',
    brief: 'Helix just gave a wrong answer to a liability question. Before you fix anything, you need to diagnose exactly which layer failed: retrieval, generation, or both. Inspect each pipeline stage, then make your call.',
    queryIds: ['q-liability'],
    exposedKnobs: ['diagnosis'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 0,
      embeddingModel: 'mini-lex-32',   // weak model → retrieval misses
      method: 'dense',
      topK: 1,                          // tiny top-k → gold chunk not fed
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: 100,   // diagnosis mission: either right or wrong
    budgetTokens: CONFIG.budget.perMissionTokens,
    diagnosisChoices: [
      { id: 'retrieval', label: 'Retrieval failure — the right chunks were never fed.' },
      { id: 'generation', label: 'Generation failure — the model had good context but hallucinated.' },
      { id: 'both', label: 'Both failed.' },
    ],
    diagnosisCorrect: 'retrieval',
  },

  {
    id: 'mission-2',
    order: 2,
    module: 1,
    anchorLessons: [4],
    title: "Chunk Helix's Docs",
    brief: 'The liability answer keeps coming back ungrounded. The starting 128-word chunks are splitting "the account holder bears no liability" across a boundary, so no single chunk fully contains it. Increase the chunk size or add overlap until the gold span lands in one chunk — but watch out: some bigger sizes just re-split it at a new boundary. Overlap is the reliable insurance.',
    queryIds: ['q-liability'],
    exposedKnobs: ['chunkSize', 'overlap'],
    initialKnobs: { chunkSize: 128, overlap: 0 },
    lockedKnobs: {
      embeddingModel: 'helix-embed-large',
      method: 'dense',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
    artifactId: 'chunking-log',
  },

  // ── MODULE 2 ──────────────────────────────────────────────────────────────

  {
    id: 'mission-3',
    order: 3,
    module: 2,
    anchorLessons: [5],
    title: 'Dense vs Sparse vs Hybrid',
    brief: 'Two queries, one config. "Section 420" must match exactly — dense alone fails it. "What if someone lies for money?" needs semantic understanding — sparse alone misses it. Find a retrieval method that serves both.',
    queryIds: ['q-section420', 'q-lies-for-money'],
    exposedKnobs: ['method', 'alpha'],
    initialKnobs: { method: 'dense', alpha: 0.5 },
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      topK: 5,
      threshold: 0,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
  },

  {
    id: 'mission-4',
    order: 4,
    module: 2,
    anchorLessons: [6],
    title: 'Add a Reranker',
    brief: 'The right chunk is being retrieved but it\'s sitting at rank 6 — just below your top-k. Raising top-k alone drags in irrelevant chunks and caps your score below the 78 target. Enable the reranker to bring it back to the top without the noise.',
    queryIds: ['q-payout-timing'],
    exposedKnobs: ['rerank', 'candidatePool', 'topK'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      method: 'dense',
      threshold: 0,
      alpha: 0.5,
    },
    injection: 'lowRankGold',
    // 78, not the standard 70: widening top-k without the reranker tops out at
    // 76 (F1 dilution + irrelevant-chunk penalty), so the reranker is genuinely
    // required. Every rerank config with pool ≥ 6 and topK ≤ 5 scores 79–100.
    passThreshold: 78,
    budgetTokens: CONFIG.budget.perMissionTokens,
  },

  {
    id: 'mission-5',
    order: 5,
    module: 2,
    anchorLessons: [7],
    title: 'Score the Halves Separately',
    brief: 'Run the eval suite against six queries. For each query, identify whether the failure was in retrieval (wrong chunks fed) or generation (right chunks, hallucinated answer) — or both, or neither. You need both scores to know what to fix.',
    queryIds: ['q-liability', 'q-section420', 'q-lies-for-money', 'q-payout-timing', 'q-2fa-methods', 'q-kyc-docs'],
    exposedKnobs: ['diagnosis'],
    lockedKnobs: {
      // 384-word chunks re-split the q-liability gold span at a boundary, so
      // that query becomes a true GENERATION failure (gold retrieved, claim
      // hallucinated) — all three tags are the correct answer for some query.
      chunkSize: 384,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      method: 'dense',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
    artifactId: 'retrieval-eval-suite',
  },

  {
    id: 'mission-6',
    order: 6,
    module: 2,
    anchorLessons: [8],
    title: 'Pick the Embedding Model',
    brief: 'The MTEB leaderboard lists helix-embed-large as a top performer. mini-lex-32 is smaller and lexical-leaning. Run both on the Helix eval set and pick the one that wins on your actual data — not on the benchmark.',
    queryIds: ['q-liability', 'q-section420', 'q-lies-for-money', 'q-payout-timing', 'q-2fa-methods', 'q-kyc-docs'],
    exposedKnobs: ['embeddingModel'],
    initialKnobs: { embeddingModel: 'mini-lex-32' },
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      method: 'hybrid',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
    artifactId: 'embedding-scorecard',
  },

  // ── MODULE 3 ──────────────────────────────────────────────────────────────

  {
    id: 'mission-7',
    order: 7,
    module: 3,
    anchorLessons: [9],
    title: 'Stale Index',
    brief: 'Helix is confidently telling users that payouts take 5 business days. Support says it\'s 2. The pipeline looks fine. Inspect the index to find why.',
    queryIds: ['q-payout-timing'],
    exposedKnobs: ['diagnosis'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      method: 'hybrid',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
      staleIndex: true,
    },
    injection: 'staleIndex',
    passThreshold: 100,
    budgetTokens: CONFIG.budget.perMissionTokens,
    diagnosisChoices: [
      { id: 'stale-index', label: 'Stale index — the changelog entry served is version 2024-03 (5 days), not 2024-11 (2 days).' },
      { id: 'bad-chunking', label: 'Bad chunking — the payout timing chunk is split incorrectly.' },
      { id: 'wrong-model', label: 'Wrong embedding model — the semantic model can\'t find payout info.' },
      { id: 'low-topk', label: 'Low top-k — the right chunk exists but isn\'t retrieved.' },
    ],
    diagnosisCorrect: 'stale-index',
  },

  {
    id: 'mission-8',
    order: 8,
    module: 3,
    anchorLessons: [10],
    title: 'Query Drift',
    brief: 'Retrieval scores great on your test queries. But real users phrase things differently — colloquially, with typos, without the right vocabulary. Diagnose the gap, then re-tune until the production query set hits target.',
    queryIds: ['q-payout-timing-drift', 'q-2fa-drift', 'q-kyc-drift'],
    exposedKnobs: ['diagnosis', 'chunkSize', 'method', 'topK'],
    // Open in the broken state: sparse was tuned for the clean test set and
    // scores 0 on all three colloquial production queries. The learner must
    // diagnose the drift AND switch to dense/hybrid to pass.
    initialKnobs: { method: 'sparse' },
    lockedKnobs: {
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'driftQueries',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
    diagnosisChoices: [
      { id: 'query-drift', label: 'Query drift — the production queries use different phrasing than the test set.' },
      { id: 'stale-index', label: 'Stale index — the information is out of date.' },
      { id: 'bad-embedding', label: 'Wrong embedding model — the model can\'t handle the queries.' },
      { id: 'bad-chunking', label: 'Bad chunking — the answer is being split across boundaries.' },
    ],
    diagnosisCorrect: 'query-drift',
  },

  {
    id: 'mission-9',
    order: 9,
    module: 3,
    anchorLessons: [11],
    title: 'Wire the Monitors',
    brief: 'Four signals will warn you before users complain — but only if you set the right thresholds. Review the last two weeks of Helix traffic, then configure all four monitors so they would have caught the three seeded incidents with at most one false alarm. Too loose and an incident slips through; too tight and you cry wolf on normal noise.',
    queryIds: ['q-liability', 'q-payout-timing', 'q-lies-for-money'],
    exposedKnobs: ['monitors'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      method: 'hybrid',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
    artifactId: 'monitoring-plan',
  },

  {
    id: 'mission-10',
    order: 10,
    module: 3,
    anchorLessons: [12],
    title: "RAG's Ceiling",
    brief: 'Not every use case needs RAG. For each of these five scenarios, classify whether RAG, long context, or fine-tuning is the right approach. One wrong classification fails the mission.',
    queryIds: [],
    exposedKnobs: ['modelChoice'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      method: 'hybrid',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: 100,
    budgetTokens: CONFIG.budget.perMissionTokens,
    scenarioCards: SCENARIO_CARDS,
  },

  // ── MODULE 4 ──────────────────────────────────────────────────────────────

  {
    id: 'mission-11',
    order: 11,
    module: 4,
    anchorLessons: [13, 14],
    title: 'Retrieval as a Policy',
    brief: 'The fixed baseline uses one retriever (sparse) for every query, so it nails the exact lookups but misses the semantic ones. Turn on the routing policy so the retriever is chosen per query type (exact → sparse, semantic → dense) and clear every query.',
    queryIds: ['q-section420', 'q-lies-for-money', 'q-payout-timing', 'q-kyc-docs', 'q-chargeback-fee'],
    exposedKnobs: ['policyConstraints'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      method: 'sparse',
      embeddingModel: 'helix-embed-large',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
    artifactId: 'routing-policy-partial',
  },

  {
    id: 'mission-12',
    order: 12,
    module: 4,
    anchorLessons: [15],
    title: 'Multi-Hop & Per-Span Eval',
    brief: 'This query needs two retrieval hops — first into the refund policy, then into the fraud handbook. The starting top-k of 1 only feeds one hop, so the second claim is fabricated (watch the GENERATE stage). Raise top-k until both hops are retrieved and no claim is hallucinated.',
    queryIds: ['q-refund-then-liability'],
    exposedKnobs: ['method', 'topK'],
    initialKnobs: { topK: 1 },
    lockedKnobs: {
      chunkSize: 512,
      overlap: 64,
      embeddingModel: 'helix-embed-large',
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: CONFIG.budget.perMissionTokens,
  },

  {
    id: 'mission-13',
    order: 13,
    module: 4,
    anchorLessons: [16],
    title: 'Cost Levers',
    brief: 'Hit the Signal Score target under a reduced budget. The brute-force approach exceeds the limit. Cache repeated stable context tokens. Route easy queries away from retrieval entirely. You need both levers.',
    queryIds: ['q-section420', 'q-payout-timing', 'q-liability', 'q-2fa-methods', 'q-security-alert'],
    exposedKnobs: ['cache', 'routing'],
    lockedKnobs: {
      chunkSize: 256,
      overlap: 32,
      embeddingModel: 'helix-embed-large',
      method: 'hybrid',
      topK: 5,
      threshold: 0,
      alpha: 0.5,
      rerank: false,
      candidatePool: 20,
    },
    injection: 'none',
    passThreshold: CONFIG.score.passThreshold,
    budgetTokens: 4000, // tight: brute-force (~6800) busts it; needs BOTH cache + routing
    artifactId: 'routing-policy-complete',
  },
]

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find(m => m.id === id)
}

export function getMissionByOrder(order: number): Mission | undefined {
  return MISSIONS.find(m => m.order === order)
}
