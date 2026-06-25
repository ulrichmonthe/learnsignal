-- Clerk migration: convert user identity columns from uuid → text
-- Clerk user ids are strings (e.g. "user_2abc..."), not UUIDs. Run once in
-- Supabase → SQL Editor. Drops obsolete RLS policies + the Supabase-Auth FK link.

-- 0) Drop ALL RLS policies in public (app uses service-role + Clerk now)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 1) Drop FKs ON these tables (incl. users.id → auth.users) OR referencing users
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname, con.conrelid::regclass AS tbl
    FROM pg_constraint con
    WHERE con.contype = 'f'
      AND (
        con.conrelid::regclass::text IN (
          'users','feedback','playground_sessions','scenario_completions','skill_scores',
          'subscriptions','team_members','tool_usage','user_artifacts','user_courses',
          'user_exercise_attempts','user_lessons','user_profiles','vibe_check_sessions'
        )
        OR con.confrelid::regclass::text = 'users'
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;

-- 2) Convert users.id + every user_id column to text; drop uuid defaults
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN id TYPE text USING id::text;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'feedback','playground_sessions','scenario_completions','skill_scores',
    'subscriptions','team_members','tool_usage','user_artifacts','user_courses',
    'user_exercise_attempts','user_lessons','user_profiles','vibe_check_sessions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id DROP DEFAULT', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id TYPE text USING user_id::text', t);
  END LOOP;
END $$;

-- 3) Re-establish FKs to the (now text) users table
ALTER TABLE feedback               ADD CONSTRAINT feedback_user_id_fkey               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE playground_sessions    ADD CONSTRAINT playground_sessions_user_id_fkey    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE scenario_completions   ADD CONSTRAINT scenario_completions_user_id_fkey   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE skill_scores           ADD CONSTRAINT skill_scores_user_id_fkey           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE vibe_check_sessions    ADD CONSTRAINT vibe_check_sessions_user_id_fkey    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tool_usage             ADD CONSTRAINT tool_usage_user_id_fkey             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_artifacts         ADD CONSTRAINT user_artifacts_user_id_fkey         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_courses           ADD CONSTRAINT user_courses_user_id_fkey           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_exercise_attempts ADD CONSTRAINT user_exercise_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_lessons           ADD CONSTRAINT user_lessons_user_id_fkey           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_profiles          ADD CONSTRAINT user_profiles_user_id_fkey          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE subscriptions          ADD CONSTRAINT subscriptions_user_id_fkey          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE team_members           ADD CONSTRAINT team_members_user_id_fkey           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
