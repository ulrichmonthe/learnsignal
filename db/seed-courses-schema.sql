-- ============================================================
-- EVALS COURSE SCHEMA ADDITIONS
-- Add after existing schema (decisions, signals, evidence, etc.)
-- Run in Supabase SQL editor
-- ============================================================

-- courses: top-level course containers
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  estimated_minutes integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- modules: groupings of lessons within a course
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  slug text not null,
  title text not null,
  description text,
  display_order integer not null default 0,
  unique (course_id, slug)
);

-- lessons: individual lesson units
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade not null,
  slug text not null,
  title text not null,
  headline text,
  estimated_minutes integer,
  display_order integer not null default 0,
  has_exercise boolean default false,
  exercise_type text check (exercise_type in (
    'labeling', 'input_generation', 'pattern_clustering',
    'rubric_extraction', 'judge_builder', 'pairwise_comparison',
    'monitoring_plan', 'failure_tracing', 'classification'
  )),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (module_id, slug)
);

-- exercises: detailed config for each lesson's exercise
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade unique not null,
  exercise_type text not null,
  config jsonb not null,
  reference_data jsonb,
  created_at timestamp with time zone default now()
);

-- exercise_data_items: individual items shown during exercises
create table if not exists exercise_data_items (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercises(id) on delete cascade not null,
  item_type text not null,
  content jsonb not null,
  reference_label jsonb,
  display_order integer not null default 0
);

-- user_courses: tracks which courses a user has started
create table if not exists user_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  current_lesson_id uuid references lessons(id) on delete set null,
  unique (user_id, course_id)
);

-- user_lessons: tracks progress through individual lessons
create table if not exists user_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  unique (user_id, lesson_id)
);

-- user_exercise_attempts: stores user's exercise submissions
create table if not exists user_exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  attempt_number integer not null default 1,
  submission jsonb not null,
  reference_comparison jsonb,
  score numeric,
  submitted_at timestamp with time zone default now()
);

-- user_artifacts: the takeaway artifacts users build through the course
create table if not exists user_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  artifact_type text not null check (artifact_type in (
    'rubric', 'evaluator_architecture', 'judge_prompt',
    'monitoring_plan', 'debugging_playbook', 'test_input_set',
    'failure_patterns_doc'
  )),
  title text,
  content jsonb not null,
  source_exercise_id uuid references exercises(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_lessons_module on lessons(module_id, display_order);
create index if not exists idx_modules_course on modules(course_id, display_order);
create index if not exists idx_user_courses_user on user_courses(user_id);
create index if not exists idx_user_lessons_user on user_lessons(user_id);
create index if not exists idx_user_artifacts_user on user_artifacts(user_id, course_id);
create index if not exists idx_exercise_attempts_user on user_exercise_attempts(user_id, exercise_id);
create index if not exists idx_exercise_data_items_exercise on exercise_data_items(exercise_id, display_order);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Content tables: public read (no auth required to browse lessons)
alter table courses enable row level security;
drop policy if exists "courses readable by all" on courses;
create policy "courses readable by all" on courses for select using (true);

alter table modules enable row level security;
drop policy if exists "modules readable by all" on modules;
create policy "modules readable by all" on modules for select using (true);

alter table lessons enable row level security;
drop policy if exists "lessons readable by all" on lessons;
create policy "lessons readable by all" on lessons for select using (true);

alter table exercises enable row level security;
drop policy if exists "exercises readable by all" on exercises;
create policy "exercises readable by all" on exercises for select using (true);

alter table exercise_data_items enable row level security;
drop policy if exists "exercise_data_items readable by all" on exercise_data_items;
create policy "exercise_data_items readable by all" on exercise_data_items for select using (true);

-- User tables: own data only
alter table user_courses enable row level security;
drop policy if exists "user_courses own" on user_courses;
create policy "user_courses own" on user_courses for all using (auth.uid() = user_id);

alter table user_lessons enable row level security;
drop policy if exists "user_lessons own" on user_lessons;
create policy "user_lessons own" on user_lessons for all using (auth.uid() = user_id);

alter table user_exercise_attempts enable row level security;
drop policy if exists "user_exercise_attempts own" on user_exercise_attempts;
create policy "user_exercise_attempts own" on user_exercise_attempts for all using (auth.uid() = user_id);

alter table user_artifacts enable row level security;
drop policy if exists "user_artifacts own" on user_artifacts;
create policy "user_artifacts own" on user_artifacts for all using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — EVALS FOUNDATIONS COURSE
-- Uses a PL/pgSQL block to avoid subqueries inside VALUES clauses.
-- ============================================================

do $$
declare
  v_course_id        uuid;
  v_foundations_id   uuid;
  v_vibe_checks_id   uuid;
  v_auto_evals_id    uuid;
  v_production_id    uuid;
begin

  -- ── Course ──────────────────────────────────────────────
  insert into courses (slug, title, description, estimated_minutes)
  values (
    'evals-foundations',
    'Evals: From Vibe Checks to Production Quality',
    'A 10-lesson course on AI evaluation for product managers.',
    210
  )
  on conflict (slug) do nothing;

  select id into v_course_id from courses where slug = 'evals-foundations';

  -- ── Modules ─────────────────────────────────────────────
  insert into modules (course_id, slug, title, display_order)
  values (v_course_id, 'foundations',     'Foundations',     1)
  on conflict (course_id, slug) do nothing;

  insert into modules (course_id, slug, title, display_order)
  values (v_course_id, 'vibe-checks',     'Vibe Checks',     2)
  on conflict (course_id, slug) do nothing;

  insert into modules (course_id, slug, title, display_order)
  values (v_course_id, 'automated-evals', 'Automated Evals', 3)
  on conflict (course_id, slug) do nothing;

  insert into modules (course_id, slug, title, display_order)
  values (v_course_id, 'production',      'Production',      4)
  on conflict (course_id, slug) do nothing;

  select id into v_foundations_id   from modules where course_id = v_course_id and slug = 'foundations';
  select id into v_vibe_checks_id   from modules where course_id = v_course_id and slug = 'vibe-checks';
  select id into v_auto_evals_id    from modules where course_id = v_course_id and slug = 'automated-evals';
  select id into v_production_id    from modules where course_id = v_course_id and slug = 'production';

  -- ── Module 1: Foundations ───────────────────────────────
  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_foundations_id, 'lesson-1', 'Your AI shipped. Now what?',
    'Your AI shipped. Now how do you know if it is actually working?',
    8, 1, true, 'classification')
  on conflict (module_id, slug) do nothing;

  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_foundations_id, 'lesson-2', 'Why your QA instincts will fail you',
    'The first thing AI breaks is your definition of working.',
    10, 2, true, 'labeling')
  on conflict (module_id, slug) do nothing;

  -- ── Module 2: Vibe Checks ───────────────────────────────
  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_vibe_checks_id, 'lesson-3', 'Generating diverse test inputs',
    'Your eval set is only as honest as the inputs you put into it.',
    15, 1, true, 'input_generation')
  on conflict (module_id, slug) do nothing;

  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_vibe_checks_id, 'lesson-4', 'Labeling outputs and writing your first rubric',
    'Your rubric is not a document you write. It is a pattern you discover.',
    20, 2, true, 'rubric_extraction')
  on conflict (module_id, slug) do nothing;

  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_vibe_checks_id, 'lesson-5', 'Finding failure patterns',
    'Three of the same failure is a pattern. One is just a Tuesday.',
    15, 3, true, 'pattern_clustering')
  on conflict (module_id, slug) do nothing;

  -- ── Module 3: Automated Evals ───────────────────────────
  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_auto_evals_id, 'lesson-6', 'From rubric to deterministic checks',
    'Half your rubric does not need AI to check it. Do not pay for what code can do.',
    15, 1, true, 'classification')
  on conflict (module_id, slug) do nothing;

  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_auto_evals_id, 'lesson-7', 'LLM-as-judge done right',
    'An uncalibrated LLM judge is worse than no judge at all. It gives you false confidence.',
    25, 2, true, 'judge_builder')
  on conflict (module_id, slug) do nothing;

  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_auto_evals_id, 'lesson-8', 'Pairwise vs absolute scoring',
    'When you cannot tell if something is a 3 or a 4, ask which of two outputs is better instead.',
    10, 3, true, 'pairwise_comparison')
  on conflict (module_id, slug) do nothing;

  -- ── Module 4: Production ────────────────────────────────
  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_production_id, 'lesson-9', 'Online monitoring and drift detection',
    'Your eval set is a snapshot of what you know. Your users do things you did not anticipate.',
    20, 1, true, 'monitoring_plan')
  on conflict (module_id, slug) do nothing;

  insert into lessons (module_id, slug, title, headline, estimated_minutes, display_order, has_exercise, exercise_type)
  values (v_production_id, 'lesson-10', 'Tracing failures to root cause',
    'AI failures are rarely just the model being wrong. They are chains where one bad decision cascades.',
    20, 2, true, 'failure_tracing')
  on conflict (module_id, slug) do nothing;

end $$;
