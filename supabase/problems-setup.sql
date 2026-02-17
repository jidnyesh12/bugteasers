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


-- 2. Problems table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.problems (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  difficulty    difficulty_level NOT NULL DEFAULT 'easy',
  tags          TEXT[],
  constraints   TEXT,
  examples      JSONB,
  hints         JSONB,
  time_limit    INTEGER NOT NULL DEFAULT 2000,
  memory_limit  INTEGER NOT NULL DEFAULT 256,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  starter_code  TEXT,
  solution_code TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problems_created_by ON public.problems(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON public.problems USING GIN(tags);

-- Enable RLS
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Everyone can view problems" ON public.problems;
CREATE POLICY "Everyone can view problems"
  ON public.problems FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create problems" ON public.problems;
CREATE POLICY "Users can create problems"
  ON public.problems FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own problems" ON public.problems;
CREATE POLICY "Users can update their own problems"
  ON public.problems FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own problems" ON public.problems;
CREATE POLICY "Users can delete their own problems"
  ON public.problems FOR DELETE
  USING (created_by = auth.uid());


-- 3. Test Cases table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_sample ON public.test_cases(is_sample);

-- Enable RLS
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Everyone can view sample test cases" ON public.test_cases;
CREATE POLICY "Everyone can view sample test cases"
  ON public.test_cases FOR SELECT
  USING (is_sample = true);

DROP POLICY IF EXISTS "Users can view all test cases for their problems" ON public.test_cases;
CREATE POLICY "Users can view all test cases for their problems"
  ON public.test_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_id AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage test cases for their problems" ON public.test_cases;
CREATE POLICY "Users can manage test cases for their problems"
  ON public.test_cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_id AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_id AND p.created_by = auth.uid()
    )
  );


-- 4. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS problems_updated_at ON public.problems;
CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

