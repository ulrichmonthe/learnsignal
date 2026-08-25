import { describe, expect, it } from 'vitest'
import {
  calibration,
  parseLessonPath,
  validateExercise,
} from '@/lib/calibration/exercise'

function validBody(over: Record<string, unknown> = {}) {
  return {
    course: 'rag',
    lesson: 'lesson-4',
    choiceId: 'b',
    optionIds: ['a', 'b', 'c'],
    optionLabels: ['Ship it', 'Hold the demo', 'Escalate'],
    expertVerdict: 'on-it',
    ...over,
  }
}

// ── AC-10 · route parsing ────────────────────────────────────────────────────
describe('parseLessonPath (AC-10)', () => {
  it('extracts course and lesson from a lesson route', () => {
    expect(parseLessonPath('/playground/learn/rag/lesson-4')).toEqual({
      course: 'rag',
      lesson: 'lesson-4',
    })
  })

  it('tolerates query strings and hashes', () => {
    expect(parseLessonPath('/playground/learn/evals-foundations/lesson-10?x=1#y')).toEqual({
      course: 'evals-foundations',
      lesson: 'lesson-10',
    })
  })

  it.each([
    ['a course index', '/playground/learn/rag'],
    ['the learn index', '/playground/learn'],
    ['an unrelated route', '/dashboard'],
    ['an unknown course', '/playground/learn/astrology/lesson-1'],
    ['a malformed lesson slug', '/playground/learn/rag/intro'],
    ['a lesson slug with letters', '/playground/learn/rag/lesson-abc'],
    ['empty', ''],
    ['a bare learn segment outside playground', '/anything/learn/rag/lesson-1'],
    ['learn at the root', '/learn/rag/lesson-1'],
  ])('returns null for %s', (_label, path) => {
    expect(parseLessonPath(path)).toBeNull()
  })
})

// ── AC-14 · validation ───────────────────────────────────────────────────────
describe('validateExercise (AC-14)', () => {
  it('accepts a well-formed commit', () => {
    expect(validateExercise(validBody()).ok).toBe(true)
  })

  it.each(['on-it', 'directional', 'miss'])('accepts verdict %s', (expertVerdict) => {
    expect(validateExercise(validBody({ expertVerdict })).ok).toBe(true)
  })

  it.each(['correct', 'wrong', '', null, undefined, 'ON-IT'])(
    'rejects verdict %p',
    (expertVerdict) => {
      expect(validateExercise(validBody({ expertVerdict })).ok).toBe(false)
    },
  )

  it('rejects an unknown course — a junk row is worse than no row', () => {
    expect(validateExercise(validBody({ course: 'astrology' })).ok).toBe(false)
  })

  it.each(['intro', 'lesson-', 'lesson-abc', '../etc', ''])(
    'rejects malformed lesson slug %p',
    (lesson) => {
      expect(validateExercise(validBody({ lesson })).ok).toBe(false)
    },
  )

  it('rejects a choice outside the option set', () => {
    expect(validateExercise(validBody({ choiceId: 'zzz' })).ok).toBe(false)
  })

  it('rejects labels that do not line up with ids', () => {
    expect(validateExercise(validBody({ optionLabels: ['only one'] })).ok).toBe(false)
  })

  it('rejects duplicate option ids', () => {
    expect(
      validateExercise(
        validBody({ optionIds: ['a', 'a'], optionLabels: ['x', 'y'], choiceId: 'a' }),
      ).ok,
    ).toBe(false)
  })

  // AC-2: confidence is optional here, but must never be invented.
  it('accepts a commit with no confidence and records null', () => {
    const r = validateExercise(validBody())
    expect(r.ok && r.value.confidencePct).toBeNull()
  })

  it.each([null, undefined, '', 'high', -1, 101, 50.5])(
    'records confidence %p as null rather than a number',
    (confidencePct) => {
      const r = validateExercise(validBody({ confidencePct }))
      expect(r.ok && r.value.confidencePct).toBeNull()
    },
  )

  it.each([0, 25, 60, 90, 100])('keeps a valid confidence %i', (confidencePct) => {
    const r = validateExercise(validBody({ confidencePct }))
    expect(r.ok && r.value.confidencePct).toBe(confidencePct)
  })

  // AC-3: rationale is the author's choice, not forced.
  it('records a null rationale when the exercise has none', () => {
    const r = validateExercise(validBody())
    expect(r.ok && r.value.rationale).toBeNull()
  })

  it('captures a rationale when supplied', () => {
    const r = validateExercise(validBody({ rationale: '  because latency  ' }))
    expect(r.ok && r.value.rationale).toBe('because latency')
  })

  it('produces a fingerprint that changes when a label is reworded (AC-8 sibling)', () => {
    const a = validateExercise(validBody())
    const b = validateExercise(validBody({ optionLabels: ['Ship it NOW', 'Hold the demo', 'Escalate'] }))
    expect(a.ok && b.ok && a.value.choiceSetHash).not.toBe(b.ok ? b.value.choiceSetHash : '')
  })

  it.each([-5, 'soon', NaN, Infinity])('records bad timeToDecideMs %p as null', (timeToDecideMs) => {
    const r = validateExercise(validBody({ timeToDecideMs }))
    expect(r.ok && r.value.timeToDecideMs).toBeNull()
  })
})

// ── AC-11 / AC-12 · calibration ──────────────────────────────────────────────
describe('calibration (AC-11, AC-12)', () => {
  it('suppresses a percentage below the minimum n', () => {
    expect(calibration(['on-it', 'miss', 'on-it'])).toBeNull()
  })

  it('reports pct and n once the floor is met', () => {
    expect(calibration(['on-it', 'on-it', 'miss', 'directional', 'on-it'])).toEqual({
      pct: 60,
      n: 5,
    })
  })

  it('counts only on-it as a match — directional is not a match', () => {
    expect(calibration(['directional', 'directional', 'directional', 'directional', 'directional'])).toEqual({
      pct: 0,
      n: 5,
    })
  })

  it('ignores nulls and unknown verdicts when computing n', () => {
    const r = calibration(['on-it', null, 'bogus', 'on-it', 'miss', 'on-it', 'miss'])
    expect(r).toEqual({ pct: 60, n: 5 })
  })

  it('returns null for an empty record (AC-13)', () => {
    expect(calibration([])).toBeNull()
  })

  it('never reports above 100 or below 0', () => {
    const all = calibration(Array(10).fill('on-it'))
    expect(all).toEqual({ pct: 100, n: 10 })
  })
})
