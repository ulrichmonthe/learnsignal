export interface AtlasPromptState {
  role: string
  voice: string
  rules: string
  tools: string
  output: string
  uncertainty: string
}

export interface FewShotExample {
  id: string
  input: string
  expectedOutput: {
    answer: string
    sources: string[]
    confidence: 'high' | 'low'
    should_escalate: boolean
  }
  label: 'resolve' | 'escalate' | 'low-confidence'
}

export interface ContextBlueprintRow {
  id: string
  source: string
  move: 'stable' | 'write' | 'select' | 'compress' | 'volatile' | 'isolate'
  budget: string
  notes: string
}

export interface TestTicket {
  id: string
  customerName: string
  message: string
  context: string
  groundTruth: {
    should_escalate: boolean
    confidence: 'high' | 'low'
  }
  evalCriteria: EvalCriterion[]
}

export type EvalCriterion =
  | 'has-rules-section'
  | 'has-uncertainty-section'
  | 'no-hallucination-rule'
  | 'injection-defense'
  | 'spotlighting'
  | 'sycophancy-defense'
  | 'escalation-policy'
  | 'voice-specificity'
  | 'few-shot-balance'
  | 'schema-typed'
  | 'no-chain-of-thought'
  | 'docs-not-in-middle'
  | 'history-compressed'
  | 'user-profile-written'
  | 'caching-enabled'
  | 'no-date-in-stable'
  | 'retrieval-reranked'
  | 'retrieval-max-5-chunks'
  | 'always-passes'

export interface MissionState {
  prompt: AtlasPromptState
  fewShots: FewShotExample[]
  contextBlueprint: ContextBlueprintRow[]
}

export interface TicketResult {
  ticketId: string
  pass: boolean
  criteriaResults: {
    criterion: EvalCriterion
    pass: boolean
    note: string
  }[]
}

export interface ScoreResult {
  composite: number
  promptQuality: number
  contextEfficiency: number
  productionSafety: number
  ticketResults: TicketResult[]
}

export interface SavedVersion {
  id: string
  name: string
  timestamp: string
  state: MissionState
  score: ScoreResult
}

export type MissionTier = 'the-shift' | 'the-prompt' | 'the-context' | 'production'
export type CharacterName = 'jordan' | 'dev' | 'sara'

export interface Mission {
  id: string
  number: number
  title: string
  tier: MissionTier
  tierLabel: string
  lessonRef: number
  targetScore: number
  weights: { w1: number; w2: number; w3: number }
  character: CharacterName
  brief: string
  devNote?: string
  startingState: MissionState
  tickets: TestTicket[]
  completionSynthesis: string
  teachingConcept: string
}
