import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeCapabilities } from './taxonomy'

export { normalizeCapabilities }

// Scenarios contribute to capability practice alongside lessons and lab
// missions. They live in Supabase (not in the static map), so they're resolved
// at request time and merged into readiness/prep.

export interface ScenarioPractice {
  id: string
  slug: string
  title: string
  capabilities: string[]
  estimatedMinutes: number
  completed: boolean
}

/**
 * Published scenarios that carry at least one capability, with this learner's
 * completion state. Returns [] on any failure so readiness degrades to
 * lessons+labs rather than breaking the board.
 */
export async function getScenarioPractice(
  supabase: SupabaseClient,
  userId: string,
): Promise<ScenarioPractice[]> {
  try {
    const [{ data: scenarios, error }, { data: completions }] = await Promise.all([
      supabase
        .from('scenarios')
        .select('id, slug, title, capabilities, estimated_minutes')
        .eq('published', true),
      supabase
        .from('scenario_completions')
        .select('scenario_id, completed')
        .eq('user_id', userId),
    ])
    if (error || !scenarios) return []

    const done = new Set(
      (completions ?? [])
        .filter((c: { completed?: boolean }) => c.completed === true)
        .map((c: { scenario_id: string }) => c.scenario_id),
    )

    return (scenarios as Array<Record<string, unknown>>)
      .map((s) => ({
        id: String(s.id ?? ''),
        slug: String(s.slug ?? ''),
        title: String(s.title ?? ''),
        capabilities: normalizeCapabilities(s.capabilities),
        // Distinguish a real 0 from a missing/NaN value; `|| 20` would inflate
        // both into 20 and skew the "~N min of practice" estimate on /prep.
        estimatedMinutes: Number.isFinite(Number(s.estimated_minutes))
          ? Number(s.estimated_minutes)
          : 20,
        completed: done.has(String(s.id ?? '')),
      }))
      .filter((s) => s.capabilities.length > 0)
  } catch {
    return []
  }
}
