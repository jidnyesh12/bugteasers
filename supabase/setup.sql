-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  BugTeasers / CodeGuru AI — Complete Database Setup            ║
-- ║                                                                ║
-- ║  Auth: NextAuth.js (JWT-based)                                 ║
-- ║  DB:   Supabase (accessed via service_role key)                ║
-- ║                                                                ║
-- ║  Run this in Supabase SQL Editor for a fresh project.          ║
-- ║  Safe to re-run — uses IF NOT EXISTS / DROP IF EXISTS.         ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ============================================================
-- 0. Helper: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 1. Users table (NextAuth — app-managed auth)
--    NextAuth uses JWT sessions. This table stores user
--    credentials and profile info. Passwords are bcrypt hashed.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student'
                   CHECK (role IN ('student', 'instructor', 'admin')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Open policy: API routes use service_role key; auth is in app code
DROP POLICY IF EXISTS "Service role full access to users" ON public.users;
CREATE POLICY "Service role full access to users"
  ON public.users FOR ALL
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 2. Classrooms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classrooms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  join_code      TEXT NOT NULL UNIQUE,
  instructor_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_instructor ON public.classrooms(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_join_code ON public.classrooms(join_code);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to classrooms" ON public.classrooms;
CREATE POLICY "Service role full access to classrooms"
  ON public.classrooms FOR ALL
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS classrooms_updated_at ON public.classrooms;
CREATE TRIGGER classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 3. Enrollments (student ↔ classroom)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  classroom_id   UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, classroom_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_classroom ON public.enrollments(classroom_id);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to enrollments" ON public.enrollments;
CREATE POLICY "Service role full access to enrollments"
  ON public.enrollments FOR ALL
  USING (true) WITH CHECK (true);


-- ============================================================
-- 4. Custom ENUM types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE programming_language AS ENUM (
    'python', 'javascript', 'typescript', 'java', 'cpp', 'c'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 5. Problems (AI-generated coding problems)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.problems (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  difficulty     difficulty_level NOT NULL DEFAULT 'easy',
  tags           TEXT[],
  constraints    TEXT,
  examples       JSONB,
  hints          JSONB,
  time_limit     INTEGER NOT NULL DEFAULT 2000,   -- milliseconds
  memory_limit   INTEGER NOT NULL DEFAULT 256,    -- MB
  usage_count    INTEGER NOT NULL DEFAULT 0,
  starter_code   TEXT,
  solution_code  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_problems_created_by ON public.problems(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON public.problems USING GIN(tags);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to problems" ON public.problems;
CREATE POLICY "Service role full access to problems"
  ON public.problems FOR ALL
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS problems_updated_at ON public.problems;
CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 6. Test Cases (linked to problems)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.test_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id      UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  input_data      TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample       BOOLEAN NOT NULL DEFAULT false,
  points          INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_sample ON public.test_cases(is_sample);

ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to test_cases" ON public.test_cases;
CREATE POLICY "Service role full access to test_cases"
  ON public.test_cases FOR ALL
  USING (true) WITH CHECK (true);


-- ============================================================
-- 7. Submissions (student code submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id     UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  classroom_id   UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  language       TEXT NOT NULL,
  code           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'accepted', 'wrong_answer',
                                     'time_limit', 'memory_limit', 'runtime_error', 'compile_error')),
  score          INTEGER,
  runtime_ms     INTEGER,
  memory_kb      INTEGER,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON public.submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_classroom ON public.submissions(classroom_id);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to submissions" ON public.submissions;
CREATE POLICY "Service role full access to submissions"
  ON public.submissions FOR ALL
  USING (true) WITH CHECK (true);


-- ============================================================
-- 8. Student Progress (per-problem progress tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id     UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  classroom_id   UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  best_score     INTEGER DEFAULT 0,
  attempts       INTEGER DEFAULT 0,
  is_solved      BOOLEAN DEFAULT false,
  first_solved   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, problem_id, classroom_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_problem ON public.student_progress(problem_id);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to student_progress" ON public.student_progress;
CREATE POLICY "Service role full access to student_progress"
  ON public.student_progress FOR ALL
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS progress_updated_at ON public.student_progress;
CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- Done! 🎉
-- Tables: users, classrooms, enrollments, problems, test_cases,
--         submissions, student_progress
-- Auth:   NextAuth.js (JWT) — no auth.users dependency
-- Access: service_role key from API routes
-- ============================================================
