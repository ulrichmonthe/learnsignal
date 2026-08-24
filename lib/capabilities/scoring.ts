import { CAPABILITY_MAP, capLabel, demandLevel, type CapabilityItem } from './map'
import type { CapReadiness, CapState, JobReadiness } from './types'

// Pure readiness maths. Deliberately NOT server-only: this is the core of the
// job-gap loop and it must be unit-testable. Database access lives in
// readiness.ts, which re-exports everything here.

export type ProgressRows = Map<string, unknown> // lab key → data

/** A scenario's contribution to practice. Mirrors ScenarioPractice minus the DB concerns. */
export interface ScenarioSignal {
  capabilities: string[]
  completed: boolean
}

export function itemDone(item: CapabilityItem, rows: ProgressRows): boolean {
  if (item.kind === 'lesson') {
    const d = rows.get(`course:${item.course}`) as { completedSlugs?: string[] } | undefined
    return (d?.completedSlugs ?? []).includes(item.slug)
  }
  if (item.kind === 'mission') {
    const d = rows.get(item.lab) as
      | { missions?: Record<string, { completed?: boolean }> }
      | undefined
    return d?.missions?.[item.missionId]?.completed === true
  }
  const d = rows.get('evallab') as { completed?: boolean } | undefined
  return d?.completed === true
}

/**
 * Completed lessons + lab missions for a capability, plus any completed
 * scenarios tagged with it. Scenarios are the hardest practice on the platform,
 * so each counts as a full item. Omitting `scenarios` reproduces the
 * pre-scenario behaviour exactly.
 */
export function practiceLevel(
  cap: string,
  rows: ProgressRows,
  scenarios: ScenarioSignal[] = [],
): number {
  const def = CAPABILITY_MAP[cap]
  if (!def) return 0
  const fromMap = def.items.filter((it) => itemDone(it, rows)).length
  const fromScenarios = scenarios.filter(
    (s) => s.completed === true && s.capabilities.includes(cap),
  ).length
  return fromMap + fromScenarios
}

export function jobReadiness(
  job: { aiDepth: number; seniority: string; capabilitiesRequired: string[] },
  rows: ProgressRows,
  claimed: Set<string>,
  scenarios: ScenarioSignal[] = [],
): JobReadiness {
  const caps: CapReadiness[] = job.capabilitiesRequired
    .filter((c) => CAPABILITY_MAP[c])
    .map((cap) => {
      const need = demandLevel(job, cap)
      const level = practiceLevel(cap, rows, scenarios)
      let state: CapState
      if (level >= need && need > 0) state = 'met'
      else if (level > 0) state = 'near'
      else if (claimed.has(cap)) state = 'claimed'
      else state = 'none'
      return { cap, label: capLabel(cap), state, level, need }
    })
  const gaps = caps.filter((c) => c.state !== 'met').length
  return { gaps, ready: caps.length > 0 && gaps === 0, caps }
}
