-- US-02: tag scenarios with the platform's 14-key capability taxonomy — the same
-- vocabulary the n8n job classifier emits and lib/capabilities/map.ts consumes.
-- Also adds `version`, which the calibration corpus needs so distributions never
-- pool across scenario major versions (roadmap D §5 rule 4).
-- Safe to rerun.

alter table public.scenarios
  add column if not exists capabilities jsonb not null default '[]'::jsonb;

-- NOTE: scenarios.version already exists as `integer not null default 1`
-- (db/schema.sql). Do NOT re-declare it here — `add column if not exists` would
-- silently no-op on an existing database while creating a different type on a
-- fresh one, leaving environments divergent. The app coerces it to a string.

-- PostgREST caches the schema; without this, newly added columns are invisible
-- (and scenarios silently vanish from prep) until the cache refreshes.
notify pgrst, 'reload schema';

-- Example (run per scenario once you've decided its taxonomy):
--   update public.scenarios
--      set capabilities = '["rag_vs_finetune","eval_design"]'::jsonb
--    where slug = 'rag-vs-finetune';
--
-- Valid keys (closed set — anything else is ignored by the app):
--   eval_design, ml_metrics, experimentation, data_labelling, rag_vs_finetune,
--   hallucination_ux, cost_modelling, model_selection, latency_budgeting,
--   human_in_the_loop, agent_behaviour, fine_tuning, prompt_engineering,
--   ai_safety_policy
