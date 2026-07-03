// ── Exercise schema for embedded course exercises ──────────────────────────
// Every exercise runs the "Commit Loop": STAKE → COMMIT → REVEAL → KEEP.
// The six pedagogical types (Prediction, Diagnosis, Lever, Showdown, Ranking,
// Callback) compile down to a small set of input kinds below. The `type` field
// is the pedagogical label shown to the learner; `kind` is how they commit.

export type ExercisePedagogy =
  | 'Prediction'
  | 'Diagnosis'
  | 'Lever'
  | 'Showdown'
  | 'Ranking'
  | 'Callback'

// Honest verdict bands — never binary correct/incorrect.
export type Verdict = 'on-it' | 'directional' | 'miss'

interface ExerciseBase {
  /** Pedagogical label shown in the eyebrow, e.g. "Prediction". */
  type: ExercisePedagogy
  /** Skill dimensions this exercise develops (display + traceability). */
  dimensions: string[]
  /** STAGE 1 — the scenario that drops the PM inside the decision. */
  stake: string
  /** The instruction telling them exactly what to commit to. */
  commitPrompt: string
  /** STAGE 3/4 — shared reveal payload. */
  reveal: Reveal
}

export interface Reveal {
  /** Run-it-forward: the consequence of what they committed to. */
  consequence: string
  /** The lesson's claim, landing now that they've felt the gap. */
  principle: string
  /** STAGE 4 — one compressed, portable reference point. */
  keep: string
}

// ── Input kind: CHOICE ──────────────────────────────────────────────────────
// Used by Diagnosis, Showdown, and discrete Lever exercises.
export interface ChoiceOption {
  id: string
  label: string
  /** Per-option honest verdict + the debrief for picking it. */
  verdict: Verdict
  feedback: string
}

export interface ChoiceExercise extends ExerciseBase {
  kind: 'choice'
  options: ChoiceOption[]
  /** Optional: require a one-sentence rationale before commit. */
  rationale?: { prompt: string; tell: string }
}

// ── Input kind: PREDICT-NUMBER ──────────────────────────────────────────────
// The flagship Prediction type when the answer is a number/magnitude.
export interface PredictNumberExercise extends ExerciseBase {
  kind: 'predict-number'
  min: number
  max: number
  step: number
  unit?: string
  /** The actual value the world produces. */
  actual: number
  /** Inclusive band counted as "directionally right". */
  band: [number, number]
  /** Plain-language description of what actually happened at `actual`. */
  result: string
}

// ── Input kind: PREDICT-CHOICE ──────────────────────────────────────────────
// Prediction type when the answer is "which outcome / which wins".
export interface PredictChoiceExercise extends ExerciseBase {
  kind: 'predict-choice'
  options: ChoiceOption[]
}

// ── Input kind: RANK ────────────────────────────────────────────────────────
// The Ranking type — order options under a constraint.
export interface RankItem {
  id: string
  label: string
}

export interface RankExercise extends ExerciseBase {
  kind: 'rank'
  items: RankItem[]
  /** The high-leverage ordering, top → bottom, as item ids. */
  correctOrder: string[]
  /** Why the correct ordering is correct (shown on reveal). */
  rationale: string
}

// ── Input kind: REFLECT ─────────────────────────────────────────────────────
// The Callback type, or any write-then-compare exercise.
export interface ReflectExercise extends ExerciseBase {
  kind: 'reflect'
  /** Bullets a strong answer would contain, shown on reveal. */
  modelAnswer: string[]
}

export type ExerciseSpec =
  | ChoiceExercise
  | PredictNumberExercise
  | PredictChoiceExercise
  | RankExercise
  | ReflectExercise

/** A course's exercises, keyed by lesson slug (e.g. "lesson-3"). */
export type CourseExercises = Record<string, ExerciseSpec>
