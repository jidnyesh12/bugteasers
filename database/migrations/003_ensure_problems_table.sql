-- Fix Problems Table Schema Mismatch
-- Run this in Supabase SQL Editor

-- 1. Alter problems table to match code expectations where possible, or cast types
-- The user has:
-- difficulty: difficulty_level (enum)
-- tags: _text (text[])
-- hints: jsonb
-- examples: jsonb
-- starter_code: text
-- solution_code: text

-- My code expects:
-- difficulty: 'easy' | 'medium' | 'hard' (string) -> Enum is fine if values match
-- tags: text[] -> Matches _text
-- hints: string[] -> JSONB in DB. API needs to handle this.
-- starter_code: JSONB -> TEXT in DB. API needs to handle this.

-- CRITICAL: The API might be failing because it tries to cast types or keys don't match.
-- But the 500 error "Failed to load problem" usually means the QUERY failed.

-- Let's ensure the RLS policies are correct for the existing table.

-- Enable RLS (idempotent)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Re-create policies using the correct columns (created_by is UUID, correct)

DROP POLICY IF EXISTS "Public view problems" ON problems;
CREATE POLICY "Public view problems"
  ON problems FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Instructors can create problems" ON problems;
CREATE POLICY "Instructors can create problems"
  ON problems FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'instructor')
  );

DROP POLICY IF EXISTS "Instructors can update own problems" ON problems;
CREATE POLICY "Instructors can update own problems"
  ON problems FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Instructors can delete own problems" ON problems;
CREATE POLICY "Instructors can delete own problems"
  ON problems FOR DELETE
  USING (auth.uid() = created_by);

-- IMPORTANT: The API code needs to be updated to handle the schema differences.
-- 1. `starter_code` is TEXT in DB, but `GeneratedProblem` type has it as Record<string, string>.
-- 2. `hints` is JSONB in DB, code likely expects string[].
-- 3. `difficulty` is an enum type.

-- This SQL script only fixes policies. I will update the API code next.
