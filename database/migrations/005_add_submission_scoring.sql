-- ============================================
-- Migration: Add Submission Scoring Support
-- Description: Extends problem_submissions table with score tracking,
--              points calculation, and enhanced status values
-- Note: This migration is idempotent and can be run multiple times safely
-- ============================================

-- ============================================
-- Add scoring columns to problem_submissions
-- ============================================

-- Add score column (percentage 0-100)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problem_submissions' AND column_name = 'score'
  ) THEN
    ALTER TABLE problem_submissions 
      ADD COLUMN score NUMERIC(5,2) 
      CHECK (score >= 0 AND score <= 100);
  END IF;
END $$;

-- Add total_points column (sum of all test case points)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problem_submissions' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE problem_submissions 
      ADD COLUMN total_points INTEGER 
      CHECK (total_points >= 0);
  END IF;
END $$;

-- Add earned_points column (sum of points from passed tests)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problem_submissions' AND column_name = 'earned_points'
  ) THEN
    ALTER TABLE problem_submissions 
      ADD COLUMN earned_points INTEGER 
      CHECK (earned_points >= 0);
  END IF;
END $$;

-- Add constraint to ensure earned_points never exceeds total_points
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'earned_points_lte_total_points' 
    AND table_name = 'problem_submissions'
  ) THEN
    ALTER TABLE problem_submissions 
      ADD CONSTRAINT earned_points_lte_total_points 
      CHECK (earned_points <= total_points);
  END IF;
END $$;

-- ============================================
-- Update status constraint to include new values
-- ============================================

-- Drop existing status constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'problem_submissions_status_check' 
    AND table_name = 'problem_submissions'
  ) THEN
    ALTER TABLE problem_submissions 
      DROP CONSTRAINT problem_submissions_status_check;
  END IF;
END $$;

-- Add updated status constraint with 'partial' and 'error' values
ALTER TABLE problem_submissions 
  ADD CONSTRAINT problem_submissions_status_check 
  CHECK (status IN ('pending', 'passed', 'failed', 'partial', 'error'));

-- ============================================
-- Create indexes for performance optimization
-- ============================================

-- Index for querying submissions by student and problem (common query pattern)
CREATE INDEX IF NOT EXISTS idx_submissions_student_problem 
  ON problem_submissions(student_id, problem_id);

-- Index for querying submissions by student, problem, and submission time
CREATE INDEX IF NOT EXISTS idx_submissions_student_problem_time 
  ON problem_submissions(student_id, problem_id, submitted_at DESC);

-- Index for querying submissions by assignment (for instructor views)
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_time 
  ON problem_submissions(assignment_id, submitted_at DESC) 
  WHERE assignment_id IS NOT NULL;

-- Index for filtering by status (for analytics and reporting)
CREATE INDEX IF NOT EXISTS idx_submissions_status 
  ON problem_submissions(status);

-- Composite index for student performance queries
CREATE INDEX IF NOT EXISTS idx_submissions_student_status_time 
  ON problem_submissions(student_id, status, submitted_at DESC);

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON COLUMN problem_submissions.score IS 
  'Percentage score (0-100) calculated as (earned_points / total_points) × 100';

COMMENT ON COLUMN problem_submissions.total_points IS 
  'Sum of all available points across all test cases for this problem';

COMMENT ON COLUMN problem_submissions.earned_points IS 
  'Sum of points earned from passed test cases';

COMMENT ON COLUMN problem_submissions.status IS 
  'Submission status: pending (not yet executed), passed (all tests passed), failed (no tests passed), partial (some tests passed), error (execution error)';

-- ============================================
-- Migration complete
-- ============================================
