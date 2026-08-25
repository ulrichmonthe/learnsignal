import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { calibration } from './exercise'
import { learnerKey } from './core'

// Read side of the calibration corpus. Only first attempts count — retries and
// hint-assisted runs are excluded from anything displayed (D §5 rule 5).

export interface CalibrationSummary {
  pct: number
  n: number
}

function pepper(): string | null {
  return process.env.LEARNER_KEY_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

/**
 * Share of a learner's first-attempt decisions where they chose the option the
 * practitioner would have. Returns null when there isn't enough signal to quote
 * a number honestly, or when the corpus is unavailable — callers fall back to
 * showing raw counts.
 */
export async function getCalibration(
  supabase: SupabaseClient,
  userId: string,
): Promise<CalibrationSummary | null> {
  const secret = pepper()
  if (!secret) return null

  try {
    const { data, error } = await supabase
      .from('decision_events')
      .select('expert_verdict')
      .eq('learner_key', learnerKey(userId, secret))
      // Scoped to one surface on purpose. decision_events is shared with the
      // scenario engine, which runs a different pressure condition; pooling the
      // two into one published percentage is exactly what D §5 rule 4 forbids.
      .eq('client_surface', 'course-exercise')
      .eq('is_first_attempt', true)
      .not('expert_verdict', 'is', null)
    if (error || !data) return null
    return calibration(data.map((r: { expert_verdict: string | null }) => r.expert_verdict))
  } catch {
    return null
  }
}
