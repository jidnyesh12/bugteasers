-- ============================================
-- Migration: Add template DSL support for test case inputs
-- Description: Stores compact, deterministic input templates for large stress tests
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'test_cases'
  ) THEN
    RAISE EXCEPTION 'public.test_cases does not exist. Run earlier schema migrations first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'test_cases' AND column_name = 'input_template'
  ) THEN
    ALTER TABLE public.test_cases ADD COLUMN input_template JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'test_cases' AND column_name = 'input_template'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_test_cases_input_template_gin
      ON public.test_cases USING GIN (input_template)
      WHERE input_template IS NOT NULL;
  END IF;
END $$;
