// Eval Lab — reveal crediting. SINGLE SOURCE OF TRUTH for which slots belong
// to which failure pattern and how labels earn credit. The `expected_label` /
// `pattern_tag` columns in `eval_tickets` are informational (admin display
// only) — nothing in the learner flow reads them, so edit crediting HERE and
// in docs/answer-key/pce-eval-labs.md together.
//
// Crediting rules:
// - Genuine failure tickets: FAIL = full catch. NEEDS_EDITS = "flagged" — a
//   defensible middle read, worth half credit (never a silent miss).
// - Multi-issue / mis-categorisation tickets (6, 8, 14): FAIL and NEEDS_EDITS
//   are both fully correct reads, so both count as a catch.
// - Ticket 19 is the trap — the agent got it right; PASS earns the sarcasm
//   bonus, FAIL triggers the callout.
// - Calibration tickets (10, 15, 20) are seeded EITHER: genuinely ambiguous,
//   any label accepted, never counted for or against.

export type TicketLabel = 'PASS' | 'NEEDS_EDITS' | 'FAIL'

export const PATTERN_SLOTS = {
  shortInputHallucination: [3, 7, 11, 17],
  sarcasmAsNeutral: [5, 9, 13, 16],
  // 6 = keyword-latch mis-categorisation ("Pro plan" → Billing): same failure
  // shape — the agent reads one part of the ticket and drops the rest.
  multiIssueDrop: [6, 8, 14],
  subvertedPattern: 19, // trap ticket — correct label is PASS
  calibration: [10, 15, 20], // EITHER — excluded from all counts
} as const

// Max earnable credit: 4 short + (4 sarcasm + 1 trap bonus) + 3 multi = 12.
const MAX_CREDIT = 12

export type PatternResult = {
  id: string
  name: string
  caughtCount: number // full catches (incl. trap bonus on the sarcasm card)
  flaggedCount: number // NEEDS_EDITS on FAIL tickets — half credit
  totalCount: number
  description: string
  tier: 'confirmed' | 'spotted'
}

export type RevealData = {
  ticketsLabelled: number
  sessionMinutes: number
  patterns: PatternResult[]
  subvertedPatternMissed: boolean // learner labelled ticket 19 as FAIL
  allCaught: boolean
  zeroCaught: boolean
  score: number // 0–100 share of MAX_CREDIT — persisted with lab progress
}

export function computeReveal(
  labels: { slot_number: number; label: string }[],
  startedAt: string,
  completedAt: string | null,
): RevealData {
  const labelMap = new Map<number, string>(labels.map(l => [l.slot_number, l.label]))
  const ticketsLabelled = labels.length

  const started = new Date(startedAt)
  const ended = completedAt ? new Date(completedAt) : new Date()
  const sessionMinutes = Math.max(1, Math.round((ended.getTime() - started.getTime()) / 60000))

  const countLabel = (slots: readonly number[], label: TicketLabel) =>
    slots.filter(s => labelMap.get(s) === label).length

  // Pattern 1 — short-input hallucinations: FAIL = catch, NEEDS_EDITS = flag.
  const shortSlots = PATTERN_SLOTS.shortInputHallucination
  const shortCaught = countLabel(shortSlots, 'FAIL')
  const shortFlagged = countLabel(shortSlots, 'NEEDS_EDITS')
  const shortCredit = shortCaught + shortFlagged * 0.5

  // Pattern 2 — sarcasm as neutral: same rule, plus the ticket-19 bonus.
  const sarcasmSlots = PATTERN_SLOTS.sarcasmAsNeutral
  const sarcasmCaughtRaw = countLabel(sarcasmSlots, 'FAIL')
  const sarcasmFlagged = countLabel(sarcasmSlots, 'NEEDS_EDITS')
  const trapDodged = labelMap.get(PATTERN_SLOTS.subvertedPattern) === 'PASS'
  const sarcasmCaught = sarcasmCaughtRaw + (trapDodged ? 1 : 0)
  const sarcasmCredit = sarcasmCaughtRaw + sarcasmFlagged * 0.5 + (trapDodged ? 1 : 0)

  // Pattern 3 — the agent latched onto one part of the ticket and dropped the
  // rest. FAIL and NEEDS_EDITS are both correct reads here.
  const multiSlots = PATTERN_SLOTS.multiIssueDrop
  const multiCaught = multiSlots.filter(
    s => labelMap.get(s) === 'FAIL' || labelMap.get(s) === 'NEEDS_EDITS'
  ).length
  const multiCredit = multiCaught

  const subvertedPatternMissed = labelMap.get(PATTERN_SLOTS.subvertedPattern) === 'FAIL'

  const shortSpotted = shortCaught + shortFlagged
  const shortDescription =
    shortSpotted === 0
      ? "Every ticket under 12 characters had invented details — error codes, account types, urgency levels that weren't in the input. These are worth looking at."
      : shortSpotted >= 3
        ? `You flagged ${shortSpotted} of them. The agent invented details — error codes, account types, urgency levels — that weren't in the input.`
        : `You flagged ${shortSpotted} of them. The ones you missed were short inputs where the agent filled in plausible-sounding details that weren't in the ticket at all.`

  const sarcasmSpotted = sarcasmCaughtRaw + sarcasmFlagged
  const sarcasmDescription =
    sarcasmSpotted === 0 && !trapDodged
      ? 'The agent labelled angry, sarcastic tickets as neutral sentiment across all four cases. This is worth re-reading — every one of those tickets contained clear frustration signals.'
      : sarcasmSpotted >= 4
        ? 'The agent labelled angry, sarcastic tickets as neutral. You flagged every one. The hardest cases used polite phrasing wrapped around clearly angry intent.'
        : 'The agent labelled angry, sarcastic tickets as neutral. The ones you missed used polite words — all the surface markers of calm — while the intent was frustration.'

  const multiDescription =
    multiCaught === 0
      ? 'Three tickets shared one failure shape: the agent latched onto part of the ticket and dropped the rest — two second issues silently vanished, and a "Pro plan" mention turned a technical bug into a billing ticket. Worth re-reading.'
      : multiCaught < 3
        ? `You flagged ${multiCaught} of the three tickets where the agent latched onto part of the ticket and dropped the rest — two dropped second issues, one mis-categorisation from a "Pro plan" mention. This pattern often correlates with churn risk.`
        : 'You flagged all three tickets where the agent latched onto part of the ticket and dropped the rest — two dropped second issues and one "Pro plan" mis-categorisation. This pattern often correlates with churn risk.'

  const patterns: PatternResult[] = [
    {
      id: 'short-input-hallucination',
      name: 'Short-input hallucinations',
      caughtCount: shortCaught,
      flaggedCount: shortFlagged,
      totalCount: shortSlots.length,
      description: shortDescription,
      tier: shortCredit >= 2 ? 'confirmed' : 'spotted',
    },
    {
      id: 'sarcasm-as-neutral',
      name: 'Sarcasm read as neutral',
      caughtCount: sarcasmCaught,
      flaggedCount: sarcasmFlagged,
      totalCount: sarcasmSlots.length + 1, // 4 genuine + trap bonus
      description: sarcasmDescription,
      tier: sarcasmCredit >= 2 ? 'confirmed' : 'spotted',
    },
    {
      id: 'multi-issue-drop',
      name: 'Multi-issue label drops',
      caughtCount: multiCaught,
      flaggedCount: 0,
      totalCount: multiSlots.length,
      description: multiDescription,
      tier: multiCredit >= 2 ? 'confirmed' : 'spotted',
    },
  ]

  const totalCredit = shortCredit + sarcasmCredit + multiCredit

  return {
    ticketsLabelled,
    sessionMinutes,
    patterns,
    subvertedPatternMissed,
    allCaught: shortCredit === 4 && sarcasmCredit === 5 && multiCredit === 3,
    zeroCaught: totalCredit === 0,
    score: Math.round((totalCredit / MAX_CREDIT) * 100),
  }
}
