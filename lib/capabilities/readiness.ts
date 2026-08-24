import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// Database access for the job-gap loop. The readiness maths itself lives in
// ./scoring (pure, unit-tested) and is re-exported here so existing call sites
// keep importing from one place.
//
// Readiness = demonstrated practice only. Levels count completed lessons, lab
// missions and scenarios; resume claims can flip an untrained chip to "claimed"
// but never raise a level or reduce the gap count — a resume changes the path,
// not the proof.

export { itemDone, practiceLevel, jobReadiness } from './scoring'
export type { ProgressRows, ScenarioSignal } from './scoring'

import type { ProgressRows } from './scoring'

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
