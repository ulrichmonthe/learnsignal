import type {
  MissionState,
  Mission,
  ScoreResult,
  TicketResult,
  EvalCriterion,
  AtlasPromptState,
  FewShotExample,
  ContextBlueprintRow,
} from './types'

// ---------------------------------------------------------------------------
// Token estimation
// ---------------------------------------------------------------------------

export function countTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ---------------------------------------------------------------------------
// Individual criterion checks
// ---------------------------------------------------------------------------

interface CriterionResult {
  pass: boolean
  note: string
}

export function checkCriterion(
  criterion: EvalCriterion,
  state: MissionState
): CriterionResult {
  const { prompt, fewShots, contextBlueprint } = state
  const allPromptText = Object.values(prompt).join(' ')

  switch (criterion) {
    case 'always-passes':
      return { pass: true, note: 'Orientation ticket — always passes.' }

    case 'has-rules-section':
      return prompt.rules.trim().length > 30
        ? { pass: true, note: 'Rules section present and substantive.' }
        : { pass: false, note: 'Rules section is missing or too short (< 30 chars).' }

    case 'has-uncertainty-section':
      return prompt.uncertainty.trim().length > 30
        ? { pass: true, note: 'Uncertainty section present and substantive.' }
        : { pass: false, note: 'Uncertainty section is missing or too short (< 30 chars).' }

    case 'no-hallucination-rule': {
      const pass = /never.*(invent|describe|fabricate)|only.*(from|using).*(context|provided)/i.test(
        prompt.rules
      )
      return pass
        ? { pass: true, note: 'Anti-hallucination rule detected in rules section.' }
        : { pass: false, note: 'No explicit anti-hallucination rule found in rules section.' }
    }

    case 'injection-defense': {
      const pass = /as data|never as instructions|data, never instructions/i.test(prompt.rules)
      return pass
        ? { pass: true, note: 'Prompt injection defense rule found.' }
        : { pass: false, note: 'No prompt injection defense found in rules (e.g. "treat as data, never as instructions").' }
    }

    case 'spotlighting': {
      const combined = prompt.rules + ' ' + prompt.uncertainty
      const pass = /<context>/i.test(combined)
      return pass
        ? { pass: true, note: 'Spotlighting tag <context> found in prompt.' }
        : { pass: false, note: 'No <context> spotlighting tag found in rules or uncertainty sections.' }
    }

    case 'sycophancy-defense': {
      const combined = prompt.uncertainty
      const pass = /context is.*(correct|always)|contradict|confirm from context/i.test(combined)
      return pass
        ? { pass: true, note: 'Sycophancy defense present in uncertainty section.' }
        : {
            pass: false,
            note: 'No sycophancy defense found (e.g. "if user contradicts context, context is correct").',
          }
    }

    case 'escalation-policy': {
      const combined = prompt.uncertainty + ' ' + prompt.rules
      const pass = /escalate|should_escalate/i.test(combined)
      return pass
        ? { pass: true, note: 'Escalation policy present.' }
        : { pass: false, note: 'No escalation policy found in rules or uncertainty sections.' }
    }

    case 'voice-specificity': {
      const voice = prompt.voice.trim()
      const pass = voice.length > 80 && !/^be helpful/i.test(voice)
      return pass
        ? { pass: true, note: 'Voice section is specific and substantive.' }
        : {
            pass: false,
            note:
              voice.length <= 80
                ? 'Voice section is too short (< 80 chars) — add specificity.'
                : 'Voice section starts with a generic phrase like "Be helpful". Make it specific.',
          }
    }

    case 'few-shot-balance': {
      const total = fewShots.length
      if (total === 0) {
        return { pass: false, note: 'No few-shot examples defined.' }
      }
      const escalationCount = fewShots.filter((f) => f.label === 'escalate').length
      const ratio = escalationCount / total
      const pass = ratio >= 0.2 && ratio <= 0.65
      return pass
        ? { pass: true, note: `Few-shot balance good: ${escalationCount}/${total} escalations (${Math.round(ratio * 100)}%).` }
        : {
            pass: false,
            note: `Few-shot escalation ratio is ${Math.round(ratio * 100)}% (${escalationCount}/${total}). Target: 20–65%.`,
          }
    }

    case 'schema-typed': {
      const pass =
        /"high"\s*\|\s*"low"|boolean/.test(prompt.output) &&
        prompt.output.includes('should_escalate')
      return pass
        ? { pass: true, note: 'Output schema has typed confidence field and should_escalate.' }
        : {
            pass: false,
            note: 'Output schema is missing typed confidence ("high" | "low") or should_escalate field.',
          }
    }

    case 'no-chain-of-thought': {
      const pass = !/step.by.step|think.*before.*answer|first.*second.*third/i.test(allPromptText)
      return pass
        ? { pass: true, note: 'No explicit chain-of-thought instruction detected.' }
        : {
            pass: false,
            note: 'Explicit step-by-step or think-before-answer instruction detected. Remove for reasoning models.',
          }
    }

    case 'docs-not-in-middle': {
      const bp = contextBlueprint
      const docsIdx = bp.findIndex((r) =>
        /help-center|docs/i.test(r.source)
      )
      // The question row is the row whose source mentions "question" —
      // NOT "user" (which would falsely match "User profile").
      const questionIdx = bp.findIndex((r) =>
        /question/i.test(r.source)
      )
      if (docsIdx === -1) {
        return { pass: false, note: 'No help-center/docs row found in blueprint.' }
      }
      const pass =
        (questionIdx === -1 || docsIdx < questionIdx) && docsIdx < bp.length - 2
      return pass
        ? { pass: true, note: 'Docs are positioned before the question and not at the end of the window.' }
        : {
            pass: false,
            note:
              docsIdx >= bp.length - 2
                ? 'Docs are too close to the end of the context window — move them earlier.'
                : 'Docs appear after the user question in the blueprint — this causes lost-in-middle degradation.',
          }
    }

    case 'history-compressed': {
      const row = contextBlueprint.find((r) =>
        /conversation|history/i.test(r.source)
      )
      if (!row) {
        return { pass: false, note: 'No conversation history row found in blueprint.' }
      }
      const pass = row.move === 'compress'
      return pass
        ? { pass: true, note: 'Conversation history is set to compress.' }
        : {
            pass: false,
            note: `Conversation history move is "${row.move}" — should be "compress" to avoid context rot.`,
          }
    }

    case 'user-profile-written': {
      const row = contextBlueprint.find((r) =>
        /profile|user profile/i.test(r.source)
      )
      if (!row) {
        return { pass: false, note: 'No user profile row found in blueprint.' }
      }
      const pass = row.move === 'write'
      return pass
        ? { pass: true, note: 'User profile is set to write (persisted, not re-derived).' }
        : {
            pass: false,
            note: `User profile move is "${row.move}" — should be "write" so the profile is persisted and not re-derived each call.`,
          }
    }

    case 'caching-enabled': {
      const row = contextBlueprint.find((r) =>
        /system prompt/i.test(r.source)
      )
      if (!row) {
        return { pass: false, note: 'No system prompt row found in blueprint.' }
      }
      const pass = row.move === 'stable'
      return pass
        ? { pass: true, note: 'System prompt is marked stable — enables prefix caching.' }
        : {
            pass: false,
            note: `System prompt move is "${row.move}" — should be "stable" to enable prompt caching.`,
          }
    }

    case 'no-date-in-stable': {
      const combined = prompt.role + ' ' + prompt.voice
      const pass = !/\{\{.*date.*\}\}|today.?s date|current date/i.test(combined)
      return pass
        ? { pass: true, note: 'No dynamic date injection in stable prompt sections.' }
        : {
            pass: false,
            note: 'Date or dynamic timestamp detected in role/voice — this breaks prompt caching. Move it to volatile context.',
          }
    }

    case 'retrieval-reranked': {
      const row = contextBlueprint.find((r) =>
        /help-center|docs/i.test(r.source)
      )
      if (!row) {
        return { pass: false, note: 'No help-center/docs row found in blueprint.' }
      }
      // "rerank" must be mentioned AND not negated ("no reranking",
      // "without reranking", "reranking disabled" all fail).
      const mentions = /rerank/i.test(row.notes)
      const negated =
        /\b(?:no|not|without|never|disabled?)\b[^.,;]{0,20}\brerank/i.test(row.notes) ||
        /\brerank\w*\s+(?:is\s+)?(?:not|disabled|off)\b/i.test(row.notes)
      const pass = mentions && !negated
      return pass
        ? { pass: true, note: 'Retrieval notes indicate reranking is applied.' }
        : {
            pass: false,
            note: mentions
              ? 'Docs blueprint notes say reranking is NOT applied. Enable reranking to improve chunk relevance.'
              : 'No reranking mentioned in docs blueprint notes. Add reranking to improve chunk relevance.',
          }
    }

    case 'retrieval-max-5-chunks': {
      const row = contextBlueprint.find((r) =>
        /help-center|docs/i.test(r.source)
      )
      if (!row) {
        return { pass: false, note: 'No help-center/docs row found in blueprint.' }
      }
      // Read the chunk count from budget OR notes ("3–5 chunks", "12 chunks
      // retrieved", "top 5 docs"). Token figures like "~1500t" are budgets,
      // not chunk counts, and are ignored. Ranges use their upper bound.
      const text = `${row.budget} ${row.notes}`
      const counts = [...text.matchAll(/(\d+)(?:\s*(?:[–—-]|to)\s*(\d+))?\s*(?:chunks?|docs?)\b/gi)]
        .map((m) => parseInt(m[2] ?? m[1], 10))
      const pass = counts.length > 0 && Math.max(...counts) <= 5
      return pass
        ? { pass: true, note: 'Retrieval budget is ≤ 5 chunks.' }
        : {
            pass: false,
            note:
              counts.length === 0
                ? `No chunk count found in the docs row (budget: "${row.budget}"). State a retrieval budget of 3–5 chunks.`
                : `Retrieval budget exceeds 5 chunks (budget: "${row.budget}", notes: "${row.notes}"). Reduce to 3–5 high-signal chunks.`,
          }
    }

    default: {
      const _exhaustive: never = criterion
      return { pass: false, note: `Unknown criterion: ${String(_exhaustive)}` }
    }
  }
}

// ---------------------------------------------------------------------------
// Ticket scoring
// ---------------------------------------------------------------------------

function scoreTicket(ticket: import('./types').TestTicket, state: MissionState): TicketResult {
  const criteriaResults = ticket.evalCriteria.map((criterion) => {
    const result = checkCriterion(criterion, state)
    return { criterion, ...result }
  })
  const pass = criteriaResults.every((r) => r.pass)
  return { ticketId: ticket.id, pass, criteriaResults }
}

// ---------------------------------------------------------------------------
// Sub-score calculations
// ---------------------------------------------------------------------------

function calcPromptQuality(
  prompt: AtlasPromptState,
  ticketResults: TicketResult[]
): number {
  // Section presence score (max 90)
  let sectionScore = 0
  if (prompt.role.trim().length > 20) sectionScore += 15
  if (prompt.voice.trim().length > 20) sectionScore += 10
  if (prompt.rules.trim().length > 20) sectionScore += 20
  if (prompt.tools.trim().length > 10) sectionScore += 10
  if (prompt.output.trim().length > 20) sectionScore += 20
  if (prompt.uncertainty.trim().length > 20) sectionScore += 15
  // max = 90

  // Ticket pass rate
  const total = ticketResults.length
  const passed = ticketResults.filter((r) => r.pass).length
  const passRate = total > 0 ? passed / total : 0

  const raw = (sectionScore / 90) * 50 + passRate * 50
  return Math.min(100, Math.round(raw))
}

function countRedundantPhrases(text: string): number {
  const phrases = ['never invent', 'do not invent', 'must not invent', 'always remember']
  let count = 0
  for (const phrase of phrases) {
    const matches = text.toLowerCase().split(phrase).length - 1
    if (matches > 1) count++
  }
  return count
}

function calcContextEfficiency(
  prompt: AtlasPromptState,
  fewShots: FewShotExample[]
): number {
  const BASELINE = 400
  const MAX_GOOD = 700

  const fewShotsText = JSON.stringify(fewShots)
  const fullText = Object.values(prompt).join(' ') + fewShotsText
  const tokenCount = countTokens(fullText)

  const tokenScore =
    tokenCount <= BASELINE
      ? 100
      : Math.max(30, 100 - ((tokenCount - BASELINE) / (MAX_GOOD - BASELINE)) * 70)

  // Redundancy penalty
  const allCapsMatches = fullText.match(/\b[A-Z]{3,}\b/g) ?? []
  const allCapsCount = allCapsMatches.length
  const redundantCount = countRedundantPhrases(fullText)
  const redundancyPenalty = Math.min(25, allCapsCount * 3 + redundantCount * 5)

  // Few-shot score
  const fewShotCount = fewShots.length
  const fewShotScore =
    fewShotCount === 0
      ? 55
      : fewShotCount <= 5
      ? 100
      : fewShotCount <= 8
      ? 82
      : fewShotCount <= 12
      ? 62
      : 40

  const raw = tokenScore * 0.55 + fewShotScore * 0.3 - redundancyPenalty * 0.15
  return Math.min(100, Math.max(0, Math.round(raw)))
}

function calcProductionSafety(state: MissionState): number {
  const { prompt } = state
  let score = 0

  // hasUncertainty
  if (prompt.uncertainty.trim().length > 30) score += 20

  // hasEscalation
  if (/escalate|should_escalate/i.test(prompt.uncertainty + ' ' + prompt.rules)) score += 15

  // hasInjection
  if (/as data|never as instructions|data, never instructions/i.test(prompt.rules)) score += 20

  // hasSpotlight
  if (/<context>/i.test(prompt.rules + ' ' + prompt.uncertainty)) score += 15

  // hasSycophancy
  if (/context is.*(correct|always)|contradict|confirm from context/i.test(prompt.uncertainty)) score += 15

  // schemaValid
  if (
    /"high"\s*\|\s*"low"|boolean/.test(prompt.output) &&
    prompt.output.includes('should_escalate')
  ) score += 15

  return Math.min(100, score)
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

// Completion rule. A mission is complete when the live composite meets the
// target — except when the mission's *starting* state already meets it (the
// orientation mission), in which case the learner must take the real action
// the brief asks for: saving at least one version.
export function isMissionComplete(
  score: ScoreResult,
  mission: Mission,
  versionsSaved: number
): boolean {
  if (score.composite < mission.targetScore) return false
  const baseline = scoreState(mission.startingState, mission)
  if (baseline.composite >= mission.targetScore) return versionsSaved > 0
  return true
}

export function scoreState(state: MissionState, mission: Mission): ScoreResult {
  const ticketResults: TicketResult[] = mission.tickets.map((ticket) =>
    scoreTicket(ticket, state)
  )

  const promptQuality = calcPromptQuality(state.prompt, ticketResults)
  const contextEfficiency = calcContextEfficiency(state.prompt, state.fewShots)
  const productionSafety = calcProductionSafety(state)

  const { w1, w2, w3 } = mission.weights
  const composite = Math.min(
    100,
    Math.round(promptQuality * w1 + contextEfficiency * w2 + productionSafety * w3)
  )

  return {
    composite,
    promptQuality,
    contextEfficiency,
    productionSafety,
    ticketResults,
  }
}
