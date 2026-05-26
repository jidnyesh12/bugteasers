-- ============================================
-- Hint Usage Tracking System
-- Tracks how many AI hints each student has used per problem
-- ============================================

-- Create hint usage tracking table
CREATE TABLE IF NOT EXISTS student_hint_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0 AND hints_used <= 5),
  last_hint_at TIMESTAMPTZ,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for practice mode (no assignment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hint_usage_unique_practice 
  ON student_hint_usage(student_id, problem_id) 
  WHERE assignment_id IS NULL;

-- Unique constraint for assignment mode
CREATE UNIQUE INDEX IF NOT EXISTS idx_hint_usage_unique_assignment 
  ON student_hint_usage(student_id, problem_id, assignment_id) 
  WHERE assignment_id IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hint_usage_student ON student_hint_usage(student_id);
CREATE INDEX IF NOT EXISTS idx_hint_usage_problem ON student_hint_usage(problem_id);
CREATE INDEX IF NOT EXISTS idx_hint_usage_assignment ON student_hint_usage(assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hint_usage_reset ON student_hint_usage(reset_at) WHERE reset_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hint_usage_last_hint ON student_hint_usage(last_hint_at);

-- Enable RLS
ALTER TABLE student_hint_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Students can view own hint usage" ON student_hint_usage;
CREATE POLICY "Students can view own hint usage"
  ON student_hint_usage FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own hint usage" ON student_hint_usage;
CREATE POLICY "Students can insert own hint usage"
  ON student_hint_usage FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own hint usage" ON student_hint_usage;
CREATE POLICY "Students can update own hint usage"
  ON student_hint_usage FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view assignment hint usage" ON student_hint_usage;
CREATE POLICY "Instructors can view assignment hint usage"
  ON student_hint_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_hint_usage.assignment_id
        AND assignments.created_by = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE student_hint_usage IS 'Tracks AI hint usage per student per problem with 24-hour reset capability';
COMMENT ON COLUMN student_hint_usage.hints_used IS 'Number of hints used (0-5, with 3 initial + 2 after reset)';
COMMENT ON COLUMN student_hint_usage.reset_at IS 'Timestamp when hints will reset (24 hours after using all 3)';
