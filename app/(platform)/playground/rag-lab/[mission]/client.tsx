'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getMissionById, MISSIONS } from '@/lib/rag-lab/missions'
import { QUERIES, DRIFT_PROD_SET, getQueryById, EVAL_SET } from '@/lib/rag-lab/queries'
import { getCorpusForMission } from '@/lib/rag-lab/corpus'
import { chunkCorpus } from '@/lib/rag-lab/chunk'
import { retrieve } from '@/lib/rag-lab/retrieve'
import { generate } from '@/lib/rag-lab/generate'
import { scoreRetrieval, scoreGeneration } from '@/lib/rag-lab/eval'
import { computeSignalScore, computeRunCost, computeXP, levelFromXP } from '@/lib/rag-lab/score'
import { loadProgress, saveProgress, recordMissionResult, recordStageOpened, defaultProgress } from '@/lib/rag-lab/persist'
import { CONFIG } from '@/lib/rag-lab/config'
import type {
  KnobState, Mission, RunResult, ScoredChunk,
  GameProgress, GeneratedAnswer, RetrievalResult, ScenarioCard,
} from '@/lib/rag-lab/types'
import type { ScoreBreakdown } from '@/lib/rag-lab/score'

// ─────────────────────────────────────────────────────────────────────────────
// Outer shell — null guard so hooks always run inside MissionWorkspace
// ─────────────────────────────────────────────────────────────────────────────
export default function RAGLabClient({ missionId }: { missionId: string }) {
  const mission = getMissionById(missionId)
  if (!mission) return null
  return <MissionWorkspace mission={mission} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const accent = 'var(--accent)'
const dim = 'rgba(255,255,255,0.5)'
const dimmer = 'rgba(255,255,255,0.3)'
const faint = 'rgba(255,255,255,0.1)'
const card = 'rgba(255,255,255,0.03)'
const border = 'rgba(255,255,255,0.09)'
const goodClr = '#C8F040'
const warnClr = '#f0c040'
const badClr  = '#f0584a'

function monoSm(color = dim): React.CSSProperties {
  return { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color }
}
function label(text: string, color = dimmer) {
  return <p style={monoSm(color)}>{text}</p>
}

// ─────────────────────────────────────────────────────────────────────────────
// Default knob state from a mission's lockedKnobs + CONFIG defaults
// ─────────────────────────────────────────────────────────────────────────────
function defaultKnobs(mission: Mission): KnobState {
  return {
    chunkSize: CONFIG.chunking.sizeDefault,
    overlap: CONFIG.chunking.overlapDefault,
    embeddingModel: CONFIG.embeddingModels.default as 'helix-embed-large',
    method: 'hybrid',
    topK: CONFIG.retrieval.topKDefault,
    threshold: CONFIG.retrieval.thresholdDefault,
    alpha: CONFIG.retrieval.hybridAlphaDefault,
    rerank: CONFIG.rerank.enabledDefault,
    candidatePool: CONFIG.rerank.candidatePoolDefault,
    ...mission.lockedKnobs,
    ...mission.initialKnobs,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main workspace
// ─────────────────────────────────────────────────────────────────────────────
function MissionWorkspace({ mission }: { mission: Mission }) {
  const [knobs, setKnobs] = useState<KnobState>(() => defaultKnobs(mission))
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [passed, setPassed] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [openStage, setOpenStage] = useState<string | null>(null)
  const [progress, setProgress] = useState<GameProgress>(() => defaultProgress())
  const [diagnosisChoice, setDiagnosisChoice] = useState<string | null>(null)
  const [diagnosisSubmitted, setDiagnosisSubmitted] = useState(false)
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, string>>({})
  const [monitorThresholds, setMonitorThresholds] = useState({ retrievalRate: 0.85, relevance: 0.7, faithfulness: 0.85, cost: 600 })
  const [stale, setStale] = useState(true)
  // What the pass overlay should show — set by whichever handler passes the
  // mission (pipeline run, diagnosis, or scenario). Independent of scoreBreakdown
  // so diagnosis missions (no pipeline score) still show the overlay.
  const [passInfo, setPassInfo] = useState<{ rating: 'pass' | 'gold'; score: number } | null>(null)

  useEffect(() => { setProgress(loadProgress()) }, [])

  const isExposed = (k: string) => mission.exposedKnobs.includes(k as never)

  // ── Pipeline computation for a single query (pure; no side effects) ──────────
  const computeForQuery = (queryId: string, tokensBase: number) => {
    const query = getQueryById(queryId) ?? QUERIES[0]
    const docs = getCorpusForMission(mission.injection)
    const chunks = chunkCorpus(docs, knobs.chunkSize, knobs.overlap)

    // Mission 11 policy: when the routing policy is on, pick the retriever per
    // query kind (exact→sparse, semantic→dense) instead of one fixed method.
    const effectiveMethod = knobs.policyConstraints
      ? (query.kind === 'exact' ? 'sparse' : query.kind === 'semantic' ? 'dense' : 'hybrid')
      : knobs.method

    const retrieval = retrieve({
      query, chunks,
      method: effectiveMethod, modelId: knobs.embeddingModel,
      topK: knobs.topK, threshold: knobs.threshold, alpha: knobs.alpha,
      rerank: knobs.rerank, candidatePool: knobs.candidatePool,
      lowRankGold: mission.injection === 'lowRankGold',
    })
    const answer = generate(query, retrieval.fedChunks)
    const retrievalScore = scoreRetrieval(retrieval.ranked, query.goldSpans)
    const generationScore = scoreGeneration(answer, query)

    // Mission 13 cost levers: caching discounts re-used stable context; routing
    // sends "easy" (exact-kind) queries down a cheap path that skips retrieval.
    const cacheActive = knobs.cache === true
    const routedAway = knobs.routing === true && query.kind === 'exact'
    const runCost = computeRunCost({
      fedChunkCount: routedAway ? 0 : retrieval.fedChunks.length,
      rerankEnabled: knobs.rerank,
      candidatePool: knobs.candidatePool,
      cacheDiscount: cacheActive ? CONFIG.budget.cacheDiscount : 1,
      cachedChunkCount: cacheActive && !routedAway ? retrieval.fedChunks.length : 0,
    })
    const latencySec = 1.2 + (knobs.rerank ? 0.8 : 0) + (knobs.topK > 10 ? 0.5 : 0)
    const result: RunResult = { retrieval, answer, retrievalScore, generationScore, runCost, latencySec }
    const breakdown = computeSignalScore({
      retrieval: retrievalScore, generation: generationScore, ranked: retrieval.ranked,
      runCost, tokensUsed: tokensBase + runCost, latencySec, passThreshold: mission.passThreshold,
    })
    return { query, result, breakdown, generationScore, runCost }
  }

  // Run EVERY query the mission targets; the mission score is the weakest link,
  // so a multi-query mission (M3, M6, M11, M13) only passes when all pass.
  const computeRun = (tokensBase: number) => {
    const ids = mission.queryIds
    if (!ids.length) return null
    const perQuery = ids.map(id => computeForQuery(id, 0))
    const totalCost = perQuery.reduce((s, c) => s + c.runCost, 0)
    const totalTokens = tokensBase + totalCost
    const worstQ = perQuery.reduce((a, b) => (b.breakdown.signalScore < a.breakdown.signalScore ? b : a))
    // Re-score the weakest query against the TOTAL spend + mission budget so the
    // budget constraint (M13) is enforced over the whole multi-query run.
    const breakdown = computeSignalScore({
      retrieval: worstQ.result.retrievalScore, generation: worstQ.result.generationScore,
      ranked: worstQ.result.retrieval.ranked, runCost: totalCost, tokensUsed: totalTokens,
      latencySec: worstQ.result.latencySec, passThreshold: mission.passThreshold, budgetTokens: mission.budgetTokens,
    })
    return { perQuery, worst: { ...worstQ, breakdown }, tokensUsed: totalTokens }
  }

  // Shared pass bookkeeping (XP, persistence, overlay). passInfo drives the
  // overlay independently of scoreBreakdown so diagnosis missions show it too.
  const finishPass = (rating: 'pass' | 'gold', score: number, attemptCount: number, halluc: number, tokens: number) => {
    const xp = computeXP({ rating, attemptCount, hallucinatedClaims: halluc, tokensUsed: tokens, streak: progress.streak })
    setXpEarned(xp)
    setPassInfo({ rating, score })
    setPassed(true)
    const updated = recordMissionResult(progress, mission.id, score, rating, xp)
    saveProgress(updated)
    setProgress(updated)
    setTimeout(() => setShowPass(true), 500)
  }

  // ── Run pipeline (standard + tuning missions) ───────────────────────────────
  const runPipeline = useCallback(() => {
    // Budget is per attempt: each run is scored on its own token cost, so the
    // user can iterate freely without re-runs accumulating past the budget.
    const c = computeRun(0)
    if (!c) return
    setTokensUsed(c.tokensUsed)
    setRunResult(c.worst.result)
    setScoreBreakdown(c.worst.breakdown)
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    setStale(false)
    // Missions that also require a diagnosis (M8, M12) pass via the diagnosis
    // handler once the pipeline is green; pure pipeline missions pass here.
    const needsDiagnosis = mission.exposedKnobs.includes('diagnosis' as never)
    if (!needsDiagnosis && c.worst.breakdown.rating !== 'retry' && !passed) {
      finishPass(c.worst.breakdown.rating === 'gold' ? 'gold' : 'pass',
        c.worst.breakdown.signalScore, newAttempts, c.worst.generationScore.hallucinatedClaims, c.tokensUsed)
    }
  }, [knobs, mission, tokensUsed, attempts, passed, progress])

  // Populate the pipeline view for pure-diagnosis missions (no RUN button) so
  // the brief's "inspect each pipeline stage" is actually possible.
  useEffect(() => {
    const pureDiagnosis = mission.exposedKnobs.includes('diagnosis' as never)
      && !mission.exposedKnobs.some(k => k !== 'diagnosis')
    if (pureDiagnosis && mission.queryIds.length && !runResult) {
      const c = computeRun(0)
      if (c) { setRunResult(c.worst.result); setScoreBreakdown(c.worst.breakdown) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Diagnosis missions (1, 7, 8, 12) ────────────────────────────────────────
  const handleDiagnosisSubmit = useCallback(() => {
    if (!diagnosisChoice || diagnosisSubmitted) return
    setDiagnosisSubmitted(true)
    const correct = diagnosisChoice === mission.diagnosisCorrect
    // If the mission also exposes tuning knobs (M8, M12), the pipeline must also
    // be green — diagnosis alone no longer passes those missions.
    const hasTuning = mission.exposedKnobs.some(k => k !== 'diagnosis')
    const pipelineOk = !hasTuning || (scoreBreakdown ? scoreBreakdown.rating !== 'retry' : false)
    if (correct && pipelineOk && !passed) {
      finishPass('pass', 100, attempts + 1, 0, 0)
    }
    setAttempts(a => a + 1)
  }, [diagnosisChoice, diagnosisSubmitted, mission, passed, attempts, progress, scoreBreakdown])

  // ── Scenario classification (Mission 10) ────────────────────────────────────
  const handleScenarioSubmit = useCallback(() => {
    const cards = mission.scenarioCards ?? []
    const allCorrect = cards.length > 0 && cards.every(c => scenarioAnswers[c.id] === c.correctChoice)
    if (allCorrect && !passed) {
      finishPass('pass', 100, attempts + 1, 0, 0)
    }
    setAttempts(a => a + 1)
  }, [scenarioAnswers, mission, passed, attempts, progress])

  // ── Stage inspection tracker (glass-box badge) ──────────────────────────────
  const openStagePanel = (stageId: string) => {
    setOpenStage(prev => prev === stageId ? null : stageId)
    const updated = recordStageOpened(progress, stageId)
    setProgress(updated)
    saveProgress(updated)
  }

  const nextMission = MISSIONS.find(m => m.order === mission.order + 1)

  // ─────────────────────────────────────────────────────────────────────────────
  // Special mission renderers
  // ─────────────────────────────────────────────────────────────────────────────

  if (mission.id === 'mission-10') {
    return <ScenarioClassifier mission={mission} scenarioAnswers={scenarioAnswers}
      setScenarioAnswers={setScenarioAnswers} onSubmit={handleScenarioSubmit}
      passed={passed} showPass={showPass} xpEarned={xpEarned}
      nextMission={nextMission} progress={progress} attempts={attempts} />
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Standard mission layout — 3 columns
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ borderBottom: `0.5px solid ${border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10,10,10,0.8)' }}>
        <Link href="/playground/rag-lab" style={{ ...monoSm(dimmer), textDecoration: 'none' }}>← Lab</Link>
        <span style={{ color: border }}>|</span>
        <span style={monoSm(dim)}>M{mission.order} · {mission.title}</span>
        <span style={{ ...monoSm('rgba(100,200,255,0.6)'), marginLeft: 'auto' }}>L{mission.anchorLessons.join(', ')}</span>
        <BudgetBar tokensUsed={tokensUsed} budgetTokens={mission.budgetTokens} />
        <span style={monoSm(dimmer)}>Attempt {attempts}</span>
      </div>

      {/* Brief banner */}
      <div style={{ background: 'rgba(255,255,255,0.015)', borderBottom: `0.5px solid ${border}`, padding: '10px 20px' }}>
        <p style={{ fontSize: '13px', color: dim, fontFamily: 'var(--font-dm-sans)', lineHeight: '1.5' }}>
          <span style={monoSm(accent)}>MISSION BRIEF</span>
          {'  '}{mission.brief}
        </p>
      </div>

      {/* Three-panel workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Control Panel ─────────────────────────────────────────── */}
        <div style={{ width: '240px', flexShrink: 0, borderRight: `0.5px solid ${border}`, padding: '16px', overflowY: 'auto', background: 'rgba(8,8,8,0.6)' }}>
          <p style={{ ...monoSm(accent), marginBottom: '14px', letterSpacing: '0.14em' }}>CONTROL PANEL</p>

          {/* Diagnosis knob */}
          {isExposed('diagnosis') && mission.diagnosisChoices && (
            <DiagnosisControl choices={mission.diagnosisChoices} value={diagnosisChoice}
              onChange={setDiagnosisChoice} submitted={diagnosisSubmitted}
              correct={mission.diagnosisCorrect ?? ''} onSubmit={handleDiagnosisSubmit} />
          )}

          {/* Pipeline knobs */}
          {isExposed('chunkSize') && (
            <KnobSlider label="CHUNK SIZE" value={knobs.chunkSize} min={CONFIG.chunking.sizeMin}
              max={CONFIG.chunking.sizeMax} step={CONFIG.chunking.sizeStep}
              unit="w" onChange={v => { setKnobs(k => ({ ...k, chunkSize: v })); setStale(true) }} />
          )}
          {isExposed('overlap') && (
            <KnobSlider label="OVERLAP" value={knobs.overlap} min={CONFIG.chunking.overlapMin}
              max={Math.min(CONFIG.chunking.overlapMax, knobs.chunkSize - 1)} step={CONFIG.chunking.overlapStep}
              unit="w" onChange={v => { setKnobs(k => ({ ...k, overlap: v })); setStale(true) }} />
          )}
          {isExposed('embeddingModel') && (
            <KnobSegmented label="EMBEDDING MODEL"
              options={[{ id: 'helix-embed-large', label: 'strong' }, { id: 'mini-lex-32', label: 'weak' }]}
              value={knobs.embeddingModel}
              onChange={v => { setKnobs(k => ({ ...k, embeddingModel: v as 'helix-embed-large' })); setStale(true) }} />
          )}
          {isExposed('method') && (
            <KnobSegmented label="RETRIEVAL METHOD"
              options={[{ id: 'dense', label: 'dense' }, { id: 'sparse', label: 'sparse' }, { id: 'hybrid', label: 'hybrid' }]}
              value={knobs.method}
              onChange={v => { setKnobs(k => ({ ...k, method: v as 'dense' })); setStale(true) }} />
          )}
          {isExposed('alpha') && knobs.method === 'hybrid' && (
            <KnobSlider label="HYBRID ALPHA (dense↑)" value={knobs.alpha} min={0} max={1} step={0.05}
              unit="" onChange={v => { setKnobs(k => ({ ...k, alpha: v })); setStale(true) }} />
          )}
          {isExposed('topK') && (
            <KnobStepper label="TOP-K" value={knobs.topK} min={CONFIG.retrieval.topKMin} max={CONFIG.retrieval.topKMax}
              onChange={v => { setKnobs(k => ({ ...k, topK: v })); setStale(true) }} />
          )}
          {isExposed('threshold') && (
            <KnobSlider label="THRESHOLD" value={knobs.threshold} min={0} max={1} step={0.01}
              unit="" onChange={v => { setKnobs(k => ({ ...k, threshold: v })); setStale(true) }} />
          )}
          {isExposed('rerank') && (
            <KnobToggle label="RERANKER" value={knobs.rerank}
              onChange={v => { setKnobs(k => ({ ...k, rerank: v })); setStale(true) }} />
          )}
          {isExposed('candidatePool') && knobs.rerank && (
            <KnobStepper label="CANDIDATE POOL" value={knobs.candidatePool} min={5} max={50}
              onChange={v => { setKnobs(k => ({ ...k, candidatePool: v })); setStale(true) }} />
          )}
          {isExposed('monitors') && (
            <MonitorControl thresholds={monitorThresholds} onChange={setMonitorThresholds} />
          )}
          {isExposed('policyConstraints') && (
            <KnobToggle label="ROUTING POLICY" value={knobs.policyConstraints === true}
              onChange={v => { setKnobs(k => ({ ...k, policyConstraints: v })); setStale(true) }} />
          )}
          {isExposed('cache') && (
            <KnobToggle label="CONTEXT CACHE" value={knobs.cache === true}
              onChange={v => { setKnobs(k => ({ ...k, cache: v })); setStale(true) }} />
          )}
          {isExposed('routing') && (
            <KnobToggle label="QUERY ROUTING" value={knobs.routing === true}
              onChange={v => { setKnobs(k => ({ ...k, routing: v })); setStale(true) }} />
          )}

          {/* Locked knobs display */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `0.5px solid ${faint}` }}>
            <p style={{ ...monoSm('rgba(255,255,255,0.2)'), marginBottom: '8px', letterSpacing: '0.12em' }}>LOCKED</p>
            <LockedKnob label="MODEL" value={knobs.embeddingModel === 'helix-embed-large' ? 'strong' : 'weak'} hidden={isExposed('embeddingModel')} />
            <LockedKnob label="METHOD" value={knobs.method} hidden={isExposed('method')} />
            <LockedKnob label="CHUNK" value={`${knobs.chunkSize}w / ${knobs.overlap}ov`} hidden={isExposed('chunkSize') || isExposed('overlap')} />
            <LockedKnob label="TOP-K" value={String(knobs.topK)} hidden={isExposed('topK')} />
            <LockedKnob label="RERANK" value={knobs.rerank ? 'on' : 'off'} hidden={isExposed('rerank')} />
          </div>

          {/* RUN button — shown for any mission with a runnable pipeline.
              Hidden for pure-diagnosis (auto-inspected), scenario (M10),
              eval-suite (M5) and monitor-config (M9) missions. */}
          {mission.queryIds.length > 0
            && (mission.exposedKnobs.some(k => k !== 'diagnosis'))
            && mission.id !== 'mission-10' && mission.id !== 'mission-5'
            && !isExposed('monitors') && (
            <button onClick={runPipeline}
              style={{
                marginTop: '20px', width: '100%', padding: '12px',
                background: stale ? accent : 'rgba(200,240,64,0.3)',
                color: 'black', fontFamily: 'var(--font-mono)', fontSize: '12px',
                letterSpacing: '0.1em', fontWeight: 600, border: 'none',
                borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {stale ? 'RUN →' : 'RE-RUN →'}
            </button>
          )}
        </div>

        {/* ── CENTRE: Pipeline Spine + Results ───────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Pipeline stages */}
          <PipelineSpine runResult={runResult} openStage={openStage} onOpenStage={openStagePanel}
            knobs={knobs} mission={mission} />

          {/* Eval suite view (Mission 5) */}
          {mission.id === 'mission-5' && (
            <EvalSuiteView knobs={knobs} onPass={() => {
              if (!passed) {
                const xp = computeXP({ rating: 'pass', attemptCount: attempts + 1, hallucinatedClaims: 0, tokensUsed: 0, streak: progress.streak })
                setXpEarned(xp)
                setPassed(true)
                const updated = recordMissionResult(progress, mission.id, 85, 'pass', xp)
                saveProgress(updated)
                setProgress(updated)
                setTimeout(() => setShowPass(true), 400)
              }
            }} />
          )}

          {/* Generation output */}
          {runResult && (
            <div style={{ marginTop: '16px', background: card, border: `0.5px solid ${border}`, borderRadius: '8px', padding: '14px' }}>
              <p style={{ ...monoSm(accent), marginBottom: '10px', letterSpacing: '0.12em' }}>GENERATE · OUTPUT</p>
              {runResult.answer.claims.map((claim, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', marginTop: '2px', flexShrink: 0, color: claim.isHallucinated ? badClr : goodClr }}>
                    {claim.isHallucinated ? '✗' : '✓'}
                  </span>
                  <p style={{ fontSize: '13px', color: claim.isHallucinated ? `${badClr}cc` : dim, lineHeight: '1.5', fontFamily: 'var(--font-dm-sans)', fontStyle: claim.isHallucinated ? 'italic' : 'normal' }}>
                    {claim.text}
                    {claim.isHallucinated && <span style={{ ...monoSm(badClr), display: 'inline', marginLeft: '8px' }}>HALLUCINATED</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Signal Readout ───────────────────────────────────────── */}
        <div style={{ width: '220px', flexShrink: 0, borderLeft: `0.5px solid ${border}`, padding: '16px', overflowY: 'auto', background: 'rgba(8,8,8,0.6)' }}>
          <SignalReadout breakdown={scoreBreakdown} passThreshold={mission.passThreshold} budgetTokens={mission.budgetTokens} tokensUsed={tokensUsed} />
        </div>
      </div>

      {/* Pass overlay — driven by passInfo so diagnosis missions (no pipeline
          score) show it too. */}
      {showPass && passInfo && (
        <PassOverlay rating={passInfo.rating} score={passInfo.score}
          xpEarned={xpEarned} nextMission={nextMission}
          onClose={() => setShowPass(false)} missionId={mission.id} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget bar
// ─────────────────────────────────────────────────────────────────────────────
function BudgetBar({ tokensUsed, budgetTokens }: { tokensUsed: number; budgetTokens: number }) {
  const pct = Math.min(1, tokensUsed / budgetTokens)
  const color = pct > 0.9 ? badClr : pct > 0.6 ? warnClr : goodClr
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={monoSm(dimmer)}>BUDGET</span>
      <div style={{ width: '80px', height: '3px', background: faint, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={monoSm(color)}>{tokensUsed}/{budgetTokens}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Spine — 6 stage nodes
// ─────────────────────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'document', label: 'DOCUMENT' },
  { id: 'chunk', label: 'CHUNK' },
  { id: 'embed', label: 'EMBED' },
  { id: 'retrieve', label: 'RETRIEVE' },
  { id: 'rerank', label: 'RERANK' },
  { id: 'generate', label: 'GENERATE' },
]

function stageStatus(stageId: string, r: RunResult | null): 'idle' | 'ok' | 'warn' | 'bad' {
  if (!r) return 'idle'
  if (stageId === 'retrieve') return r.retrievalScore.goldHit ? 'ok' : 'bad'
  if (stageId === 'generate') return r.generationScore.hallucinatedClaims === 0 ? 'ok' : 'bad'
  if (stageId === 'rerank') return 'ok'
  return 'ok'
}

function stageColor(status: ReturnType<typeof stageStatus>) {
  return status === 'ok' ? goodClr : status === 'bad' ? badClr : status === 'warn' ? warnClr : 'rgba(255,255,255,0.2)'
}

function PipelineSpine({ runResult, openStage, onOpenStage, knobs, mission }: {
  runResult: RunResult | null
  openStage: string | null
  onOpenStage: (id: string) => void
  knobs: KnobState
  mission: Mission
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Stage nodes row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '12px' }}>
        {STAGES.map((stage, i) => {
          const status = stageStatus(stage.id, runResult)
          const isOpen = openStage === stage.id
          const clr = stageColor(status)
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => onOpenStage(stage.id)}
                style={{
                  padding: '6px 10px', border: `0.5px solid ${isOpen ? clr : faint}`,
                  background: isOpen ? `${clr}18` : card,
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <p style={{ ...monoSm(isOpen ? clr : dimmer), letterSpacing: '0.1em' }}>{stage.label}</p>
                {runResult && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: clr, margin: '3px auto 0' }} />}
              </button>
              {i < STAGES.length - 1 && (
                <div style={{ width: '20px', height: '1px', background: faint }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Stage detail panel */}
      {openStage && runResult && (
        <StageDetail stageId={openStage} runResult={runResult} knobs={knobs} mission={mission} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage detail panels
// ─────────────────────────────────────────────────────────────────────────────
function StageDetail({ stageId, runResult, knobs, mission }: {
  stageId: string
  runResult: RunResult
  knobs: KnobState
  mission: Mission
}) {
  const panelStyle: React.CSSProperties = {
    background: card, border: `0.5px solid ${border}`, borderRadius: '8px', padding: '14px', marginBottom: '8px',
  }

  if (stageId === 'chunk') {
    const fed = runResult.retrieval.fedChunks
    return (
      <div style={panelStyle}>
        <p style={{ ...monoSm(accent), marginBottom: '10px' }}>CHUNK · size={knobs.chunkSize}w overlap={knobs.overlap}w</p>
        <p style={{ fontSize: '12px', color: dimmer, fontFamily: 'var(--font-dm-sans)', marginBottom: '8px' }}>
          {fed.length} chunk{fed.length !== 1 ? 's' : ''} fed to model
        </p>
        {fed.slice(0, 3).map(chunk => (
          <div key={chunk.id} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: `0.5px solid ${faint}` }}>
            <p style={monoSm(dimmer)}>{chunk.id}</p>
            <p style={{ fontSize: '11px', color: dim, lineHeight: '1.5', fontFamily: 'var(--font-dm-sans)', marginTop: '4px' }}>
              {chunk.text.slice(0, 180)}{chunk.text.length > 180 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (stageId === 'retrieve') {
    const { ranked } = runResult.retrieval
    const rs = runResult.retrievalScore
    return (
      <div style={panelStyle}>
        <p style={{ ...monoSm(accent), marginBottom: '8px' }}>RETRIEVE · precision={rs.precision.toFixed(2)} recall={rs.recall.toFixed(2)} F1={rs.f1.toFixed(2)}</p>
        <p style={{ fontSize: '11px', color: rs.goldHit ? goodClr : badClr, fontFamily: 'var(--font-dm-sans)', marginBottom: '10px' }}>
          {rs.goldHit ? '✓ Gold chunk fed to model' : '✗ Gold chunk NOT in top-k — hallucination likely'}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                {['#', 'Chunk', 'Score', 'Dense', 'Sparse', 'Gold', 'Fed'].map(h => (
                  <th key={h} style={{ ...monoSm(dimmer), padding: '3px 6px', textAlign: 'left', borderBottom: `0.5px solid ${faint}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 8).map((sc, i) => (
                <tr key={sc.chunk.id} style={{ background: sc.fedToLLM ? 'rgba(200,240,64,0.05)' : 'transparent' }}>
                  <td style={{ ...monoSm(dimmer), padding: '3px 6px' }}>{i + 1}</td>
                  <td style={{ padding: '3px 6px', color: dim, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }}>{sc.chunk.text.slice(0, 40)}…</td>
                  <td style={{ ...monoSm(sc.isGold ? goodClr : dim), padding: '3px 6px' }}>{sc.score.toFixed(3)}</td>
                  <td style={monoSm(dimmer)}>{sc.denseScore.toFixed(3)}</td>
                  <td style={monoSm(dimmer)}>{sc.sparseScore.toFixed(3)}</td>
                  <td style={{ ...monoSm(sc.isGold ? goodClr : dimmer), padding: '3px 6px' }}>{sc.isGold ? '✓' : '·'}</td>
                  <td style={{ ...monoSm(sc.fedToLLM ? goodClr : dimmer), padding: '3px 6px' }}>{sc.fedToLLM ? '✓' : '·'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (stageId === 'embed') {
    return (
      <div style={panelStyle}>
        <p style={{ ...monoSm(accent), marginBottom: '8px' }}>EMBED · model={knobs.embeddingModel}</p>
        <p style={{ fontSize: '12px', color: dim, fontFamily: 'var(--font-dm-sans)', lineHeight: '1.5' }}>
          {knobs.embeddingModel === 'helix-embed-large'
            ? '✓ Strong semantic model — finds paraphrased concepts across vocabulary gaps.'
            : '⚠ Weak lexical model — high lexical overlap required for good retrieval. Semantic queries may miss.'
          }
        </p>
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: `0.5px solid ${faint}` }}>
          <p style={monoSm(dimmer)}>Embedding space</p>
          <p style={{ fontSize: '11px', color: dimmer, fontFamily: 'var(--font-dm-sans)', marginTop: '4px' }}>
            {runResult.retrieval.fedChunks.length} chunks fed — nearest neighbors by {knobs.method} scoring
          </p>
        </div>
      </div>
    )
  }

  if (stageId === 'rerank') {
    return (
      <div style={panelStyle}>
        <p style={{ ...monoSm(accent), marginBottom: '8px' }}>RERANK · {knobs.rerank ? `on · pool=${knobs.candidatePool}` : 'off'}</p>
        {knobs.rerank ? (
          <p style={{ fontSize: '12px', color: dim, fontFamily: 'var(--font-dm-sans)' }}>
            Cross-encoder rescores top {knobs.candidatePool} candidates. Gold chunks buried by dense score can be rescued here.
          </p>
        ) : (
          <p style={{ fontSize: '12px', color: dimmer, fontFamily: 'var(--font-dm-sans)' }}>
            Reranker disabled. Ranking order = raw retrieval scores.
          </p>
        )}
      </div>
    )
  }

  if (stageId === 'generate') {
    const gs = runResult.generationScore
    return (
      <div style={panelStyle}>
        <p style={{ ...monoSm(accent), marginBottom: '8px' }}>GENERATE · correctness={gs.correctness.toFixed(2)} groundedness={gs.groundedness.toFixed(2)}</p>
        {gs.hallucinatedClaims > 0 && (
          <p style={{ fontSize: '12px', color: badClr, fontFamily: 'var(--font-dm-sans)', marginBottom: '8px' }}>
            ✗ {gs.hallucinatedClaims} hallucinated claim{gs.hallucinatedClaims > 1 ? 's' : ''} — fed context did not cover the required spans.
          </p>
        )}
        {gs.hallucinatedClaims === 0 && (
          <p style={{ fontSize: '12px', color: goodClr, fontFamily: 'var(--font-dm-sans)', marginBottom: '8px' }}>
            ✓ All claims grounded in retrieved context.
          </p>
        )}
      </div>
    )
  }

  if (stageId === 'document') {
    return (
      <div style={panelStyle}>
        <p style={{ ...monoSm(accent), marginBottom: '8px' }}>DOCUMENT · {mission.injection === 'staleIndex' ? 'STALE INDEX ⚠' : 'corpus'}</p>
        {mission.injection === 'staleIndex' && (
          <div style={{ padding: '8px', background: 'rgba(240,88,74,0.08)', border: `0.5px solid ${badClr}44`, borderRadius: '4px', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: badClr, fontFamily: 'var(--font-dm-sans)' }}>
              ⚠ Index is serving doc-api-changelog version 2024-03 (5 business days). The current version is 2024-11 (2 business days).
            </p>
          </div>
        )}
        <p style={{ fontSize: '12px', color: dim, fontFamily: 'var(--font-dm-sans)' }}>
          8 documents · Helix Pay support corpus · policy, legal, support, changelog
        </p>
      </div>
    )
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal Readout (right rail)
// ─────────────────────────────────────────────────────────────────────────────
function SignalReadout({ breakdown, passThreshold, budgetTokens, tokensUsed }: {
  breakdown: ScoreBreakdown | null
  passThreshold: number
  budgetTokens: number
  tokensUsed: number
}) {
  const score = breakdown?.signalScore ?? 0
  const rating = breakdown?.rating ?? 'retry'
  const dialColor = rating === 'gold' ? goodClr : rating === 'pass' ? goodClr : badClr
  const pct = score / 100

  return (
    <div>
      <p style={{ ...monoSm(accent), marginBottom: '14px', letterSpacing: '0.14em' }}>SIGNAL SCORE</p>

      {/* Dial */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <svg width="140" height="80" viewBox="0 0 140 80">
          <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke={dialColor}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${pct * 188} 188`}
            style={{ transition: 'stroke-dasharray 0.6s, stroke 0.3s' }} />
          {/* Target tick */}
          <g transform={`rotate(${(passThreshold / 100) * 180 - 90}, 70, 75)`}>
            <line x1="70" y1="15" x2="70" y2="22" stroke={warnClr} strokeWidth="2" />
          </g>
        </svg>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: dialColor, lineHeight: 1, marginTop: '-20px', transition: 'color 0.3s' }}>
          {score}
        </p>
        <p style={monoSm(dialColor)}>TARGET {passThreshold}</p>
      </div>

      {/* Score breakdown */}
      {breakdown && (
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <ScoreLine label="Correctness" value={`+${breakdown.answerCorrectnessPoints.toFixed(1)}`} color={goodClr} />
          <ScoreLine label="Groundedness" value={`+${breakdown.groundednessPoints.toFixed(1)}`} color={goodClr} />
          <ScoreLine label="Retrieval F1" value={`+${breakdown.retrievalQualityPoints.toFixed(1)}`} color={goodClr} />
          <div style={{ borderTop: `0.5px solid ${faint}`, margin: '6px 0' }} />
          {breakdown.hallucinationPenalty > 0 && <ScoreLine label="Hallucination" value={`-${breakdown.hallucinationPenalty.toFixed(1)}`} color={badClr} />}
          {breakdown.irrelevantChunkPenalty > 0 && <ScoreLine label="Irrelevant chunks" value={`-${breakdown.irrelevantChunkPenalty.toFixed(1)}`} color={warnClr} />}
          {breakdown.overBudgetPenalty > 0 && <ScoreLine label="Over budget" value={`-${breakdown.overBudgetPenalty.toFixed(1)}`} color={badClr} />}
          {breakdown.latencyPenalty > 0 && <ScoreLine label="Latency" value={`-${breakdown.latencyPenalty.toFixed(1)}`} color={warnClr} />}
          <div style={{ borderTop: `0.5px solid ${faint}`, margin: '6px 0' }} />
          <ScoreLine label="TOTAL" value={String(score)} color={dialColor} bold />
        </div>
      )}

      {/* Rating */}
      {breakdown && (
        <div style={{ marginTop: '12px', padding: '8px', background: rating === 'retry' ? 'rgba(240,88,74,0.08)' : 'rgba(200,240,64,0.08)', borderRadius: '6px', textAlign: 'center' }}>
          <p style={monoSm(dialColor)}>{rating === 'gold' ? '⭐ GOLD' : rating === 'pass' ? '✓ PASS' : '↺ RETRY'}</p>
        </div>
      )}
    </div>
  )
}

function ScoreLine({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ color: dimmer, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Knob components
// ─────────────────────────────────────────────────────────────────────────────
function KnobSlider({ label: lbl, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={monoSm(dimmer)}>{lbl}</span>
        <span style={monoSm(dim)}>{typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }} />
    </div>
  )
}

function KnobStepper({ label: lbl, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <span style={monoSm(dimmer)}>{lbl}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => onChange(Math.max(min, value - 1))}
          style={{ background: faint, border: 'none', color: dim, width: '20px', height: '20px', borderRadius: '3px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>−</button>
        <span style={monoSm(dim)}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          style={{ background: faint, border: 'none', color: dim, width: '20px', height: '20px', borderRadius: '3px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>+</button>
      </div>
    </div>
  )
}

function KnobSegmented({ label: lbl, options, value, onChange }: {
  label: string; options: { id: string; label: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <p style={{ ...monoSm(dimmer), marginBottom: '6px' }}>{lbl}</p>
      <div style={{ display: 'flex', gap: '4px' }}>
        {options.map(opt => (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            style={{
              flex: 1, padding: '5px 4px', border: `0.5px solid ${value === opt.id ? accent : faint}`,
              background: value === opt.id ? 'rgba(200,240,64,0.12)' : 'transparent',
              color: value === opt.id ? accent : dimmer,
              fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em',
              borderRadius: '4px', cursor: 'pointer',
            }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function KnobToggle({ label: lbl, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <span style={monoSm(dimmer)}>{lbl}</span>
      <button onClick={() => onChange(!value)}
        style={{
          padding: '4px 10px', border: `0.5px solid ${value ? accent : faint}`,
          background: value ? 'rgba(200,240,64,0.12)' : 'transparent',
          color: value ? accent : dimmer, fontFamily: 'var(--font-mono)', fontSize: '9px',
          borderRadius: '4px', cursor: 'pointer',
        }}>
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

function LockedKnob({ label: lbl, value, hidden }: { label: string; value: string; hidden: boolean }) {
  if (hidden) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', opacity: 0.5 }}>
      <span style={{ ...monoSm('rgba(255,255,255,0.3)'), display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 {lbl}</span>
      <span style={monoSm('rgba(255,255,255,0.3)')}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnosis control (Missions 1, 7, 8)
// ─────────────────────────────────────────────────────────────────────────────
function DiagnosisControl({ choices, value, onChange, submitted, correct, onSubmit }: {
  choices: { id: string; label: string }[]
  value: string | null
  onChange: (v: string) => void
  submitted: boolean
  correct: string
  onSubmit: () => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ ...monoSm(accent), marginBottom: '10px', letterSpacing: '0.12em' }}>DIAGNOSIS</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        {choices.map(c => {
          const isSelected = value === c.id
          const isCorrect = submitted && c.id === correct
          const isWrong = submitted && isSelected && c.id !== correct
          return (
            <button key={c.id} onClick={() => !submitted && onChange(c.id)}
              style={{
                padding: '8px 10px', border: `0.5px solid ${isCorrect ? goodClr : isWrong ? badClr : isSelected ? accent : faint}`,
                background: isCorrect ? 'rgba(200,240,64,0.1)' : isWrong ? 'rgba(240,88,74,0.08)' : isSelected ? 'rgba(200,240,64,0.06)' : 'transparent',
                color: isCorrect ? goodClr : isWrong ? badClr : isSelected ? accent : dim,
                fontFamily: 'var(--font-dm-sans)', fontSize: '12px', textAlign: 'left',
                borderRadius: '6px', cursor: submitted ? 'default' : 'pointer', lineHeight: '1.4',
              }}>
              {c.label}
            </button>
          )
        })}
      </div>
      {!submitted && (
        <button onClick={onSubmit} disabled={!value}
          style={{
            width: '100%', padding: '10px', background: value ? accent : 'rgba(200,240,64,0.2)',
            color: 'black', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em',
            fontWeight: 600, border: 'none', borderRadius: '6px', cursor: value ? 'pointer' : 'default',
          }}>
          SUBMIT →
        </button>
      )}
      {submitted && (
        <p style={{ fontSize: '12px', color: value === correct ? goodClr : badClr, fontFamily: 'var(--font-dm-sans)', lineHeight: '1.4' }}>
          {value === correct ? '✓ Correct. Retrieval missed the gold chunk — weak model + topK=1 meant the right context never reached generation.' : '✗ Not quite. Inspect the Retrieve stage — the gold chunk is not in the top-k.'}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Monitor control (Mission 9)
// ─────────────────────────────────────────────────────────────────────────────
function MonitorControl({ thresholds, onChange }: {
  thresholds: { retrievalRate: number; relevance: number; faithfulness: number; cost: number }
  onChange: (t: typeof thresholds) => void
}) {
  const monitors = [
    { key: 'retrievalRate' as const, label: 'RETRIEVAL RATE', min: 0.5, max: 1, step: 0.01 },
    { key: 'relevance' as const, label: 'RELEVANCE SCORE', min: 0.3, max: 1, step: 0.01 },
    { key: 'faithfulness' as const, label: 'FAITHFULNESS', min: 0.5, max: 1, step: 0.01 },
    { key: 'cost' as const, label: 'COST/RUN ALERT', min: 200, max: 2000, step: 50 },
  ]
  return (
    <div style={{ marginBottom: '14px' }}>
      <p style={{ ...monoSm(accent), marginBottom: '10px' }}>MONITORS</p>
      {monitors.map(m => (
        <KnobSlider key={m.key} label={m.label} value={thresholds[m.key]}
          min={m.min} max={m.max} step={m.step} unit=""
          onChange={v => onChange({ ...thresholds, [m.key]: v })} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Eval suite view (Mission 5 — 2×2 grid)
// ─────────────────────────────────────────────────────────────────────────────
function EvalSuiteView({ knobs, onPass }: { knobs: KnobState; onPass: () => void }) {
  const [tagged, setTagged] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const results = useMemo(() => {
    return EVAL_SET.map(q => {
      const docs = getCorpusForMission('none')
      const chunks = chunkCorpus(docs, knobs.chunkSize, knobs.overlap)
      const retrieval = retrieve({
        query: q, chunks, method: knobs.method, modelId: knobs.embeddingModel,
        topK: knobs.topK, threshold: knobs.threshold, alpha: knobs.alpha,
        rerank: knobs.rerank, candidatePool: knobs.candidatePool,
      })
      const answer = generate(q, retrieval.fedChunks)
      const rs = scoreRetrieval(retrieval.ranked, q.goldSpans)
      const gs = scoreGeneration(answer, q)
      const retrievalOk = rs.goldHit
      const generationOk = gs.hallucinatedClaims === 0
      const correctLabel = !retrievalOk ? 'retrieval' : !generationOk ? 'generation' : 'both-ok'
      return { q, rs, gs, retrievalOk, generationOk, correctLabel }
    })
  }, [knobs])

  const handleSubmit = () => {
    setSubmitted(true)
    const allCorrect = results.every(r => tagged[r.q.id] === r.correctLabel)
    if (allCorrect) onPass()
  }

  const quadrant = (rOk: boolean, gOk: boolean) => {
    if (rOk && gOk) return 'both-ok'
    if (!rOk && !gOk) return 'both-fail'
    if (!rOk) return 'retrieval'
    return 'generation'
  }

  return (
    <div style={{ background: card, border: `0.5px solid ${border}`, borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
      <p style={{ ...monoSm(accent), marginBottom: '12px', letterSpacing: '0.12em' }}>EVAL SUITE · Tag each query's failure mode</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {results.map(r => {
          const userTag = tagged[r.q.id]
          const isCorrect = submitted && userTag === r.correctLabel
          const isWrong = submitted && userTag && userTag !== r.correctLabel
          return (
            <div key={r.q.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: `0.5px solid ${isCorrect ? goodClr + '44' : isWrong ? badClr + '44' : faint}` }}>
              <p style={{ fontSize: '12px', color: dim, marginBottom: '6px', fontFamily: 'var(--font-dm-sans)' }}>{r.q.text}</p>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                <span style={{ ...monoSm(r.rs.goldHit ? goodClr : badClr) }}>R:{r.rs.f1.toFixed(2)}</span>
                <span style={monoSm(dimmer)}>·</span>
                <span style={{ ...monoSm(r.gs.hallucinatedClaims === 0 ? goodClr : badClr) }}>G:{r.gs.correctness.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['retrieval', 'generation', 'both-ok'].map(tag => (
                  <button key={tag} onClick={() => !submitted && setTagged(t => ({ ...t, [r.q.id]: tag }))}
                    style={{
                      padding: '3px 7px', border: `0.5px solid ${userTag === tag ? accent : faint}`,
                      background: userTag === tag ? 'rgba(200,240,64,0.1)' : 'transparent',
                      color: userTag === tag ? accent : dimmer, fontSize: '9px', fontFamily: 'var(--font-mono)',
                      borderRadius: '3px', cursor: 'pointer', letterSpacing: '0.06em',
                    }}>{tag}</button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit} disabled={Object.keys(tagged).length < results.length}
          style={{ marginTop: '12px', width: '100%', padding: '10px', background: Object.keys(tagged).length >= results.length ? accent : 'rgba(200,240,64,0.2)', color: 'black', fontFamily: 'var(--font-mono)', fontSize: '11px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          SUBMIT EVAL →
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario classifier (Mission 10)
// ─────────────────────────────────────────────────────────────────────────────
function ScenarioClassifier({ mission, scenarioAnswers, setScenarioAnswers, onSubmit, passed, showPass, xpEarned, nextMission, progress, attempts }: {
  mission: Mission
  scenarioAnswers: Record<string, string>
  setScenarioAnswers: (v: Record<string, string>) => void
  onSubmit: () => void
  passed: boolean
  showPass: boolean
  xpEarned: number
  nextMission: Mission | undefined
  progress: GameProgress
  attempts: number
}) {
  const [submitted, setSubmitted] = useState(false)
  const cards = mission.scenarioCards ?? []

  const handleSubmit = () => { setSubmitted(true); onSubmit() }

  return (
    <div style={{ minHeight: 'calc(100vh - 57px)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Link href="/playground/rag-lab" style={{ ...monoSm(dimmer), textDecoration: 'none' }}>← Lab</Link>
        <span style={monoSm(dimmer)}>M10 · RAG's Ceiling</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.015)', border: `0.5px solid ${border}`, borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: dim, fontFamily: 'var(--font-dm-sans)' }}>{mission.brief}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '700px' }}>
        {cards.map(card => {
          const ans = scenarioAnswers[card.id]
          const isCorrect = submitted && ans === card.correctChoice
          const isWrong = submitted && ans && ans !== card.correctChoice
          return (
            <div key={card.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${isCorrect ? goodClr + '44' : isWrong ? badClr + '44' : border}`, borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-dm-sans)', lineHeight: '1.5', marginBottom: '10px' }}>{card.description}</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['rag', 'long-context', 'fine-tune'] as const).map(opt => {
                  const selected = ans === opt
                  const correct = submitted && opt === card.correctChoice
                  return (
                    <button key={opt} onClick={() => !submitted && setScenarioAnswers({ ...scenarioAnswers, [card.id]: opt })}
                      style={{
                        padding: '6px 14px', border: `0.5px solid ${correct ? goodClr : selected && !submitted ? accent : faint}`,
                        background: correct ? 'rgba(200,240,64,0.12)' : selected && !submitted ? 'rgba(200,240,64,0.06)' : 'transparent',
                        color: correct ? goodClr : selected && !submitted ? accent : dimmer,
                        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em',
                        borderRadius: '5px', cursor: submitted ? 'default' : 'pointer',
                      }}>{opt}</button>
                  )
                })}
              </div>
              {submitted && <p style={{ fontSize: '11px', color: isCorrect ? goodClr : badClr, marginTop: '8px', fontFamily: 'var(--font-dm-sans)' }}>
                {isCorrect ? `✓ Correct — ${card.correctChoice}` : `✗ Correct answer: ${card.correctChoice}`}
              </p>}
            </div>
          )
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit} disabled={Object.keys(scenarioAnswers).length < cards.length}
          style={{ marginTop: '20px', padding: '12px 28px', background: Object.keys(scenarioAnswers).length >= cards.length ? accent : 'rgba(200,240,64,0.2)', color: 'black', fontFamily: 'var(--font-mono)', fontSize: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          SUBMIT ALL →
        </button>
      )}
      {showPass && <PassOverlay rating="pass" score={100} xpEarned={xpEarned} nextMission={nextMission} onClose={() => {}} missionId={mission.id} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pass overlay
// ─────────────────────────────────────────────────────────────────────────────
function PassOverlay({ rating, score, xpEarned, nextMission, onClose, missionId }: {
  rating: 'pass' | 'gold' | 'retry'
  score: number
  xpEarned: number
  nextMission: Mission | undefined
  onClose: () => void
  missionId: string
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#111', border: `0.5px solid ${rating === 'gold' ? goodClr + '66' : 'rgba(255,255,255,0.15)'}`, borderRadius: '12px', padding: '40px 48px', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
        <p style={{ fontSize: rating === 'gold' ? '48px' : '32px', marginBottom: '8px' }}>{rating === 'gold' ? '⭐' : '✓'}</p>
        <p className="font-display font-medium" style={{ fontSize: '28px', fontStyle: 'italic', color: rating === 'gold' ? goodClr : 'rgba(255,255,255,0.9)', marginBottom: '6px' }}>
          {rating === 'gold' ? 'Gold Signal' : 'Mission Clear'}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', color: goodClr, lineHeight: 1, marginBottom: '20px' }}>{score}</p>

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={monoSm(dimmer)}>XP EARNED</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: goodClr, marginTop: '2px' }}>+{xpEarned}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          {nextMission && (
            <Link href={`/playground/rag-lab/${nextMission.id}`}
              style={{ padding: '12px', background: accent, color: 'black', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', fontWeight: 600, borderRadius: '8px', textDecoration: 'none', display: 'block' }}>
              NEXT: {nextMission.title} →
            </Link>
          )}
          <button onClick={onClose}
            style={{ padding: '10px', background: 'transparent', border: `0.5px solid ${faint}`, color: dim, fontFamily: 'var(--font-mono)', fontSize: '11px', borderRadius: '8px', cursor: 'pointer' }}>
            Stay & Replay
          </button>
          <Link href="/playground/rag-lab"
            style={{ padding: '10px', color: dimmer, fontFamily: 'var(--font-mono)', fontSize: '11px', textDecoration: 'none', display: 'block' }}>
            Back to Lab →
          </Link>
        </div>
      </div>
    </div>
  )
}
