-- ============================================================
-- Auto-Retry Columns for problem_generation_jobs
-- Run this in Supabase SQL Editor to add retry support.
-- Fully idempotent - safe to re-run multiple times.
-- ============================================================

-- Add retry_count column (tracks how many retries have been attempted)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'problem_generation_jobs' 
    AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.problem_generation_jobs
      ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add max_retries column (configurable max retries per job)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'problem_generation_jobs' 
    AND column_name = 'max_retries'
  ) THEN
    ALTER TABLE public.problem_generation_jobs
      ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3;
  END IF;
END $$;

-- Add retry_history column (JSONB array of previous attempt errors)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'problem_generation_jobs' 
    AND column_name = 'retry_history'
  ) THEN
    ALTER TABLE public.problem_generation_jobs
      ADD COLUMN retry_history JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add 'retrying' as a valid status in the check constraint
DO $$ 
BEGIN
  -- Always try to drop the auto-generated PG constraint
  BEGIN
    ALTER TABLE public.problem_generation_jobs DROP CONSTRAINT problem_generation_jobs_status_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  
  -- Also drop our previously mistakenly named one if it exists
  BEGIN
    ALTER TABLE public.problem_generation_jobs DROP CONSTRAINT chk_generation_job_status;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  -- Add the single unified constraint
  ALTER TABLE public.problem_generation_jobs
    ADD CONSTRAINT problem_generation_jobs_status_check
    CHECK (status IN ('queued', 'ai_generating', 'validating', 'retrying', 'completed', 'discarded', 'error'));
END $$;

-- ============================================================
-- Done! 🎉 Retry support columns added.
-- ============================================================
