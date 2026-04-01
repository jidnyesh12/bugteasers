-- ============================================
-- Migration: Enforce minimum template JSON shape on test_cases
-- Description: Adds DB-level guardrails for input_template structure
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'test_cases' AND column_name = 'input_template'
  ) THEN
    ALTER TABLE public.test_cases ADD COLUMN input_template JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'chk_test_cases_input_template_shape'
      AND n.nspname = 'public'
      AND t.relname = 'test_cases'
  ) THEN
    ALTER TABLE public.test_cases
      ADD CONSTRAINT chk_test_cases_input_template_shape
      CHECK (
        input_template IS NULL
        OR (
          jsonb_typeof(input_template) = 'object'
          AND (
            NOT (input_template ? 'version')
            OR input_template->>'version' = '1'
          )
          AND (
            NOT (input_template ? 'seed')
            OR jsonb_typeof(input_template->'seed') = 'string'
          )
          AND (input_template ? 'variables')
          AND jsonb_typeof(input_template->'variables') = 'object'
          AND input_template->'variables' <> '{}'::jsonb
          AND (input_template ? 'output')
          AND jsonb_typeof(input_template->'output') = 'array'
          AND jsonb_array_length(input_template->'output') > 0
        )
      );
  END IF;
END $$;
