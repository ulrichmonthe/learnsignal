-- ============================================================
-- The Signal — Merged Database Schema
-- Paste this into the Supabase SQL Editor to create all tables.
-- Covers: Playground signals/evidence layer + Learning scenario layer.
-- ============================================================

-- Enable pgvector for semantic search (phase 3+, harmless to enable now)
create extension if not exists vector;

-- ============================================================
-- USERS & AUTH
-- ============================================================

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  role text check (role in ('member', 'admin')) default 'member',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  company_stage text check (company_stage in ('pre-seed', 'seed', 'series-a', 'series-b', 'series-c+', 'enterprise')),
  product_type text check (product_type in ('b2b', 'b2c', 'infrastructure')),
  ai_stack text check (ai_stack in ('openai', 'anthropic', 'google', 'open-source', 'mixed')),
  onboarding_completed boolean default false,
  preferences jsonb default '{}'
);

-- ============================================================
-- SUBSCRIPTIONS (stubbed — wire to Stripe in phase 2)
-- ============================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan_id text check (plan_id in ('free', 'individual', 'individual-annual', 'founding', 'founding-annual', 'team')),
  status text check (status in ('active', 'canceled', 'past_due', 'trialing')) default 'active',
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subscription_id uuid references subscriptions(id),
  seat_limit integer default 10,
  created_at timestamp with time zone default now()
);

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default now(),
  primary key (team_id, user_id)
);

-- ============================================================
-- PLAYGROUND LAYER — Signals, Evidence, Decision Sessions
-- (from AI PM Playground spec — the intelligence layer)
-- ============================================================

create table decisions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table signals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references decisions(id) on delete cascade not null,
  slug text not null,
  name text not null,
  core_question text not null,
  why_it_matters text,
  signal_type text check (signal_type in ('checklist', 'multiple_choice', 'open_reflection')) not null,
  display_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (decision_id, slug)
);

create table signal_options (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade not null,
  label text not null,
  weight integer not null default 1,
  display_order integer not null default 0
);

create table signal_results (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade not null,
  min_score integer not null,
  max_score integer not null,
  verdict text not null,
  reasoning text not null
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  source_type text check (source_type in ('article', 'podcast', 'talk', 'newsletter', 'other')),
  author text,
  publication text,
  published_at date,
  created_at timestamp with time zone default now()
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade not null,
  source_id uuid references sources(id) on delete set null,
  evidence_type text check (evidence_type in ('quote', 'example', 'test', 'statistic', 'failure_mode')),
  content text not null,
  speaker text,
  confidence text check (confidence in ('low', 'medium', 'high')),
  display_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Playground decision sessions (distinct from learning scenario sessions)
create table playground_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  scenario_context jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table playground_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references playground_sessions(id) on delete cascade not null,
  signal_id uuid references signals(id) on delete cascade not null,
  selected_options jsonb,
  reflection_text text,
  saved_without_deciding boolean default false,
  disagreed_with_framing boolean default false,
  created_at timestamp with time zone default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  evidence_id uuid references evidence(id) on delete cascade,
  signal_id uuid references signals(id) on delete cascade,
  feedback_type text check (feedback_type in ('helpful', 'not_helpful', 'saved', 'shared', 'clicked_source')),
  created_at timestamp with time zone default now()
);

-- Ingestion pipeline staging table (phase 3+)
create table raw_transcripts (
  id uuid primary key default gen_random_uuid(),
  source_url text unique not null,
  source_type text not null,
  title text,
  published_at timestamp with time zone,
  transcript_text text,
  raw_response jsonb,
  processed boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- LEARNING LAYER — Scenarios, Skill Tracking, War Rooms
-- (from The Signal spec)
-- ============================================================

create table scenarios (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1,
  module_id text,
  title text not null,
  slug text unique,
  difficulty integer check (difficulty between 1 and 5),
  estimated_minutes integer,
  acts jsonb not null default '[]',
  expert_path text[],
  skill_dimensions text[],
  published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (id, version)
);

create table scenario_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  scenario_id uuid not null,
  scenario_version integer not null,
  current_act integer default 1,
  completed boolean default false,
  completed_at timestamp with time zone,
  decisions jsonb,
  time_per_act jsonb,
  total_time_seconds integer,
  started_at timestamp with time zone default now()
);

create table skill_dimensions (
  id text primary key,
  name text not null,
  description text,
  display_order integer
);

create table skill_scores (
  user_id uuid references users(id) on delete cascade,
  dimension text references skill_dimensions(id),
  score integer check (score between 0 and 100) default 0,
  decisions_count integer default 0,
  last_updated timestamp with time zone default now(),
  primary key (user_id, dimension)
);

create table war_room_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  guest_speaker_name text not null,
  guest_speaker_title text,
  guest_speaker_company text,
  scheduled_for timestamp with time zone not null,
  duration_minutes integer default 45,
  recording_url text,
  transcript text,
  related_scenarios text[],
  status text check (status in ('scheduled', 'live', 'completed', 'canceled')) default 'scheduled',
  created_at timestamp with time zone default now()
);

create table peer_reviews (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios(id) on delete cascade not null,
  reviewer_id uuid references users(id) on delete cascade not null,
  reviewee_id uuid references users(id) on delete cascade not null,
  content jsonb,
  helpfulness_rating integer check (helpfulness_rating between 1 and 5),
  created_at timestamp with time zone default now(),
  unique (scenario_id, reviewer_id, reviewee_id)
);

create table scenario_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references users(id) on delete cascade,
  title text not null,
  situation text not null,
  decision_needed text not null,
  what_happened text,
  lessons text,
  anonymize boolean default true,
  status text check (status in ('voting', 'accepted', 'in_production', 'published', 'rejected')) default 'voting',
  votes integer default 0,
  published_scenario_id uuid references scenarios(id),
  created_at timestamp with time zone default now()
);

create table research_papers (
  id uuid primary key default gen_random_uuid(),
  arxiv_id text unique,
  title text not null,
  authors text[],
  abstract text,
  published_date date,
  relevance_score integer check (relevance_score between 1 and 10),
  difficulty_score integer check (difficulty_score between 1 and 5),
  impact_score integer check (impact_score between 1 and 10),
  related_scenarios text[],
  selected_for_week date,
  created_at timestamp with time zone default now()
);

create table tool_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  tool_id text check (tool_id in ('prompt-lab', 'cost-calc', 'eval-builder', 'failure-mapper', 'research-translator')) not null,
  usage_data jsonb,
  input_tokens integer,
  output_tokens integer,
  cost_usd decimal(10,6),
  created_at timestamp with time zone default now()
);

-- ============================================================
-- VECTOR EMBEDDINGS (phase 3+ — tables exist, populate later)
-- ============================================================

create table scenario_embeddings (
  scenario_id uuid references scenarios(id) on delete cascade,
  scenario_version integer,
  embedding vector(1536),
  created_at timestamp with time zone default now(),
  primary key (scenario_id, scenario_version)
);

create table evidence_embeddings (
  evidence_id uuid references evidence(id) on delete cascade primary key,
  embedding vector(1536),
  created_at timestamp with time zone default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_signals_decision on signals(decision_id, display_order);
create index idx_evidence_signal on evidence(signal_id, display_order);
create index idx_playground_sessions_user on playground_sessions(user_id, created_at desc);
create index idx_playground_responses_session on playground_responses(session_id, signal_id);
create index idx_raw_transcripts_processed on raw_transcripts(processed, created_at);
create index idx_completions_user on scenario_completions(user_id);
create index idx_completions_scenario on scenario_completions(scenario_id);
create index idx_skill_scores_user on skill_scores(user_id);
create index idx_tool_usage_user_tool on tool_usage(user_id, tool_id);
create index idx_papers_relevance on research_papers(relevance_score desc);
create index idx_sessions_scheduled on war_room_sessions(scheduled_for);

create index on scenario_embeddings using ivfflat (embedding vector_cosine_ops);
create index on evidence_embeddings using ivfflat (embedding vector_cosine_ops);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Public read (content tables)
alter table decisions enable row level security;
create policy "decisions readable by all" on decisions for select using (true);

alter table signals enable row level security;
create policy "signals readable by all" on signals for select using (true);

alter table signal_options enable row level security;
create policy "signal_options readable by all" on signal_options for select using (true);

alter table signal_results enable row level security;
create policy "signal_results readable by all" on signal_results for select using (true);

alter table sources enable row level security;
create policy "sources readable by all" on sources for select using (true);

alter table evidence enable row level security;
create policy "evidence readable by all" on evidence for select using (true);

alter table scenarios enable row level security;
create policy "published scenarios readable by all" on scenarios for select using (published = true);

alter table skill_dimensions enable row level security;
create policy "skill_dimensions readable by all" on skill_dimensions for select using (true);

alter table war_room_sessions enable row level security;
create policy "war_room_sessions readable by all" on war_room_sessions for select using (true);

alter table research_papers enable row level security;
create policy "research_papers readable by all" on research_papers for select using (true);

-- Users own their data
alter table users enable row level security;
create policy "users own row" on users for all using (auth.uid() = id);

alter table user_profiles enable row level security;
create policy "user_profiles own row" on user_profiles for all using (auth.uid() = user_id);

alter table subscriptions enable row level security;
create policy "subscriptions own rows" on subscriptions for all using (auth.uid() = user_id);

alter table playground_sessions enable row level security;
create policy "playground_sessions own rows" on playground_sessions for all using (auth.uid() = user_id);

alter table playground_responses enable row level security;
create policy "playground_responses own sessions" on playground_responses for all
  using (exists (select 1 from playground_sessions where playground_sessions.id = session_id and playground_sessions.user_id = auth.uid()));

alter table feedback enable row level security;
create policy "feedback own rows" on feedback for all using (auth.uid() = user_id);

alter table scenario_completions enable row level security;
create policy "completions own rows" on scenario_completions for all using (auth.uid() = user_id);

alter table skill_scores enable row level security;
create policy "skill_scores own rows" on skill_scores for all using (auth.uid() = user_id);

alter table peer_reviews enable row level security;
create policy "reviews own rows" on peer_reviews for all
  using (auth.uid() = reviewer_id or auth.uid() = reviewee_id);

alter table scenario_submissions enable row level security;
create policy "submissions readable by all" on scenario_submissions for select using (true);
create policy "submissions own rows" on scenario_submissions for insert with check (auth.uid() = submitted_by);

alter table tool_usage enable row level security;
create policy "tool_usage own rows" on tool_usage for all using (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger decisions_updated_at before update on decisions
  for each row execute function update_updated_at();
create trigger signals_updated_at before update on signals
  for each row execute function update_updated_at();
create trigger scenarios_updated_at before update on scenarios
  for each row execute function update_updated_at();
create trigger users_updated_at before update on users
  for each row execute function update_updated_at();
create trigger playground_sessions_updated_at before update on playground_sessions
  for each row execute function update_updated_at();

-- ============================================================
-- SEED DATA — First signal end-to-end (from Playground guide)
-- ============================================================

insert into skill_dimensions (id, name, description, display_order) values
  ('technical-foundation', 'Technical Foundation', 'Model understanding, architecture choices, technical trade-offs', 1),
  ('product-craft', 'Product Craft', 'Feature design, UX, quality definition, user research', 2),
  ('strategic-thinking', 'Strategic Thinking', 'Build vs buy, moat, cost architecture, long-term thinking', 3),
  ('execution', 'Execution Excellence', 'Prioritization, team coordination, shipping, velocity', 4),
  ('community', 'Community & Network', 'Communication, stakeholder management, influence', 5),
  ('product-taste', 'Product Taste', 'Judgment on when to use AI, quality bar, experience design', 6);

insert into decisions (slug, name, description, display_order) values
  ('problem-selection', 'Problem Selection & Framing', 'Should this be augmentation or automation? Is AI even right for this problem?', 1),
  ('model-strategy', 'Model Strategy', 'Single frontier model, multi-model routing, or fine-tuned smaller model?', 2),
  ('interaction-surface', 'Interaction Surface', 'Where does AI live in your product?', 3),
  ('quality-measurement', 'Quality Measurement', 'How will you know if it''s good and stays good?', 4),
  ('trust-and-failure', 'Trust & Failure Modes', 'What does the product do when the model is wrong?', 5);

insert into signals (decision_id, slug, name, core_question, why_it_matters, signal_type, display_order)
select
  d.id,
  'rules-engine-check',
  'Could a rules engine solve this?',
  'Is the problem fundamentally ambiguous, or just complex?',
  'AI adds cost, latency, and unpredictability. If a rules engine handles the job, AI is a worse solution dressed up as a better one.',
  'checklist',
  1
from decisions d where d.slug = 'problem-selection';

insert into signal_options (signal_id, label, weight, display_order)
select s.id, opt.label, 1, opt.ord from signals s
cross join (values
  ('The decision rules can be enumerated explicitly', 1),
  ('Inputs are structured (not free text, images, audio, or video)', 2),
  ('The right answer is the same regardless of context', 3),
  ('Edge cases are rare or known in advance', 4),
  ('You can describe the rules without using ''similar,'' ''probably,'' or ''feels like''', 5)
) as opt(label, ord)
where s.slug = 'rules-engine-check';

insert into signal_results (signal_id, min_score, max_score, verdict, reasoning)
select s.id, 3, 5,
  'Leans toward a rules engine',
  'Three or more conditions favor deterministic logic. Rules engines are easier to debug, faster, and more predictable. Use AI only if you have a specific reason rules cannot extend — for example, adversarial inputs that mutate faster than rules can keep up, or a rule space too large to maintain.'
from signals s where s.slug = 'rules-engine-check';

insert into signal_results (signal_id, min_score, max_score, verdict, reasoning)
select s.id, 0, 2,
  'Leans toward AI',
  'The pattern-matching across messy inputs likely justifies the complexity. AI earns its place when the rules cannot be enumerated and the cost of getting it wrong is bounded.'
from signals s where s.slug = 'rules-engine-check';

insert into sources (title, url, source_type, author) values
  ('Rules-based vs AI automation — when each earns its place', 'https://etslabs.ai/rules-vs-ai', 'article', 'ETS Labs'),
  ('Rule-based AI vs machine learning — a practical guide', 'https://wearebrain.com/blog/rule-based-ai-vs-ml', 'article', 'WeAreBrain');

insert into evidence (signal_id, source_id, evidence_type, content, confidence, display_order)
select
  s.id,
  null,
  'example',
  'Spam filters started as rules engines and only moved to ML when adversarial patterns made rules unmaintainable — the mutation rate of spam exceeded what human rule-writers could maintain.',
  'high',
  1
from signals s where s.slug = 'rules-engine-check';

insert into evidence (signal_id, source_id, evidence_type, content, confidence, display_order)
select
  s.id,
  null,
  'example',
  'Tax calculation software remains rules-based because tax law is explicitly enumerated. TurboTax runs on thousands of if-then rules, not a model.',
  'high',
  2
from signals s where s.slug = 'rules-engine-check';

insert into evidence (signal_id, source_id, evidence_type, content, confidence, display_order)
select
  s.id,
  src.id,
  'test',
  'If you can write the complete decision logic without using the words "similar," "probably," or "feels like," you likely don''t need AI.',
  'medium',
  3
from signals s, sources src
where s.slug = 'rules-engine-check' and src.url = 'https://etslabs.ai/rules-vs-ai';
