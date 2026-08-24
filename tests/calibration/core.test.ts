import { describe, expect, it } from 'vitest'
import {
  RATIONALE_MIN_CHARS,
  choiceSetHash,
  learnerKey,
  validateDecision,
} from '@/lib/calibration/core'
import { normalizeCapabilities } from '@/lib/capabilities/taxonomy'

const LONG = 'x'.repeat(RATIONALE_MIN_CHARS)

function validBody(over: Record<string, unknown> = {}) {
  return {
    scenarioId: 'scn-1',
    nodeId: 'act-2',
    choiceId: 'b',
    optionIds: ['a', 'b', 'c'],
    optionTexts: ['Ship it', 'Hold the demo', 'Escalate'],
    rationale: LONG,
    confidencePct: 70,
    predMajorityId: 'a',
    ...over,
  }
}

// ── AC-6 · pseudonymisation ──────────────────────────────────────────────────
describe('learnerKey (AC-6)', () => {
  it('is deterministic for the same user and pepper', () => {
    expect(learnerKey('user_123', 'pepper')).toBe(learnerKey('user_123', 'pepper'))
  })

  it('never contains the raw user id', () => {
    const key = learnerKey('user_123', 'pepper')
    expect(key).not.toContain('user_123')
    expect(key).toMatch(/^[0-9a-f]{64}$/)
  })

  it('differs across users and across peppers', () => {
    expect(learnerKey('user_a', 'p')).not.toBe(learnerKey('user_b', 'p'))
    expect(learnerKey('user_a', 'p1')).not.toBe(learnerKey('user_a', 'p2'))
  })
})

// ── AC-7 · option-set fingerprinting ─────────────────────────────────────────
describe('choiceSetHash (AC-7)', () => {
  const ids = ['a', 'b', 'c']
  const texts = ['Ship it', 'Hold the demo', 'Escalate']

  it('is stable for an identical option set', () => {
    expect(choiceSetHash(ids, texts)).toBe(choiceSetHash(ids, texts))
  })

  it('is order-independent (options may render shuffled)', () => {
    const shuffled = choiceSetHash(['c', 'a', 'b'], ['Escalate', 'Ship it', 'Hold the demo'])
    expect(shuffled).toBe(choiceSetHash(ids, texts))
  })

  it('CHANGES when an option is reworded — distributions must not pool', () => {
    const reworded = choiceSetHash(ids, ['Ship it now', 'Hold the demo', 'Escalate'])
    expect(reworded).not.toBe(choiceSetHash(ids, texts))
  })

  it('changes when an option is added or removed', () => {
    expect(choiceSetHash(['a', 'b'], ['Ship it', 'Hold the demo'])).not.toBe(
      choiceSetHash(ids, texts),
    )
  })

  it('ignores surrounding whitespace drift', () => {
    expect(choiceSetHash(ids, ['  Ship it ', 'Hold the demo', 'Escalate'])).toBe(
      choiceSetHash(ids, texts),
    )
  })
})

// ── AC-12 · request validation ───────────────────────────────────────────────
describe('validateDecision (AC-12)', () => {
  it('accepts a well-formed decision', () => {
    const r = validateDecision(validBody())
    expect(r.ok).toBe(true)
  })

  it.each([
    ['scenarioId', { scenarioId: '' }],
    ['nodeId', { nodeId: '   ' }],
    ['choiceId', { choiceId: '' }],
  ])('rejects a missing %s', (_label, over) => {
    expect(validateDecision(validBody(over)).ok).toBe(false)
  })

  it('rejects a choice that is not among the options', () => {
    const r = validateDecision(validBody({ choiceId: 'zzz' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/one of optionIds/)
  })

  it('rejects a prediction that is not among the options', () => {
    expect(validateDecision(validBody({ predMajorityId: 'nope' })).ok).toBe(false)
  })

  it(`rejects rationale under ${RATIONALE_MIN_CHARS} chars (AC-2)`, () => {
    const r = validateDecision(validBody({ rationale: 'too short' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/at least 120/)
  })

  it('counts rationale length after trimming (no whitespace padding)', () => {
    expect(validateDecision(validBody({ rationale: `   ${'y'.repeat(60)}   ` })).ok).toBe(false)
  })

  it.each([-1, 101, 55.5, 'high', null, undefined])(
    'rejects confidence %p',
    (confidencePct) => {
      expect(validateDecision(validBody({ confidencePct })).ok).toBe(false)
    },
  )

  it.each([0, 50, 100])('accepts boundary confidence %i', (confidencePct) => {
    expect(validateDecision(validBody({ confidencePct })).ok).toBe(true)
  })

  it('defaults an unknown pressure profile to untimed rather than trusting input', () => {
    const r = validateDecision(validBody({ pressureProfile: 'made-up' }))
    expect(r.ok && r.value.pressureProfile).toBe('untimed')
  })

  it('preserves a known pressure profile', () => {
    const r = validateDecision(validBody({ pressureProfile: 'timed-8min' }))
    expect(r.ok && r.value.pressureProfile).toBe('timed-8min')
  })

  it('drops a non-uuid attemptId instead of storing garbage', () => {
    const r = validateDecision(validBody({ attemptId: 'not-a-uuid' }))
    expect(r.ok && r.value.attemptId).toBeNull()
  })

  it('caps an oversized rationale rather than rejecting a real answer', () => {
    const r = validateDecision(validBody({ rationale: 'z'.repeat(99_000) }))
    expect(r.ok && r.value.rationale.length).toBeLessThanOrEqual(4000)
  })

  it('defaults scenarioVersion to "1" so rows are always version-locked (AC-9)', () => {
    const r = validateDecision(validBody())
    expect(r.ok && r.value.scenarioVersion).toBe('1')
  })

  // Regression: scenarios.version is an INTEGER column. A string-only coercion
  // silently turned version 3 into '1', defeating the version lock entirely.
  it('accepts a numeric scenarioVersion (the column is an integer)', () => {
    const r = validateDecision(validBody({ scenarioVersion: 3 }))
    expect(r.ok && r.value.scenarioVersion).toBe('3')
  })

  it('still accepts a string scenarioVersion', () => {
    const r = validateDecision(validBody({ scenarioVersion: '2.1.0' }))
    expect(r.ok && r.value.scenarioVersion).toBe('2.1.0')
  })

  // Regression: without matching texts the fingerprint degrades to ids alone,
  // so a reworded option would keep its hash and pool two different questions.
  it('rejects optionTexts that do not line up with optionIds', () => {
    const r = validateDecision(validBody({ optionTexts: ['only one'] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/one entry per optionId/)
  })

  it('rejects missing optionTexts entirely', () => {
    expect(validateDecision(validBody({ optionTexts: undefined })).ok).toBe(false)
  })

  it('rejects duplicate optionIds', () => {
    const r = validateDecision(
      validBody({ optionIds: ['a', 'a', 'c'], optionTexts: ['x', 'y', 'z'], choiceId: 'a' }),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/unique/)
  })
})

// ── US-02 AC-2 · closed taxonomy ─────────────────────────────────────────────
describe('normalizeCapabilities (US-02 AC-2)', () => {
  it('keeps known capability keys', () => {
    expect(normalizeCapabilities(['eval_design', 'cost_modelling'])).toEqual([
      'eval_design',
      'cost_modelling',
    ])
  })

  it('drops unknown keys — the taxonomy is closed', () => {
    expect(normalizeCapabilities(['eval_design', 'vibes', 'synergy'])).toEqual(['eval_design'])
  })

  it('parses a JSON string (jsonb may arrive either way)', () => {
    expect(normalizeCapabilities('["ml_metrics"]')).toEqual(['ml_metrics'])
  })

  it('de-duplicates', () => {
    expect(normalizeCapabilities(['eval_design', 'eval_design'])).toEqual(['eval_design'])
  })

  it.each([null, undefined, 42, {}, 'not json', ['', 7]])(
    'returns [] for malformed input %p',
    (input) => {
      expect(normalizeCapabilities(input)).toEqual([])
    },
  )
})
