-- ============================================
-- Migration: Drop problems.starter_code
-- Description: Starter code is now frontend-owned and no longer stored from AI output
-- ============================================

ALTER TABLE IF EXISTS public.problems
  DROP COLUMN IF EXISTS starter_code;
