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
  processing_token TEXT,
  processing_started_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problem_generation_jobs' AND column_name = 'processing_token'
  ) THEN
    ALTER TABLE problem_generation_jobs ADD COLUMN processing_token TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problem_generation_jobs' AND column_name = 'processing_started_at'
  ) THEN
    ALTER TABLE problem_generation_jobs ADD COLUMN processing_started_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_created_by
  ON problem_generation_jobs(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_status
  ON problem_generation_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_active_by_user
  ON problem_generation_jobs(created_by, status, updated_at DESC)
  WHERE status IN ('queued', 'ai_generating', 'validating');

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_processing_started_at
  ON problem_generation_jobs(processing_started_at)
  WHERE processing_started_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_problem_generation_jobs_active_updated_at
  ON problem_generation_jobs(updated_at)
  WHERE status IN ('queued', 'ai_generating', 'validating');

CREATE OR REPLACE FUNCTION enforce_problem_generation_active_job_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('queued', 'ai_generating', 'validating') THEN
    -- Serialize active-job inserts per user so the count check is race-safe.
    PERFORM pg_advisory_xact_lock(hashtext(NEW.created_by::text));

    IF (
      SELECT COUNT(*)
      FROM problem_generation_jobs
      WHERE created_by = NEW.created_by
        AND status IN ('queued', 'ai_generating', 'validating')
        -- Source-of-truth active-job cap: 2 (mirrored in service for user-facing messaging).
    ) >= 2 THEN
      RAISE EXCEPTION 'TOO_MANY_ACTIVE_GENERATION_JOBS'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_problem_generation_jobs_active_limit ON problem_generation_jobs;
CREATE TRIGGER trg_problem_generation_jobs_active_limit
  BEFORE INSERT ON problem_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_problem_generation_active_job_limit();

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
