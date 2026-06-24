'use client'

import { useState } from 'react'
import { SituationAct } from './situation-act'
import { DecisionAct } from './decision-act'
import { ConsequencesAct } from './consequences-act'

interface Props {
  scenario: {
    id: string
    title: string
    acts: Act[]
    estimated_minutes: number | null
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
    (existingCompletion?.decisions as Record<string, string> | null) ?? {}
  )

  const acts: Act[] = Array.isArray(scenario.acts) ? scenario.acts : []
  const act = acts.find(a => a.actNumber === currentAct)
  const totalActs = acts.length

  function handleDecision(decisionId: string, optionId: string) {
    setDecisions(prev => ({ ...prev, [decisionId]: optionId }))
    setCurrentAct(n => n + 1)
  }

  function goNext() {
    setCurrentAct(n => Math.min(n + 1, totalActs))
  }

  if (!act) {
    return (
      <div className="text-center py-24">
        <p className="font-display text-2xl font-black text-text mb-3">Scenario complete</p>
        <p className="text-text2 text-sm">You worked through all {totalActs} acts.</p>
        <a href="/scenarios" className="inline-block mt-6 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors">
          Back to scenarios →
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <span className="font-mono text-xs text-text3">Act {currentAct} of {totalActs}</span>
        <div className="flex-1 h-px bg-border">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(currentAct / totalActs) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs text-text3">{scenario.estimated_minutes} min</span>
      </div>

      {/* Act renderer */}
      {act.type === 'situation' && (
        <SituationAct content={act.content} onContinue={goNext} />
      )}
      {act.type === 'decision' && (
        <DecisionAct
          options={act.options ?? []}
          onDecide={(optionId) => handleDecision(`act-${currentAct}`, optionId)}
        />
      )}
      {act.type === 'consequences' && (
        <ConsequencesAct
          content={act.content}
          decisions={decisions}
          options={acts.find(a => a.type === 'decision')?.options ?? []}
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
          {currentAct < totalActs && (
            <button
              onClick={goNext}
              className="bg-accent text-bg font-mono text-sm font-medium px-6 py-3 hover:bg-accent-dk transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
