'use client'

import { useCallback, useRef, useState } from 'react'
import { SituationAct } from './situation-act'
import { DecisionAct, type DecisionCommit } from './decision-act'
import { ConsequencesAct } from './consequences-act'

interface Props {
  scenario: {
    id: string
    title: string
    acts: Act[]
    estimated_minutes: number | null
    version?: string | number | null // scenarios.version is an integer column
  }
  existingCompletion: { current_act: number; decisions: Record<string, unknown> | null } | null
}

interface Act {
  actNumber: number
  type: 'situation' | 'decision' | 'consequences' | 'concept' | 'tool' | 'warroom'
  content: string
  options?: Array<{ id: string; text: string; consequence: string; isExpertPath: boolean }>
}

export function ScenarioContainer({ scenario, existingCompletion }: Props) {
  const [currentAct, setCurrentAct] = useState(existingCompletion?.current_act ?? 1)
  const [decisions, setDecisions] = useState<Record<string, string>>(
    (existingCompletion?.decisions as Record<string, string> | null) ?? {},
  )
  // One attempt id per mount, so every event in this run is groupable.
  const attemptId = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : '',
  )
  // Guards a double-click / double-tap from emitting the same decision twice —
  // React state has not re-rendered yet, so both handlers would see the same act.
  const committing = useRef(false)
  // Progress writes are fire-and-forget, so a slow earlier request can land
  // after a later one and rewind current_act. Only ever write forward.
  const highestSaved = useRef(existingCompletion?.current_act ?? 1)

  const acts: Act[] = Array.isArray(scenario.acts) ? scenario.acts : []
  const act = acts.find((a) => a.actNumber === currentAct)
  const totalActs = acts.length
  // Completion is keyed off the highest authored act number, not the count —
  // those differ whenever act numbers are non-contiguous.
  const maxActNumber = acts.reduce((m, a) => Math.max(m, a.actNumber), 0)
  const actIndex = acts.filter((a) => a.actNumber <= currentAct).length

  // Persistence and capture are both best-effort: a failure must never block
  // the learner or surface an error mid-scenario.
  const saveProgress = useCallback(
    (nextAct: number, nextDecisions: Record<string, string>, completed: boolean) => {
      // Never move a learner backwards because of request reordering.
      if (nextAct < highestSaved.current && !completed) return
      highestSaved.current = Math.max(highestSaved.current, nextAct)
      void fetch('/api/scenarios/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          currentAct: nextAct,
          decisions: nextDecisions,
          completed,
        }),
      }).catch(() => {})
    },
    [scenario.id],
  )

  const captureDecision = useCallback(
    (nodeId: string, commit: DecisionCommit, options: Act['options']) => {
      void fetch('/api/scenarios/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          scenarioVersion: scenario.version ?? '1',
          attemptId: attemptId.current,
          nodeId,
          choiceId: commit.choiceId,
          optionIds: (options ?? []).map((o) => o.id),
          optionTexts: (options ?? []).map((o) => o.text),
          rationale: commit.rationale,
          confidencePct: commit.confidencePct,
          predMajorityId: commit.predMajorityId,
          timeToDecideMs: commit.timeToDecideMs,
          pressureProfile: 'untimed',
        }),
      }).catch(() => {})
    },
    [scenario.id, scenario.version],
  )

  // Acts are authored data and may not be contiguous (1, 2, 4…). Step to the
  // next act that actually exists, so a gap can't strand the learner on a
  // "complete" screen mid-scenario.
  const advance = useCallback(
    (from: number): number => {
      const next = acts
        .map((a) => a.actNumber)
        .filter((n) => n > from)
        .sort((a, b) => a - b)[0]
      return next ?? maxActNumber + 1
    },
    [acts, maxActNumber],
  )

  function handleDecision(nodeId: string, commit: DecisionCommit, options: Act['options']) {
    if (committing.current) return
    committing.current = true

    const next = { ...decisions, [nodeId]: commit.choiceId }
    const nextAct = advance(currentAct)
    setDecisions(next)
    setCurrentAct(nextAct)
    captureDecision(nodeId, commit, options)
    saveProgress(nextAct, next, nextAct > maxActNumber)

    // Released after the state flush that unmounts this decision act.
    setTimeout(() => {
      committing.current = false
    }, 0)
  }

  function goNext() {
    const nextAct = advance(currentAct)
    setCurrentAct(nextAct)
    saveProgress(nextAct, decisions, nextAct > maxActNumber)
  }

  if (!act) {
    return (
      <div className="text-center py-24">
        <p className="font-display text-2xl font-black text-text mb-3">Scenario complete</p>
        <p className="text-text2 text-sm">You worked through all {totalActs} acts.</p>
        <a
          href="/scenarios"
          className="tap inline-block mt-6 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-bg"
        >
          Back to scenarios →
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <span className="font-mono text-xs text-text3">
          Act {actIndex} of {totalActs}
        </span>
        <div className="flex-1 h-px bg-border">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${Math.min(100, (actIndex / Math.max(1, totalActs)) * 100)}%` }}
          />
        </div>
        <span className="font-mono text-xs text-text3">{scenario.estimated_minutes} min</span>
      </div>

      {/* Act renderer */}
      {act.type === 'situation' && <SituationAct content={act.content} onContinue={goNext} />}
      {act.type === 'decision' && (
        <DecisionAct
          options={act.options ?? []}
          onDecide={(commit) => handleDecision(`act-${currentAct}`, commit, act.options)}
        />
      )}
      {act.type === 'consequences' && (
        <ConsequencesAct
          content={act.content}
          decisions={decisions}
          options={acts.find((a) => a.type === 'decision')?.options ?? []}
          onContinue={goNext}
        />
      )}
      {['concept', 'tool', 'warroom'].includes(act.type) && (
        <div>
          <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-4">
            Act {currentAct} — {act.type}
          </p>
          <div className="prose prose-invert text-text2 text-sm leading-relaxed mb-8">
            {act.content}
          </div>
          {/* Always render the control. Gating it on `currentAct < totalActs`
              left a final concept/tool/warroom act with no way forward, so the
              run could never be marked complete — and completion now feeds
              capability practice. */}
          <button
            onClick={goNext}
            className="tap bg-accent text-bg font-mono text-sm font-medium px-6 py-3"
          >
            {currentAct >= maxActNumber ? 'Finish scenario →' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}
