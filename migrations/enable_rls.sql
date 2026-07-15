-- Defense in depth: enable RLS on every user-data table with NO policies.
--
-- All server-side access uses the service-role key, which bypasses RLS, so
-- nothing breaks. The anon/publishable key (unused by the app since the Clerk
-- migration) can no longer read or write ANY row — so a leaked anon key, or a
-- future accidental client-side query, hits a wall instead of the whole table.
--
-- Run in the Supabase SQL editor. Safe to re-run (idempotent).

ALTER TABLE IF EXISTS lab_progress          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS decisions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signal_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signal_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sources               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evidence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS playground_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS playground_responses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raw_transcripts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenario_completions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_dimensions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS war_room_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenario_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_papers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tool_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenario_embeddings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evidence_embeddings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vibe_check_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_labels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eval_tickets          ENABLE ROW LEVEL SECURITY;
