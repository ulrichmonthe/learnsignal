import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Skill model ───────────────────────────────────────────────────────────────
// Each "track" (a lab or a course) contributes to one skill dimension, up to a
// cap. Practice (labs) is weighted heavier than reading (courses), so:
//   finish the course → ~30%, clear the lab → ~70%, both → 100%.
// A dimension's score is the (capped) sum of its tracks' contributions.

type Track = {
  dimension: string
  max: number // contribution cap for this track
  frac: (data: unknown) => number // 0..1 completion
  count: (data: unknown) => number // raw items done (for decisions_count)
}

function missionsDone(data: unknown, total: number): number {
  const d = data as { missions?: Record<string, { completed?: boolean }> } | null
  return Math.min(total, Object.values(d?.missions ?? {}).filter((m) => m?.completed).length)
}
function lessonsDone(data: unknown): { done: number; total: number } {
  const d = data as { completedSlugs?: string[]; total?: number } | null
  const done = (d?.completedSlugs ?? []).length
  const total = d?.total && d.total > 0 ? d.total : 16
  return { done: Math.min(total, done), total }
}
function completedOnce(data: unknown): number {
  const d = data as { completed?: boolean } | null
  return d?.completed === true ? 1 : 0
}

export const TRACKS: Record<string, Track> = {
  // Labs (practice) — heavier weight
  raglab: { dimension: 'technical-foundation', max: 70, frac: (d) => missionsDone(d, 13) / 13, count: (d) => missionsDone(d, 13) },
  pcelab: { dimension: 'product-craft', max: 70, frac: (d) => missionsDone(d, 10) / 10, count: (d) => missionsDone(d, 10) },
  // Eval Lab vibe check is one-shot: completing the reveal = full fraction.
  evallab: { dimension: 'product-taste', max: 70, frac: completedOnce, count: completedOnce },

  // Courses (reading) — lighter weight where a lab also exists…
  'course:rag': { dimension: 'technical-foundation', max: 30, frac: (d) => lessonsDone(d).done / lessonsDone(d).total, count: (d) => lessonsDone(d).done },
  'course:prompt-context-engineering': { dimension: 'product-craft', max: 30, frac: (d) => lessonsDone(d).done / lessonsDone(d).total, count: (d) => lessonsDone(d).done },
  'course:evals-foundations': { dimension: 'product-taste', max: 30, frac: (d) => lessonsDone(d).done / lessonsDone(d).total, count: (d) => lessonsDone(d).done },

  // …and full weight where the course is the only source for its dimension.
  'course:harness-engineering': { dimension: 'execution', max: 100, frac: (d) => lessonsDone(d).done / lessonsDone(d).total, count: (d) => lessonsDone(d).done },
}

// Recompute every dimension from ALL the user's tracks and upsert skill_scores.
// Called after any lab/course progress write, so multiple sources for one
// dimension combine instead of clobbering each other.
export async function recomputeSkills(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: rows } = await supabase
    .from('lab_progress')
    .select('lab, data')
    .eq('user_id', userId)

  const score: Record<string, number> = {}
  const count: Record<string, number> = {}

  for (const row of rows ?? []) {
    const t = TRACKS[row.lab as string]
    if (!t) continue
    const frac = Math.max(0, Math.min(1, t.frac(row.data)))
    score[t.dimension] = (score[t.dimension] ?? 0) + frac * t.max
    count[t.dimension] = (count[t.dimension] ?? 0) + t.count(row.data)
  }

  const now = new Date().toISOString()
  for (const dimension of Object.keys(score)) {
    const { error } = await supabase.from('skill_scores').upsert(
      {
        user_id: userId,
        dimension,
        score: Math.min(100, Math.round(score[dimension])),
        decisions_count: count[dimension],
        last_updated: now,
      },
      { onConflict: 'user_id,dimension' },
    )
    // Never fail silently: a rejected upsert here means the Skill Map stops
    // moving, which looks like "the feature does nothing" rather than a bug.
    if (error) {
      throw new Error(`Skill recompute failed for ${dimension}: ${error.message}`)
    }
  }
}
