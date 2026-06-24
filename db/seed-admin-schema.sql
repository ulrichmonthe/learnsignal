-- ============================================================
-- ADMIN CONTENT EDITOR SCHEMA
-- Run after schema.sql and seed-eval-lab.sql
-- ============================================================

-- kits: top-level playground kit registry
create table if not exists kits (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  tool_mirrored text,
  status text check (status in ('live', 'draft', 'coming_soon')) default 'draft',
  classifier_keywords text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- kit_content_blocks: jsonb blobs of kit-specific content
create table if not exists kit_content_blocks (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid references kits(id) on delete cascade not null,
  block_type text not null,
  block_data jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default now(),
  updated_by text,
  unique (kit_id, block_type)
);

-- shared_blocks: cross-kit canonical content with optional override support
create table if not exists shared_blocks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  default_data jsonb not null default '{}'::jsonb,
  allows_kit_override boolean default false,
  updated_at timestamp with time zone default now()
);

-- kit_overrides: per-kit overrides of shared block defaults
create table if not exists kit_overrides (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid references kits(id) on delete cascade not null,
  shared_block_id uuid references shared_blocks(id) on delete cascade not null,
  override_data jsonb not null,
  updated_at timestamp with time zone default now(),
  unique (kit_id, shared_block_id)
);

-- content_versions: version history for all editable entities
create table if not exists content_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text check (entity_type in ('kit_block', 'shared_block', 'kit_override', 'kit_manifest')) not null,
  entity_id uuid not null,
  snapshot jsonb not null,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_kit_content_blocks_kit on kit_content_blocks(kit_id);
create index if not exists idx_kit_overrides_kit on kit_overrides(kit_id);
create index if not exists idx_content_versions_entity on content_versions(entity_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- Admin writes bypass RLS via service role key.
-- Public read on kits and shared content (needed for classifier + eval lab).
-- ============================================================

alter table kits enable row level security;
drop policy if exists "kits readable by all" on kits;
create policy "kits readable by all" on kits for select using (true);

alter table kit_content_blocks enable row level security;
drop policy if exists "kit_content_blocks readable by all" on kit_content_blocks;
create policy "kit_content_blocks readable by all" on kit_content_blocks for select using (true);

alter table shared_blocks enable row level security;
drop policy if exists "shared_blocks readable by all" on shared_blocks;
create policy "shared_blocks readable by all" on shared_blocks for select using (true);

alter table kit_overrides enable row level security;
drop policy if exists "kit_overrides readable by all" on kit_overrides;
create policy "kit_overrides readable by all" on kit_overrides for select using (true);

alter table content_versions enable row level security;
-- content_versions: no public read (internal only via service role)

-- ============================================================
-- SEED — EVALS KIT
-- ============================================================

do $$
declare
  v_kit_id       uuid;
  v_tickets_json jsonb;
begin

  -- ── Evals kit ──────────────────────────────────────────────
  insert into kits (slug, name, description, tool_mirrored, status, classifier_keywords)
  values (
    'eval-lab',
    'Evals',
    'Hands-on AI evaluation for product managers. Mirrors Braintrust.',
    'Braintrust',
    'live',
    array['eval','evals','hallucination','score','judge','labeling','label','rubric','recall','precision','accuracy','benchmark','quality']
  )
  on conflict (slug) do nothing;

  select id into v_kit_id from kits where slug = 'eval-lab';

  -- ── Tickets block — copied from eval_tickets ───────────────
  select jsonb_agg(
    jsonb_build_object(
      'slot',            slot_number,
      'ticket_text',     ticket_text,
      'agent_category',  agent_category,
      'agent_sentiment', agent_sentiment,
      'agent_urgency',   agent_urgency,
      'agent_reasoning', agent_reasoning,
      'agent_escalate',  agent_escalate,
      'expected_label',  expected_label,
      'pattern_tag',     pattern_tag
    ) order by slot_number
  )
  into v_tickets_json
  from eval_tickets;

  insert into kit_content_blocks (kit_id, block_type, block_data, updated_by)
  values (v_kit_id, 'tickets', coalesce(v_tickets_json, '[]'::jsonb), 'seed')
  on conflict (kit_id, block_type) do nothing;

  -- ── Reveal patterns block ───────────────────────────────────
  insert into kit_content_blocks (kit_id, block_type, block_data, updated_by)
  values (
    v_kit_id,
    'reveal_patterns',
    '[
      {
        "pattern_id": "short-input-hallucination",
        "display_name": "Short-input hallucinations",
        "trigger_slots": [3, 7, 11, 17],
        "trigger_label": "FAIL",
        "min_catches_to_surface": 2,
        "max_catches": 4,
        "card_copy": "Short tickets got the agent talking. Every input under 10 words produced a confident response full of invented details — error codes, module names, root causes. The agent fills silence with hallucination.",
        "card_style": "primary"
      },
      {
        "pattern_id": "sarcasm-as-neutral",
        "display_name": "Sarcasm read as neutral",
        "trigger_slots": [5, 9, 13, 16],
        "trigger_label": "FAIL",
        "min_catches_to_surface": 2,
        "max_catches": 4,
        "card_copy": "Four customers were furious. The agent said they were calm. Sarcasm, passive aggression, and slow rage all got classified as Neutral — and none got escalated. The agent reads words. You read between them.",
        "card_style": "primary"
      },
      {
        "pattern_id": "multi-issue-drop",
        "display_name": "Multi-issue drop",
        "trigger_slots": [8, 14],
        "trigger_label": "NEEDS_EDITS",
        "min_catches_to_surface": 1,
        "max_catches": 2,
        "card_copy": "Two tickets had two problems each. The agent caught the first issue and summarised that. The second issue — a feature request, a billing dispute — was dropped entirely. Completeness is not the same as accuracy.",
        "card_style": "secondary"
      }
    ]'::jsonb,
    'seed'
  )
  on conflict (kit_id, block_type) do nothing;

  -- ── Workspace progress steps block ─────────────────────────
  insert into kit_content_blocks (kit_id, block_type, block_data, updated_by)
  values (
    v_kit_id,
    'workspace_progress_steps',
    '[
      {"step_id": "label_tickets", "label": "Label tickets", "order": 1},
      {"step_id": "see_patterns",  "label": "See patterns",  "order": 2},
      {"step_id": "read_concept",  "label": "Read concept",  "order": 3},
      {"step_id": "start_course",  "label": "Start course",  "order": 4}
    ]'::jsonb,
    'seed'
  )
  on conflict (kit_id, block_type) do nothing;

end $$;

-- ── Shared blocks ─────────────────────────────────────────────

insert into shared_blocks (slug, name, description, default_data, allows_kit_override)
values (
  'confirmation_translation',
  'Confirmation translation line',
  'The one-sentence translation shown after "WHAT YOU''RE REALLY ASKING". Structure is shared; kit-specific text is overridden per kit.',
  '{"text": "How to evaluate your AI."}',
  true
)
on conflict (slug) do nothing;

insert into shared_blocks (slug, name, description, default_data, allows_kit_override)
values (
  'confirmation_bridge_paragraph',
  'Confirmation bridge paragraph',
  'The paragraph that bridges the translation line to the CTA. Sets the tone for what the user is about to do.',
  '{"text": "You''re about to get hands-on. This isn''t a lecture — it''s a lab. You''ll make real decisions, see where your instincts hold up, and build something you can actually use."}',
  true
)
on conflict (slug) do nothing;

insert into shared_blocks (slug, name, description, default_data, allows_kit_override)
values (
  'concept_panel_vibe_check',
  'Concept panel — vibe check workspace',
  'The concept text shown in the right panel of the vibe check lab.',
  '{"headline": "What you''re building toward", "body": "Every output needs criteria. Before you can automate evaluation, you need to know what good looks like."}',
  true
)
on conflict (slug) do nothing;

insert into shared_blocks (slug, name, description, default_data, allows_kit_override)
values (
  'reveal_cta_primary',
  'Reveal screen — primary CTA',
  'The primary call-to-action on the reveal screen. Drives to the next step.',
  '{"label": "See what the patterns mean", "href": "/playground/eval-lab/concept"}',
  true
)
on conflict (slug) do nothing;

insert into shared_blocks (slug, name, description, default_data, allows_kit_override)
values (
  'reveal_cta_secondary',
  'Reveal screen — secondary CTA',
  'The "Save & come back" link on the reveal screen. Shared across all kits, no override.',
  '{"label": "Save and come back later", "href": "/dashboard"}',
  false
)
on conflict (slug) do nothing;

insert into shared_blocks (slug, name, description, default_data, allows_kit_override)
values (
  'classifier_miss_recovery_copy',
  'Classifier miss — recovery copy',
  'Copy shown when the classifier can''t route a user''s query to a kit.',
  '{"headline": "Let''s try a different angle", "body": "We couldn''t match that to a specific practice area. Try rephrasing — or pick one of the topics below."}',
  false
)
on conflict (slug) do nothing;

-- ── Evals kit overrides on shared blocks ─────────────────────

do $$
declare
  v_kit_id            uuid;
  v_translation_id    uuid;
  v_bridge_id         uuid;
  v_reveal_cta_id     uuid;
begin
  select id into v_kit_id from kits where slug = 'eval-lab';
  select id into v_translation_id from shared_blocks where slug = 'confirmation_translation';
  select id into v_bridge_id from shared_blocks where slug = 'confirmation_bridge_paragraph';
  select id into v_reveal_cta_id from shared_blocks where slug = 'reveal_cta_primary';

  insert into kit_overrides (kit_id, shared_block_id, override_data)
  values (v_kit_id, v_translation_id, '{"text": "How to run evals on your AI."}')
  on conflict (kit_id, shared_block_id) do nothing;

  insert into kit_overrides (kit_id, shared_block_id, override_data)
  values (v_kit_id, v_bridge_id, '{"text": "You''re about to label 20 support tickets the way an AI agent did. Spot where it went wrong, and you''ll understand what makes an eval set honest."}')
  on conflict (kit_id, shared_block_id) do nothing;

  insert into kit_overrides (kit_id, shared_block_id, override_data)
  values (v_kit_id, v_reveal_cta_id, '{"label": "See what the patterns mean", "href": "/playground/eval-lab/concept"}')
  on conflict (kit_id, shared_block_id) do nothing;

end $$;
