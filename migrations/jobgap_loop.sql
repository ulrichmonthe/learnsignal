-- Job-Gap Loop: resume claims + public decision-record profiles.
-- Safe to rerun: guards on every object. Service-role only (RLS on, no policies).

-- Capabilities claimed on an uploaded resume. Claims are DISPLAY + routING
-- signals only — they never raise readiness levels or enter the public record.
create table if not exists public.resume_claims (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  capability     text not null,
  claimed_level  int not null default 1,
  evidence_quote text,
  created_at     timestamptz not null default now(),
  unique (user_id, capability)
);

create index if not exists resume_claims_user_idx on public.resume_claims (user_id);
alter table public.resume_claims enable row level security;

-- Opt-in public Decision Record profile (learnsignal.ai/u/<handle>).
create table if not exists public.public_profiles (
  user_id    text primary key,
  handle     text not null unique,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists public_profiles_handle_idx on public.public_profiles (handle);
alter table public.public_profiles enable row level security;
