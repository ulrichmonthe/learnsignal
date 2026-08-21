import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CAPABILITY_MAP, capLabel, demandLevel, type CapabilityItem } from './map'
import type { CapReadiness, CapState, JobReadiness } from './types'

// Readiness = demonstrated practice only. Levels count completed mapped items
// from the same lab_progress rows the Skill Map already uses; resume claims
// (resume_claims) can flip an untrained chip to "claimed" but never raise a
// level or reduce the gap count — a resume changes the path, not the proof.

export type ProgressRows = Map<string, unknown> // lab key → data

export async function getPractice(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProgressRows> {
  const { data } = await supabase
    .from('lab_progress')
    .select('lab, data')
    .eq('user_id', userId)
  return new Map((data ?? []).map((r: { lab: string; data: unknown }) => [r.lab, r.data]))
}

/** Capabilities claimed on the user's resume (evidence quotes live in the table). */
export async function getClaimedCaps(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('resume_claims')
      .select('capability')
      .eq('user_id', userId)
    if (error) return new Set()
    return new Set((data ?? []).map((r: { capability: string }) => r.capability))
  } catch {
    return new Set() // table not created yet — degrade to no claims
  }
}

export function itemDone(item: CapabilityItem, rows: ProgressRows): boolean {
  if (item.kind === 'lesson') {
    const d = rows.get(`course:${item.course}`) as { completedSlugs?: string[] } | undefined
    return (d?.completedSlugs ?? []).includes(item.slug)
  }
  if (item.kind === 'mission') {
    const d = rows.get(item.lab) as { missions?: Record<string, { completed?: boolean }> } | undefined
    return d?.missions?.[item.missionId]?.completed === true
  }
  const d = rows.get('evallab') as { completed?: boolean } | undefined
  return d?.completed === true
}

export function practiceLevel(cap: string, rows: ProgressRows): number {
  const def = CAPABILITY_MAP[cap]
  if (!def) return 0
  return def.items.filter((it) => itemDone(it, rows)).length
}

export function jobReadiness(
  job: { aiDepth: number; seniority: string; capabilitiesRequired: string[] },
  rows: ProgressRows,
  claimed: Set<string>,
): JobReadiness {
  const caps: CapReadiness[] = job.capabilitiesRequired
    .filter((c) => CAPABILITY_MAP[c])
    .map((cap) => {
      const need = demandLevel(job, cap)
      const level = practiceLevel(cap, rows)
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
