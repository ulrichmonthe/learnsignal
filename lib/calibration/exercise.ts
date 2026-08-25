import { choiceSetHash } from './core'
import { KNOWN_COURSES, LESSON_RE, parseLessonPath } from './lesson-path'

// Validation core for Commit-Loop exercise capture. Unit-tested; the API route
// is a thin shell over it.
//
// NOTE: this module reaches node:crypto via choiceSetHash, so it must never be
// imported by a client component — import ./lesson-path there instead.

export { KNOWN_COURSES, parseLessonPath }

export const VERDICTS = ['on-it', 'directional', 'miss'] as const
export type Verdict = (typeof VERDICTS)[number]

const RATIONALE_MAX = 4000

export interface ExerciseInput {
  course?: unknown
  lesson?: unknown
  choiceId?: unknown
  optionIds?: unknown
  optionLabels?: unknown
  expertVerdict?: unknown
  confidencePct?: unknown
  rationale?: unknown
  timeToDecideMs?: unknown
}

export interface ValidExercise {
  course: string
  lesson: string
  choiceId: string
  optionIds: string[]
  optionLabels: string[]
  expertVerdict: Verdict
  confidencePct: number | null
  rationale: string | null
  timeToDecideMs: number | null
  choiceSetHash: string
}

export type ExerciseResult =
  | { ok: true; value: ValidExercise }
  | { ok: false; error: string }

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/**
 * Confidence is OPTIONAL here (unlike the scenario surface). But an absent value
 * must stay null — coercing it to a number would record an opinion the learner
 * never expressed and corrupt calibration.
 */
function optionalPct(v: unknown): number | null {
  if (v === null || v === undefined) return null
  let n: number
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && v.trim() !== '') n = Number(v)
  else return null
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 100) return null
  return n
}

export function validateExercise(input: ExerciseInput): ExerciseResult {
  const course = str(input.course)
  if (!KNOWN_COURSES.has(course)) return { ok: false, error: 'unknown course' }

  const lesson = str(input.lesson)
  if (!LESSON_RE.test(lesson)) return { ok: false, error: 'malformed lesson slug' }

  const choiceId = str(input.choiceId)
  if (!choiceId) return { ok: false, error: 'choiceId is required' }

  const optionIds = strArray(input.optionIds)
  const optionLabels = strArray(input.optionLabels)
  if (optionIds.length === 0) return { ok: false, error: 'optionIds is required' }
  if (!optionIds.includes(choiceId)) {
    return { ok: false, error: 'choiceId must be one of optionIds' }
  }
  if (optionLabels.length !== optionIds.length) {
    return { ok: false, error: 'optionLabels must have one entry per optionId' }
  }
  if (new Set(optionIds).size !== optionIds.length) {
    return { ok: false, error: 'optionIds must be unique' }
  }

  const verdict = str(input.expertVerdict)
  if (!VERDICTS.includes(verdict as Verdict)) {
    return { ok: false, error: 'expertVerdict must be on-it, directional or miss' }
  }

  const rationaleRaw = str(input.rationale)

  return {
    ok: true,
    value: {
      course,
      lesson,
      choiceId,
      optionIds,
      optionLabels,
      expertVerdict: verdict as Verdict,
      confidencePct: optionalPct(input.confidencePct),
      rationale: rationaleRaw ? rationaleRaw.slice(0, RATIONALE_MAX) : null,
      timeToDecideMs: toMs(input.timeToDecideMs),
      choiceSetHash: choiceSetHash(optionIds, optionLabels),
    },
  }
}

function toMs(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 86_400_000) return null
  return Math.round(v)
}

/**
 * Share of decisions where the learner picked the option the practitioner would.
 * Suppressed below `minN` — a percentage over three decisions is noise wearing a
 * decimal point.
 */
export function calibration(
  verdicts: Array<string | null>,
  minN = 5,
): { pct: number; n: number } | null {
  const scored = verdicts.filter((v): v is Verdict => VERDICTS.includes(v as Verdict))
  if (scored.length < minN) return null
  const onIt = scored.filter((v) => v === 'on-it').length
  return { pct: Math.round((onIt / scored.length) * 100), n: scored.length }
}
