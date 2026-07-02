-- Cloud-synced lab progress, keyed by Clerk user id.
-- Lets a user's RAG/PCE lab progress follow their account across devices,
-- instead of living only in the browser's localStorage.
-- Run once in Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS lab_progress (
  user_id    text        NOT NULL,
  lab        text        NOT NULL,           -- 'raglab' | 'pcelab' | ...
  data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lab)
);

-- skill_scores needs a unique (user_id, dimension) so the progress sync can upsert.
CREATE UNIQUE INDEX IF NOT EXISTS skill_scores_user_dimension_uniq
  ON skill_scores (user_id, dimension);
