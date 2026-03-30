-- ============================================
-- Migration: Add async problem generation jobs + testcase generation metadata
-- Description: Introduces job tracking for non-blocking generation validation flow
--              and metadata columns for generated testcases.
-- ============================================

-- ============================================
-- Table: problem_generation_jobs
-- ============================================
CREATE TABLE IF NOT EXISTS problem_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'ai_generating', 'validating', 'completed', 'discarded', 'error')),
  request_payload JSONB NOT NULL,
  result_payload JSONB,
  progress_message TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_created_by
  ON problem_generation_jobs(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_status
  ON problem_generation_jobs(status, created_at DESC);

-- ============================================
-- Metadata columns on test_cases
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' AND column_name = 'generated_at'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN generated_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' AND column_name = 'generation_model'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN generation_model TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' AND column_name = 'generation_seed'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN generation_seed TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' AND column_name = 'is_generated'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN is_generated BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' AND column_name = 'input_hash'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN input_hash TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_test_cases_is_generated
  ON test_cases(is_generated);

CREATE INDEX IF NOT EXISTS idx_test_cases_input_hash
  ON test_cases(input_hash)
  WHERE input_hash IS NOT NULL;

-- ============================================
-- RLS for generation jobs (service role usage retained)
-- ============================================
ALTER TABLE problem_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to problem_generation_jobs" ON problem_generation_jobs;
CREATE POLICY "Service role full access to problem_generation_jobs"
  ON problem_generation_jobs FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================
-- Done
-- ============================================
