-- US-03: capture Commit-Loop exercise decisions into the calibration corpus.
-- Safe to rerun.
--
-- The expert verdict is stored ON THE EVENT, not looked up at read time: a later
-- edit to exercise content must not retroactively change whether a past answer
-- counted as matching the practitioner call (D §5 rule 4, same reasoning as
-- choice_set_hash).

-- Column and constraint are added separately on purpose: `add column if not
-- exists ... check (...)` skips the ENTIRE clause when the column already
-- exists, so a database that acquired the column without the CHECK would never
-- get it on a rerun, and the verdict guard would silently rest on app
-- validation alone.
alter table public.decision_events
  add column if not exists expert_verdict text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'decision_events_expert_verdict_chk'
  ) then
    alter table public.decision_events
      add constraint decision_events_expert_verdict_chk
      check (expert_verdict is null or expert_verdict in ('on-it', 'directional', 'miss'));
  end if;
end $$;

-- Calibration reads scan (learner, verdict) over first attempts only.
create index if not exists decision_events_calibration_idx
  on public.decision_events (learner_key, expert_verdict)
  where is_first_attempt;

notify pgrst, 'reload schema';
