import { describe, expect, it } from 'vitest'
import {
  jobReadiness,
  practiceLevel,
  type ProgressRows,
  type ScenarioSignal,
} from '@/lib/capabilities/scoring'
import { CAPABILITY_MAP, demandLevel } from '@/lib/capabilities/map'

// US-02 AC-3, AC-6, AC-7. The job-gap loop is already shipped and live, so the
// highest-value assertions here are the REGRESSION ones: adding scenarios must
// not move a single number for a learner who has no scenario data.

const noProgress: ProgressRows = new Map()

// A learner who has completed the two evals lessons that eval_design maps to.
const someProgress: ProgressRows = new Map([
  ['course:evals-foundations', { completedSlugs: ['lesson-4', 'lesson-7'] }],
])

const junior = { aiDepth: 3, seniority: 'ic_senior', capabilitiesRequired: ['eval_design'] }
const senior = { aiDepth: 5, seniority: 'staff', capabilitiesRequired: ['eval_design'] }

describe('practiceLevel — regression (AC-7)', () => {
  it('omitting scenarios matches passing an empty array', () => {
    expect(practiceLevel('eval_design', someProgress)).toBe(
      practiceLevel('eval_design', someProgress, []),
    )
  })

  it('counts only mapped items when there is no scenario data', () => {
    expect(practiceLevel('eval_design', someProgress)).toBe(2)
    expect(practiceLevel('eval_design', noProgress)).toBe(0)
  })

  it('returns 0 for an unknown capability rather than throwing', () => {
    expect(practiceLevel('not_a_capability', someProgress)).toBe(0)
  })
})

describe('practiceLevel — scenarios (AC-3, AC-8)', () => {
  const completed: ScenarioSignal = { capabilities: ['eval_design'], completed: true }
  const started: ScenarioSignal = { capabilities: ['eval_design'], completed: false }
  const unrelated: ScenarioSignal = { capabilities: ['cost_modelling'], completed: true }

  it('a completed tagged scenario raises the level', () => {
    expect(practiceLevel('eval_design', someProgress, [completed])).toBe(3)
  })

  it('a merely-started scenario does NOT raise the level (AC-8)', () => {
    expect(practiceLevel('eval_design', someProgress, [started])).toBe(2)
  })

  it('a scenario tagged with a different capability does not leak across', () => {
    expect(practiceLevel('eval_design', someProgress, [unrelated])).toBe(2)
    expect(practiceLevel('cost_modelling', noProgress, [unrelated])).toBe(1)
  })

  it('several completed scenarios each count once', () => {
    expect(practiceLevel('eval_design', noProgress, [completed, completed])).toBe(2)
  })

  it('a scenario can carry more than one capability', () => {
    const multi: ScenarioSignal = {
      capabilities: ['eval_design', 'ml_metrics'],
      completed: true,
    }
    expect(practiceLevel('eval_design', noProgress, [multi])).toBe(1)
    expect(practiceLevel('ml_metrics', noProgress, [multi])).toBe(1)
  })
})

describe('jobReadiness — regression (AC-6, AC-7)', () => {
  it('produces identical output with no scenarios vs an empty array', () => {
    const a = jobReadiness(junior, someProgress, new Set())
    const b = jobReadiness(junior, someProgress, new Set(), [])
    expect(a).toEqual(b)
  })

  it('an untouched learner still reads as all-gaps, not ready', () => {
    const r = jobReadiness(junior, noProgress, new Set())
    expect(r.ready).toBe(false)
    expect(r.gaps).toBe(1)
    expect(r.caps[0].state).toBe('none')
    expect(r.caps[0].level).toBe(0)
  })

  it('resume claims still surface as "claimed" and do NOT reduce the gap count', () => {
    const r = jobReadiness(junior, noProgress, new Set(['eval_design']))
    expect(r.caps[0].state).toBe('claimed')
    expect(r.gaps).toBe(1) // a claim is not proof
    expect(r.ready).toBe(false)
  })

  it('a claim never raises the level number', () => {
    const r = jobReadiness(junior, noProgress, new Set(['eval_design']))
    expect(r.caps[0].level).toBe(0)
  })
})

describe('jobReadiness — scenarios close gaps (AC-3)', () => {
  it('completed scenarios can move a capability to met', () => {
    const need = demandLevel(junior, 'eval_design')
    const scenarios: ScenarioSignal[] = Array.from({ length: need }, () => ({
      capabilities: ['eval_design'],
      completed: true,
    }))
    const r = jobReadiness(junior, noProgress, new Set(), scenarios)
    expect(r.caps[0].state).toBe('met')
    expect(r.ready).toBe(true)
    expect(r.gaps).toBe(0)
  })

  it('over-shooting the demand stays met and never yields a negative gap count', () => {
    const scenarios: ScenarioSignal[] = Array.from({ length: 12 }, () => ({
      capabilities: ['eval_design'],
      completed: true,
    }))
    const r = jobReadiness(senior, someProgress, new Set(), scenarios)
    expect(r.caps[0].state).toBe('met')
    expect(r.gaps).toBe(0)
    expect(r.gaps).toBeGreaterThanOrEqual(0)
  })

  it('a senior/deep role demands more than a mid role', () => {
    expect(demandLevel(senior, 'eval_design')).toBeGreaterThan(
      demandLevel(junior, 'eval_design'),
    )
  })

  it('demand never exceeds what the map can actually train', () => {
    for (const cap of Object.keys(CAPABILITY_MAP)) {
      expect(demandLevel(senior, cap)).toBeLessThanOrEqual(CAPABILITY_MAP[cap].items.length)
    }
  })
})

describe('jobReadiness — unknown capabilities (AC-2)', () => {
  it('silently drops taxonomy keys it does not know', () => {
    const r = jobReadiness(
      { ...junior, capabilitiesRequired: ['eval_design', 'made_up_thing'] },
      noProgress,
      new Set(),
    )
    expect(r.caps).toHaveLength(1)
    expect(r.caps[0].cap).toBe('eval_design')
  })

  it('a job with no recognisable capabilities is not falsely "ready"', () => {
    const r = jobReadiness(
      { ...junior, capabilitiesRequired: ['nonsense'] },
      noProgress,
      new Set(),
    )
    expect(r.caps).toHaveLength(0)
    expect(r.ready).toBe(false)
  })
})
