-- ============================================
-- Migration: Create base tables
-- Description: users, classrooms, problems and test_cases as they existed
-- before 001, rebuilt from database/schema/*.json so a fresh database can
-- run every migration in order.
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'instructor')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  instructor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  tags text[],
  constraints text,
  examples jsonb,
  hints text[],
  time_limit integer NOT NULL DEFAULT 2000,
  memory_limit integer NOT NULL DEFAULT 256,
  usage_count integer NOT NULL DEFAULT 0,
  solution_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  input_data text NOT NULL,
  expected_output text NOT NULL,
  is_sample boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_instructor ON public.classrooms(instructor_id);
CREATE INDEX IF NOT EXISTS idx_problems_created_by ON public.problems(created_by);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON public.test_cases(problem_id);
