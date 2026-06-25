// Regression suite for the RAG Lab engine. Locks in the bug fixes so the
// mission pedagogy and grounding cannot silently regress. Mirrors how
// client.tsx runs a mission (defaultKnobs → computeForQuery → computeRun).
import { describe, it, expect } from 'vitest'
import { CONFIG } from '@/lib/rag-lab/config'
import { getMissionById, MISSIONS } from '@/lib/rag-lab/missions'
import { getQueryById, QUERIES } from '@/lib/rag-lab/queries'
import { getCorpusForMission, CORPUS } from '@/lib/rag-lab/corpus'
import { chunkCorpus, chunkDocument, countTokens } from '@/lib/rag-lab/chunk'
import { retrieve, spanOverlapFraction } from '@/lib/rag-lab/retrieve'
import { generate } from '@/lib/rag-lab/generate'
import { scoreRetrieval, scoreGeneration, chunkIsGold } from '@/lib/rag-lab/eval'
import { computeSignalScore, computeRunCost } from '@/lib/rag-lab/score'
import type { Mission, KnobState } from '@/lib/rag-lab/types'

// ── Replicate client.tsx pipeline ─────────────────────────────────────────────
function defaultKnobs(m: Mission): KnobState {
  return {
    chunkSize: CONFIG.chunking.sizeDefault, overlap: CONFIG.chunking.overlapDefault,
    embeddingModel: CONFIG.embeddingModels.default as 'helix-embed-large', method: 'hybrid',
    topK: CONFIG.retrieval.topKDefault, threshold: CONFIG.retrieval.thresholdDefault,
    alpha: CONFIG.retrieval.hybridAlphaDefault, rerank: CONFIG.rerank.enabledDefault,
    candidatePool: CONFIG.rerank.candidatePoolDefault,
    ...m.lockedKnobs, ...m.initialKnobs,
  } as KnobState
}

function computeForQuery(m: Mission, k: KnobState, queryId: string) {
  const query = getQueryById(queryId)!
  const chunks = chunkCorpus(getCorpusForMission(m.injection), k.chunkSize, k.overlap)
  const method = k.policyConstraints
    ? (query.kind === 'exact' ? 'sparse' : query.kind === 'semantic' ? 'dense' : 'hybrid')
    : k.method
  const r = retrieve({ query, chunks, method, modelId: k.embeddingModel, topK: k.topK,
    threshold: k.threshold, alpha: k.alpha, rerank: k.rerank, candidatePool: k.candidatePool,
    lowRankGold: m.injection === 'lowRankGold' })
  const answer = generate(query, r.fedChunks)
  const rS = scoreRetrieval(r.ranked, query.goldSpans)
  const gS = scoreGeneration(answer, query)
  const cacheActive = k.cache === true
  const routedAway = k.routing === true && query.kind === 'exact'
  const runCost = computeRunCost({ fedChunkCount: routedAway ? 0 : r.fedChunks.length,
    rerankEnabled: k.rerank, candidatePool: k.candidatePool,
    cacheDiscount: cacheActive ? CONFIG.budget.cacheDiscount : 1,
    cachedChunkCount: cacheActive && !routedAway ? r.fedChunks.length : 0 })
  const breakdown = computeSignalScore({ retrieval: rS, generation: gS, ranked: r.ranked,
    runCost, tokensUsed: runCost, latencySec: 1.2, passThreshold: m.passThreshold })
  return { breakdown, rS, gS, r, runCost }
}

function runMission(m: Mission, overrides: Partial<KnobState> = {}) {
  const k = { ...defaultKnobs(m), ...overrides }
  const per = m.queryIds.map(q => computeForQuery(m, k, q))
  const total = per.reduce((s, c) => s + c.runCost, 0)
  const worst = per.reduce((a, b) => (b.breakdown.signalScore < a.breakdown.signalScore ? b : a))
  const breakdown = computeSignalScore({ retrieval: worst.rS, generation: worst.gS,
    ranked: worst.r.ranked, runCost: total, tokensUsed: total, latencySec: 1.2,
    passThreshold: m.passThreshold, budgetTokens: m.budgetTokens })
  return { pass: breakdown.rating !== 'retry', score: breakdown.signalScore, totalTokens: total }
}
const M = (id: string) => getMissionById(id)!

// ── Engine units (#8) ─────────────────────────────────────────────────────────
describe('chunk engine', () => {
  it('chunk offsets are true body offsets (#8)', () => {
    for (const doc of CORPUS) {
      for (const c of chunkDocument(doc, 256, 0)) {
        expect(doc.body.slice(c.start, c.end)).toBe(c.text)
      }
    }
  })
  it('countTokens splits on whitespace', () => {
    expect(countTokens('hello world foo')).toBe(3)
  })
  it('overlap >= size is clamped (no hang)', () => {
    expect(chunkDocument(CORPUS[0], 256, 999).length).toBeGreaterThan(0)
  })
  it('gold containment: full ===1, ≥50% is gold', () => {
    const span = { docId: 'd', start: 100, end: 200 }
    expect(spanOverlapFraction({ id: 'x', docId: 'd', start: 50, end: 300, text: '', index: 0 }, span)).toBe(1)
    expect(chunkIsGold({ id: 'y', docId: 'd', start: 150, end: 250, text: '', index: 0 } as never, [span])).toBe(true)
  })
})

// ── Gold spans point at real evidence (#1) ────────────────────────────────────
describe('gold spans (#1)', () => {
  it('every gold span lies within its document body', () => {
    for (const q of QUERIES) {
      for (const s of q.goldSpans) {
        const doc = CORPUS.find(d => d.id === s.docId)!
        expect(doc).toBeTruthy()
        expect(s.end).toBeLessThanOrEqual(doc.body.length)
        expect(s.start).toBeLessThan(s.end)
      }
    }
  })
})

// ── Mission pedagogy: broken start fails, intended fix passes ──────────────────
describe('mission pedagogy', () => {
  it('M1 retrieval genuinely fails → "retrieval failure" is correct (#2)', () => {
    expect(runMission(M('mission-1')).pass).toBe(false)
    expect(M('mission-1').diagnosisCorrect).toBe('retrieval')
  })
  it('M2 small chunks fail, bigger chunks pass (#9)', () => {
    expect(runMission(M('mission-2'), { chunkSize: 128, overlap: 0 }).pass).toBe(false)
    expect(runMission(M('mission-2'), { chunkSize: 256, overlap: 32 }).pass).toBe(true)
  })
  it('M2 opens in its broken (small-chunk) state (#10)', () => {
    expect(M('mission-2').initialKnobs).toMatchObject({ chunkSize: 128 })
  })
  it('M3 dense fails exact, sparse fails semantic, hybrid serves both (#3)', () => {
    expect(runMission(M('mission-3'), { method: 'dense' }).pass).toBe(false)
    expect(runMission(M('mission-3'), { method: 'sparse' }).pass).toBe(false)
    expect(runMission(M('mission-3'), { method: 'hybrid', alpha: 0.5 }).pass).toBe(true)
  })
  it('M4 reranker rescues the low-rank gold chunk', () => {
    expect(runMission(M('mission-4'), { rerank: false, topK: 5 }).pass).toBe(false)
    expect(runMission(M('mission-4'), { rerank: true, candidatePool: 20, topK: 5 }).pass).toBe(true)
  })
  it('M6 strong model passes all, weak model fails (#6)', () => {
    expect(runMission(M('mission-6'), { embeddingModel: 'helix-embed-large' }).pass).toBe(true)
    expect(runMission(M('mission-6'), { embeddingModel: 'mini-lex-32' }).pass).toBe(false)
  })
  it('M7 serves the stale changelog and the diagnosis key is correct', () => {
    const docs = getCorpusForMission('staleIndex')
    expect(docs.find(d => d.id === 'doc-api-changelog')!.body).toContain('2024-03')
    expect(M('mission-7').diagnosisCorrect).toBe('stale-index')
  })
})

// ── Module 4 (#4, #5, #7) ─────────────────────────────────────────────────────
describe('module 4', () => {
  it('M11 fixed baseline fails, routing policy passes (#4)', () => {
    expect(runMission(M('mission-11')).pass).toBe(false)
    expect(runMission(M('mission-11'), { policyConstraints: true }).pass).toBe(true)
  })
  it('M12 topK=1 fabricates a claim (fail), topK=3 retrieves both hops (#5)', () => {
    expect(runMission(M('mission-12'), { topK: 1 }).pass).toBe(false)
    expect(runMission(M('mission-12'), { topK: 3 }).pass).toBe(true)
  })
  it('M13 needs BOTH cost levers (#7)', () => {
    expect(runMission(M('mission-13')).pass).toBe(false)                       // none
    expect(runMission(M('mission-13'), { cache: true }).pass).toBe(false)      // cache only
    expect(runMission(M('mission-13'), { routing: true }).pass).toBe(false)    // routing only
    expect(runMission(M('mission-13'), { cache: true, routing: true }).pass).toBe(true)
  })
})

// ── Scoring config (#12 doc accuracy) ─────────────────────────────────────────
describe('scoring config', () => {
  it('thresholds are 70 (pass) / 95 (gold)', () => {
    expect(CONFIG.score.passThreshold).toBe(70)
    expect(CONFIG.score.perfectThreshold).toBe(95)
  })
  it('signal score is clamped to 0..100', () => {
    const ranked = [] as never[]
    const s = computeSignalScore({ retrieval: { precision: 0, recall: 0, f1: 0, goldHit: false },
      generation: { correctness: 0, groundedness: 0, hallucinatedClaims: 9 }, ranked,
      runCost: 0, tokensUsed: 999999, latencySec: 99, budgetTokens: 100 })
    expect(s.signalScore).toBeGreaterThanOrEqual(0)
    expect(s.signalScore).toBeLessThanOrEqual(100)
  })
})

// ── Every mission stays winnable ──────────────────────────────────────────────
describe('all missions remain winnable', () => {
  it('each non-diagnosis/scenario mission has a passing config', () => {
    const solutions: Record<string, Partial<KnobState>> = {
      'mission-2': { chunkSize: 512, overlap: 64 },
      'mission-3': { method: 'hybrid', alpha: 0.5 },
      'mission-4': { rerank: true, candidatePool: 20, topK: 5 },
      'mission-6': { embeddingModel: 'helix-embed-large' },
      'mission-11': { policyConstraints: true },
      'mission-12': { topK: 3 },
      'mission-13': { cache: true, routing: true },
    }
    for (const [id, sol] of Object.entries(solutions)) {
      expect(runMission(M(id), sol).pass, `${id} should be winnable`).toBe(true)
    }
  })
  it('there are 13 missions', () => {
    expect(MISSIONS.length).toBe(13)
  })
})
