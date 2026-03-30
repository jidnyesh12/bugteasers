-- ============================================
-- Migration 007: add assignment closure controls
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE assignments
      ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_closed_at
  ON assignments(closed_at)
  WHERE closed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_deadline_closed_at
  ON assignments(deadline, closed_at);

COMMENT ON COLUMN assignments.closed_at IS
  'Timestamp set by instructor to stop accepting assignment-scoped submissions. Null means submissions remain open.';
