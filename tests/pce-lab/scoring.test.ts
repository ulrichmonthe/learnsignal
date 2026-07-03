// Regression suite for the PCE Lab eval criteria and completion rule.
// Locks in the fixes: docs-not-in-middle no longer false-positives on
// "User profile", retrieval-reranked rejects negated mentions, the canonical
// docs budget passes the chunk criterion, and Mission 1 (orientation) only
// completes after the real action (saving a version).
import { describe, it, expect } from 'vitest'
import { getMissionById, MISSIONS, CANONICAL_BLUEPRINT } from '@/lib/pce-lab/missions'
import { checkCriterion, scoreState, isMissionComplete } from '@/lib/pce-lab/scoring'
import type { ContextBlueprintRow, MissionState } from '@/lib/pce-lab/types'

const mission1 = getMissionById('mission-1')!
const mission7 = getMissionById('mission-7')!

function canonicalState(): MissionState {
  return {
    prompt: { ...mission1.startingState.prompt },
    fewShots: mission1.startingState.fewShots.map(f => ({ ...f })),
    contextBlueprint: mission1.startingState.contextBlueprint.map(r => ({ ...r })),
  }
}

function withBlueprint(rows: ContextBlueprintRow[]): MissionState {
  return { ...canonicalState(), contextBlueprint: rows }
}

function docsRow(overrides: Partial<ContextBlueprintRow>): ContextBlueprintRow[] {
  return CANONICAL_BLUEPRINT.map(r =>
    /help-center/i.test(r.source) ? { ...r, ...overrides } : { ...r }
  )
}

describe('docs-not-in-middle', () => {
  it('passes on the canonical blueprint (User profile before docs is fine)', () => {
    const result = checkCriterion('docs-not-in-middle', canonicalState())
    expect(result.pass).toBe(true)
  })

  it('fails when docs come after the current question', () => {
    const rows = CANONICAL_BLUEPRINT.map(r => ({ ...r }))
    const docsIdx = rows.findIndex(r => /help-center/i.test(r.source))
    const questionIdx = rows.findIndex(r => /question/i.test(r.source))
    const [docs] = rows.splice(docsIdx, 1)
    rows.splice(questionIdx, 0, docs) // docs now after the question
    const result = checkCriterion('docs-not-in-middle', withBlueprint(rows))
    expect(result.pass).toBe(false)
  })

  it('fails when docs sit in the last two blueprint positions', () => {
    const rows = CANONICAL_BLUEPRINT.filter(r => !/help-center/i.test(r.source)).map(r => ({ ...r }))
    const docs = CANONICAL_BLUEPRINT.find(r => /help-center/i.test(r.source))!
    rows.push({ ...docs })
    const result = checkCriterion('docs-not-in-middle', withBlueprint(rows))
    expect(result.pass).toBe(false)
  })
})

describe('retrieval-reranked', () => {
  it('fails on the Mission 7 sabotage "no reranking"', () => {
    const state: MissionState = {
      ...canonicalState(),
      contextBlueprint: mission7.startingState.contextBlueprint.map(r => ({ ...r })),
    }
    const result = checkCriterion('retrieval-reranked', state)
    expect(result.pass).toBe(false)
  })

  it.each(['no reranking', 'without reranking', 'reranking disabled', 'reranking is off'])(
    'fails on negated mention: "%s"',
    notes => {
      const result = checkCriterion('retrieval-reranked', withBlueprint(docsRow({ notes })))
      expect(result.pass).toBe(false)
    }
  )

  it('passes on the canonical notes ("Top 3–5 chunks, reranked, just-in-time")', () => {
    const result = checkCriterion('retrieval-reranked', canonicalState())
    expect(result.pass).toBe(true)
  })

  it('fails when reranking is not mentioned at all', () => {
    const result = checkCriterion('retrieval-reranked', withBlueprint(docsRow({ notes: 'Top 5 chunks' })))
    expect(result.pass).toBe(false)
  })
})

describe('retrieval-max-5-chunks', () => {
  it('passes on the canonical row (budget "~1500t", notes state 3–5 chunks)', () => {
    const result = checkCriterion('retrieval-max-5-chunks', canonicalState())
    expect(result.pass).toBe(true)
  })

  it('fails on the Mission 7 sabotage (12 chunks retrieved)', () => {
    const state: MissionState = {
      ...canonicalState(),
      contextBlueprint: mission7.startingState.contextBlueprint.map(r => ({ ...r })),
    }
    const result = checkCriterion('retrieval-max-5-chunks', state)
    expect(result.pass).toBe(false)
  })

  it('passes when the budget itself states "5 chunks"', () => {
    const result = checkCriterion(
      'retrieval-max-5-chunks',
      withBlueprint(docsRow({ budget: '5 chunks (~1500t)', notes: 'reranked' }))
    )
    expect(result.pass).toBe(true)
  })

  it('fails when only a token figure is given (no chunk count anywhere)', () => {
    const result = checkCriterion(
      'retrieval-max-5-chunks',
      withBlueprint(docsRow({ budget: '~800t', notes: 'reranked, just-in-time' }))
    )
    expect(result.pass).toBe(false)
  })
})

describe('mission completion rule', () => {
  it('Mission 1 starting state meets its target score', () => {
    const score = scoreState(mission1.startingState, mission1)
    expect(score.composite).toBeGreaterThanOrEqual(mission1.targetScore)
  })

  it('Mission 1 is NOT complete on page load (no version saved)', () => {
    const score = scoreState(mission1.startingState, mission1)
    expect(isMissionComplete(score, mission1, 0)).toBe(false)
  })

  it('Mission 1 completes after saving a version', () => {
    const score = scoreState(mission1.startingState, mission1)
    expect(isMissionComplete(score, mission1, 1)).toBe(true)
  })

  it('missions that start below target complete on score alone', () => {
    const mission2 = getMissionById('mission-2')!
    const baseline = scoreState(mission2.startingState, mission2)
    expect(baseline.composite).toBeLessThan(mission2.targetScore)
    const passing = { ...baseline, composite: mission2.targetScore }
    expect(isMissionComplete(passing, mission2, 0)).toBe(true)
    expect(isMissionComplete(baseline, mission2, 5)).toBe(false)
  })
})

describe('criteria wiring', () => {
  it('every criterion referenced by a mission ticket is implemented', () => {
    const state = canonicalState()
    for (const mission of MISSIONS) {
      for (const ticket of mission.tickets) {
        for (const criterion of ticket.evalCriteria) {
          const result = checkCriterion(criterion, state)
          expect(result.note).not.toMatch(/^Unknown criterion/)
        }
      }
    }
  })
})
