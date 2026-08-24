-- Calibration corpus, Phase 0 — capture only. No published statistics yet.
-- Roadmap D §2.1. Safe to rerun: guards on every object.
--
-- Design notes that are load-bearing:
--  · learner_key is HMAC(user_id, pepper) — this table has NO join path to email.
--  · choice_set_hash resets a distribution when option wording changes; pooling
--    across reworded options would be fabrication (D §5 rule 4).
--  · is_first_attempt marks the only rows eligible for published distributions.
--  · rationale_text is captured for coding, never published (D §5 rule 7).

create extension if not exists pgcrypto;

create table if not exists public.decision_events (
  event_id          uuid primary key default gen_random_uuid(),
  attempt_id        uuid not null,
  learner_key       text not null,              -- HMAC-SHA256(user_id, pepper), hex
  scenario_id       text not null,
  scenario_version  text not null default '1',
  node_id           text not null,              -- 'act-2'
  choice_id         text not null,
  choice_set_hash   text not null,
  rationale_text    text,                       -- never published; coded later
  rationale_codes   text[] default '{}',
  confidence_pct    smallint check (confidence_pct between 0 and 100),
  pred_majority_id  text,                       -- Prelec surprisingly-popular input
  pred_majority_pct smallint check (pred_majority_pct between 0 and 100),
  time_to_decide_ms integer,
  pressure_profile  text not null default 'untimed',
  hints_used        smallint not null default 0,
  is_first_attempt  boolean not null default true,
  client_surface    text not null default 'web',
  occurred_at       timestamptz not null default now()
);

create index if not exists decision_events_rollup_idx
  on public.decision_events (scenario_id, node_id, choice_set_hash, is_first_attempt);
create index if not exists decision_events_learner_idx
  on public.decision_events (learner_key, scenario_id, node_id);

-- Integrity, not an optimisation. is_first_attempt is decided by a count-then-
-- insert, which is a read-modify-write race: a double-submit or two tabs can
-- both read zero and both claim to be the first attempt. Published
-- distributions draw exclusively from first attempts, so a duplicate here is
-- corpus corruption. This partial unique index makes the database the arbiter —
-- the second writer is rejected and the app retries as a non-first attempt.
create unique index if not exists decision_events_one_first_attempt_idx
  on public.decision_events (learner_key, scenario_id, node_id)
  where is_first_attempt;

-- Comparability metadata. Separate table, joined only at rollup time.
-- Deliberately no employer/title free text — re-identification vectors.
create table if not exists public.learner_profiles (
  learner_key    text primary key,
  seniority      text,
  company_stage  text,
  domain         text,
  ai_tenure_band text,
  ships_models   boolean,
  region_bucket  text,
  self_reported  boolean not null default true,
  profile_asof   date default current_date
);

alter table public.decision_events enable row level security;
alter table public.learner_profiles enable row level security;

-- Scenario progress: the engine reads scenario_completions but nothing ever
-- wrote it (the progress route was an empty directory). Ensure it exists with
-- the columns the resume path needs.
create table if not exists public.scenario_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  scenario_id   uuid not null,
  current_act   int not null default 1,
  decisions     jsonb not null default '{}'::jsonb,
  completed     boolean not null default false,
  started_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, scenario_id)
);

create index if not exists scenario_completions_user_idx
  on public.scenario_completions (user_id, updated_at desc);

alter table public.scenario_completions enable row level security;
