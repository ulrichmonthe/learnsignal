// The keystone of the job-gap loop: maps the job classifier's 14-capability
// taxonomy (see the n8n "Classify With Haiku" rubric) onto the platform's own
// lessons and lab missions. Everything readiness-related derives from this file:
// a user's level in a capability = how many of its mapped items they completed.
//
// Coverage is honest, not padded — capabilities the platform teaches thinly
// (e.g. fine_tuning) map to fewer items, and demand levels cap at what the map
// can actually train (see demandLevel).

export type CapabilityItem =
  | { kind: 'lesson'; course: string; slug: string; title: string; minutes: number }
  | { kind: 'mission'; lab: 'raglab' | 'pcelab'; missionId: string; title: string; minutes: number }
  | { kind: 'evallab'; title: string; minutes: number }

export interface CapabilityDef {
  label: string
  items: CapabilityItem[]
}

const LAB_HREF: Record<string, string> = {
  raglab: '/playground/rag-lab',
  pcelab: '/playground/pce-lab',
}

export function itemHref(item: CapabilityItem): string {
  if (item.kind === 'lesson') return `/playground/learn/${item.course}/${item.slug}`
  if (item.kind === 'mission') return LAB_HREF[item.lab]
  return '/playground/eval-lab/concept'
}

export function itemKindLabel(item: CapabilityItem): string {
  if (item.kind === 'lesson') return 'Course'
  return 'Lab'
}

export const CAPABILITY_MAP: Record<string, CapabilityDef> = {
  eval_design: {
    label: 'eval design',
    items: [
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-4', title: 'Labeling outputs and writing your first rubric', minutes: 20 },
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-7', title: 'LLM-as-judge done right', minutes: 25 },
      { kind: 'evallab', title: 'Eval Lab — from vibe check to verdict', minutes: 25 },
    ],
  },
  ml_metrics: {
    label: 'ml metrics',
    items: [
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-6', title: 'From rubric to deterministic checks', minutes: 15 },
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-8', title: 'Pairwise vs absolute scoring', minutes: 10 },
      { kind: 'mission', lab: 'raglab', missionId: 'mission-5', title: 'Score the halves separately', minutes: 15 },
    ],
  },
  experimentation: {
    label: 'experimentation',
    items: [
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-3', title: 'Generating diverse test inputs', minutes: 15 },
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-9', title: 'Online monitoring and drift detection', minutes: 20 },
      { kind: 'mission', lab: 'pcelab', missionId: 'mission-1', title: 'It worked in the demo', minutes: 20 },
    ],
  },
  data_labelling: {
    label: 'data labelling',
    items: [
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-4', title: 'Labeling outputs and writing your first rubric', minutes: 20 },
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-5', title: 'Finding failure patterns', minutes: 15 },
      { kind: 'evallab', title: 'Eval Lab — label the ticket set', minutes: 25 },
    ],
  },
  rag_vs_finetune: {
    label: 'rag vs fine-tune',
    items: [
      { kind: 'lesson', course: 'rag', slug: 'lesson-2', title: "What RAG is, and what it isn't", minutes: 12 },
      { kind: 'mission', lab: 'raglab', missionId: 'mission-10', title: "RAG's ceiling", minutes: 15 },
      { kind: 'mission', lab: 'raglab', missionId: 'mission-6', title: 'Pick the embedding model', minutes: 15 },
    ],
  },
  hallucination_ux: {
    label: 'hallucination ux',
    items: [
      { kind: 'lesson', course: 'rag', slug: 'lesson-3', title: 'The three failure modes that kill RAG systems', minutes: 18 },
      { kind: 'mission', lab: 'pcelab', missionId: 'mission-3', title: 'It keeps making things up', minutes: 20 },
      { kind: 'lesson', course: 'prompt-context-engineering', slug: 'lesson-9', title: 'The failure modes that cost you trust', minutes: 22 },
    ],
  },
  cost_modelling: {
    label: 'cost modelling',
    items: [
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-6', title: 'Economics: cost per completed task', minutes: 18 },
      { kind: 'mission', lab: 'pcelab', missionId: 'mission-2', title: 'Why is this so expensive?', minutes: 20 },
      { kind: 'mission', lab: 'raglab', missionId: 'mission-13', title: 'Cost levers', minutes: 15 },
    ],
  },
  model_selection: {
    label: 'model selection',
    items: [
      { kind: 'mission', lab: 'raglab', missionId: 'mission-6', title: 'Pick the embedding model', minutes: 15 },
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-8', title: 'Pairwise vs absolute scoring', minutes: 10 },
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-2', title: 'Do you actually need multi-agent?', minutes: 15 },
    ],
  },
  latency_budgeting: {
    label: 'latency budgeting',
    items: [
      { kind: 'lesson', course: 'prompt-context-engineering', slug: 'lesson-8', title: 'Memory, history, and the bill', minutes: 20 },
      { kind: 'lesson', course: 'harness-engineering', slug: 'lesson-9', title: 'The economics of the harness', minutes: 16 },
      { kind: 'mission', lab: 'raglab', missionId: 'mission-13', title: 'Cost levers', minutes: 15 },
    ],
  },
  human_in_the_loop: {
    label: 'human in the loop',
    items: [
      { kind: 'lesson', course: 'harness-engineering', slug: 'lesson-4', title: 'Hooks and gates: the permission system for agents', minutes: 20 },
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-9', title: 'Autonomy and least agency', minutes: 15 },
      { kind: 'lesson', course: 'evals-foundations', slug: 'lesson-10', title: 'Tracing failures to root cause', minutes: 20 },
    ],
  },
  agent_behaviour: {
    label: 'agent behaviour',
    items: [
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-3', title: 'Fan-out and pipeline: the two you build first', minutes: 15 },
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-5', title: 'Reliability: how chains lie to you', minutes: 18 },
      { kind: 'lesson', course: 'harness-engineering', slug: 'lesson-6', title: 'Sub-agents as task isolation', minutes: 18 },
    ],
  },
  fine_tuning: {
    label: 'fine-tuning',
    items: [
      { kind: 'lesson', course: 'rag', slug: 'lesson-2', title: "What RAG is, and what it isn't", minutes: 12 },
      { kind: 'mission', lab: 'raglab', missionId: 'mission-10', title: "RAG's ceiling", minutes: 15 },
    ],
  },
  prompt_engineering: {
    label: 'prompt engineering',
    items: [
      { kind: 'lesson', course: 'prompt-context-engineering', slug: 'lesson-3', title: 'Anatomy of a system prompt that holds up', minutes: 18 },
      { kind: 'lesson', course: 'prompt-context-engineering', slug: 'lesson-4', title: "Show, don't tell: few-shot that generalizes", minutes: 16 },
      { kind: 'mission', lab: 'pcelab', missionId: 'mission-1', title: 'It worked in the demo', minutes: 20 },
    ],
  },
  ai_safety_policy: {
    label: 'ai safety policy',
    items: [
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-10', title: 'The security frame', minutes: 12 },
      { kind: 'lesson', course: 'harness-engineering', slug: 'lesson-4', title: 'Hooks and gates: the permission system for agents', minutes: 20 },
      { kind: 'lesson', course: 'agent-orchestration', slug: 'lesson-9', title: 'Autonomy and least agency', minutes: 15 },
    ],
  },
}

export function capLabel(cap: string): string {
  return CAPABILITY_MAP[cap]?.label ?? cap.replace(/_/g, ' ')
}

// Demand rule — a DESIGNED default, stated in the spec: JDs name capabilities,
// not levels. Baseline 2; +1 when the role is deep (ai_depth ≥ 4) or senior
// (staff and above). Capped at what the map can actually train.
const SENIOR = new Set(['staff', 'principal', 'lead', 'director'])

export function demandLevel(
  job: { aiDepth: number; seniority: string },
  cap: string,
): number {
  const def = CAPABILITY_MAP[cap]
  if (!def) return 0
  const base = 2 + (job.aiDepth >= 4 || SENIOR.has(job.seniority) ? 1 : 0)
  return Math.min(base, def.items.length)
}
