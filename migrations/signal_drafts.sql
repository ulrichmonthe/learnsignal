-- Signals Writer draft queue
-- The scheduled "Signals Writer" managed agent writes one draft per week here as
-- status='pending'. The platform's /signals-review surface reads this table and
-- lets an admin approve or reject before anything is published.
--
-- Safe to rerun: guards on every object.

create extension if not exists pgcrypto;

create table if not exists public.signal_drafts (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  week_of           date,                         -- the Monday the Signal covers
  title             text not null,
  dek               text,                         -- one-line summary
  body_md           text not null,                -- the full draft, markdown
  decision_framing  text,                         -- "the decision it changes"
  category          text,                         -- Practice | Research | Tools | Industry
  sources           jsonb not null default '[]'::jsonb,  -- [{ "title": "...", "url": "..." }]
  self_grade        jsonb,                         -- { score, max, verdict, criteria: [{name, pass, note}] }
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  reviewed_at       timestamptz,
  reviewer          text
);

create index if not exists signal_drafts_status_created_idx
  on public.signal_drafts (status, created_at desc);

-- Service-role only. The platform (server-side) and the agent both use the
-- service key, which bypasses RLS. With RLS enabled and NO policies, anon and
-- authenticated roles have zero access — drafts never leak to the public.
alter table public.signal_drafts enable row level security;
