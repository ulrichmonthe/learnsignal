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

-- Backfill. Slugs are assigned by the approve action, so anything approved
-- BEFORE this feature shipped has none — and the reader needs a slug to build a
-- URL, so those issues would stay invisible forever with no way to fix them
-- from the UI (Approve only renders while a draft is pending).
--
-- Mirrors lib/signals/slug.ts: lowercase, non-alphanumerics to hyphens, trim,
-- 70-char cap, numeric suffix on collision. Idempotent — only touches NULLs.
do $$
declare
  r         record;
  base      text;
  candidate text;
  n         int;
begin
  for r in
    select id, title
      from public.signal_drafts
     where status = 'approved' and slug is null
     order by created_at
  loop
    base := regexp_replace(lower(coalesce(r.title, '')), '[^a-z0-9]+', '-', 'g');
    base := regexp_replace(base, '^-+|-+$', '', 'g');
    base := left(base, 70);
    base := regexp_replace(base, '-+$', '', 'g');
    if base = '' then
      base := 'weekly-signal';
    end if;

    candidate := base;
    n := 2;
    while exists (select 1 from public.signal_drafts where slug = candidate) loop
      candidate := base || '-' || n;
      n := n + 1;
    end loop;

    update public.signal_drafts set slug = candidate where id = r.id;
  end loop;
end $$;

notify pgrst, 'reload schema';
