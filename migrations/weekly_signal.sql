-- US-04: give approved Signal drafts an addressable, permanent URL.
-- Safe to rerun.

alter table public.signal_drafts
  add column if not exists slug text;

-- Unique among assigned slugs only; drafts awaiting review have none.
create unique index if not exists signal_drafts_slug_idx
  on public.signal_drafts (slug)
  where slug is not null;

-- The public index reads approved rows newest-first.
create index if not exists signal_drafts_published_idx
  on public.signal_drafts (status, created_at desc)
  where status = 'approved';

notify pgrst, 'reload schema';
