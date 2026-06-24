export type Kit = {
  id: string
  slug: string
  name: string
  description: string | null
  tool_mirrored: string | null
  status: 'live' | 'draft' | 'coming_soon'
  classifier_keywords: string[]
  created_at: string
  updated_at: string
}

export type KitContentBlock = {
  id: string
  kit_id: string
  block_type: string
  block_data: unknown
  updated_at: string
  updated_by: string | null
}

export type SharedBlock = {
  id: string
  slug: string
  name: string
  description: string | null
  default_data: unknown
  allows_kit_override: boolean
  updated_at: string
}

export type KitOverride = {
  id: string
  kit_id: string
  shared_block_id: string
  override_data: unknown
  updated_at: string
  shared_block?: SharedBlock
}

export type ContentVersion = {
  id: string
  entity_type: 'kit_block' | 'shared_block' | 'kit_override' | 'kit_manifest'
  entity_id: string
  snapshot: unknown
  created_at: string
}

export type Ticket = {
  slot: number
  ticket_text: string
  agent_category: string
  agent_sentiment: string
  agent_urgency: string | null
  agent_reasoning: string
  agent_escalate: boolean
  expected_label: 'PASS' | 'NEEDS_EDITS' | 'FAIL' | 'EITHER'
  pattern_tag: string
}

export type RevealPattern = {
  pattern_id: string
  display_name: string
  trigger_slots: number[]
  trigger_label: string
  min_catches_to_surface: number
  max_catches: number
  card_copy: string
  card_style: 'primary' | 'secondary'
}

export const BLOCK_LABELS: Record<string, { name: string; meta: string }> = {
  tickets: {
    name: 'Tickets dataset',
    meta: '20 ROWS · CUSTOMER TICKET + AGENT OUTPUT + EXPECTED LABEL',
  },
  reveal_patterns: {
    name: 'Reveal patterns',
    meta: '3 PATTERNS · TRIGGER SLOTS + CATCH THRESHOLDS + CARD COPY',
  },
  workspace_progress_steps: {
    name: 'Workspace progress steps',
    meta: '4 STEPS · LEFT SIDEBAR LABELS',
  },
}

export const AGENT_CATEGORIES = ['Technical', 'Billing', 'Feature Request', 'Other']
export const AGENT_SENTIMENTS = ['Positive', 'Neutral', 'Frustrated', 'Angry']
export const AGENT_URGENCIES = ['Low', 'Medium', 'High']
export const EXPECTED_LABELS = ['PASS', 'NEEDS_EDITS', 'FAIL', 'EITHER']
export const PATTERN_TAGS = [
  'control',
  'short-input-hallucination',
  'sarcasm-as-neutral',
  'multi-issue-drop',
  'distractor',
  'calibration',
  'subverted-pattern',
]
