-- Assignment System Database Schema (Updated for 'users' table)
-- Run this in your Supabase SQL Editor

-- ============================================
-- Ensure 'users' table has the role column
-- ============================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role text check (role in ('student', 'instructor')) default 'student';
    END IF;
END $$;

-- ============================================
-- Table: assignments
-- Stores assignment details created by instructors
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);

-- ============================================
-- Table: assignment_problems
-- Links problems to assignments (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, problem_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignment_problems_assignment ON assignment_problems(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_problems_problem ON assignment_problems(problem_id);

-- ============================================
-- Table: classroom_assignments
-- Links assignments to classrooms (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, assignment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classroom_assignments_classroom ON classroom_assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_assignments_assignment ON classroom_assignments(assignment_id);

-- ============================================
-- Table: classroom_students
-- Tracks student enrollment in classrooms
-- ============================================
CREATE TABLE IF NOT EXISTS classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom ON classroom_students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_student ON classroom_students(student_id);

-- ============================================
-- Table: problem_submissions (for future use)
-- Tracks student problem attempts and results
-- ============================================
CREATE TABLE IF NOT EXISTS problem_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed')),
  test_results JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_student ON problem_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON problem_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON problem_submissions(assignment_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: assignments
-- ============================================

-- Instructors can view their own assignments
DROP POLICY IF EXISTS "Instructors can view own assignments" ON assignments;
CREATE POLICY "Instructors can view own assignments"
  ON assignments FOR SELECT
  USING (
    auth.uid() = created_by
  );

-- Instructors can create assignments
DROP POLICY IF EXISTS "Instructors can create assignments" ON assignments;
CREATE POLICY "Instructors can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'instructor')
  );

-- Instructors can update their own assignments
DROP POLICY IF EXISTS "Instructors can update own assignments" ON assignments;
CREATE POLICY "Instructors can update own assignments"
  ON assignments FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Instructors can delete their own assignments
DROP POLICY IF EXISTS "Instructors can delete own assignments" ON assignments;
CREATE POLICY "Instructors can delete own assignments"
  ON assignments FOR DELETE
  USING (auth.uid() = created_by);

-- Students can view assignments in their classrooms
DROP POLICY IF EXISTS "Students can view classroom assignments" ON assignments;
CREATE POLICY "Students can view classroom assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_assignments ca
      JOIN classroom_students cs ON cs.classroom_id = ca.classroom_id
      WHERE ca.assignment_id = assignments.id
        AND cs.student_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: assignment_problems
-- ============================================

-- Instructors can manage problems in their assignments
DROP POLICY IF EXISTS "Instructors can manage assignment problems" ON assignment_problems;
CREATE POLICY "Instructors can manage assignment problems"
  ON assignment_problems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_problems.assignment_id
        AND assignments.created_by = auth.uid()
    )
  );

-- Students can view problems in assignments they have access to
DROP POLICY IF EXISTS "Students can view assignment problems" ON assignment_problems;
CREATE POLICY "Students can view assignment problems"
  ON assignment_problems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_assignments ca
      JOIN classroom_students cs ON cs.classroom_id = ca.classroom_id
      WHERE ca.assignment_id = assignment_problems.assignment_id
        AND cs.student_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: classroom_assignments
-- ============================================

-- Instructors can manage assignments in their classrooms
DROP POLICY IF EXISTS "Instructors can manage classroom assignments" ON classroom_assignments;
CREATE POLICY "Instructors can manage classroom assignments"
  ON classroom_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classrooms
      WHERE classrooms.id = classroom_assignments.classroom_id
        AND classrooms.instructor_id = auth.uid()
    )
  );

-- Students can view assignments in their classrooms
DROP POLICY IF EXISTS "Students can view classroom assignments" ON classroom_assignments;
CREATE POLICY "Students can view classroom assignments"
  ON classroom_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students
      WHERE classroom_students.classroom_id = classroom_assignments.classroom_id
        AND classroom_students.student_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: classroom_students
-- ============================================

-- Instructors can view students in their classrooms
DROP POLICY IF EXISTS "Instructors can view classroom students" ON classroom_students;
CREATE POLICY "Instructors can view classroom students"
  ON classroom_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classrooms
      WHERE classrooms.id = classroom_students.classroom_id
        AND classrooms.instructor_id = auth.uid()
    )
  );

-- Students can view their own enrollments
DROP POLICY IF EXISTS "Students can view own enrollments" ON classroom_students;
CREATE POLICY "Students can view own enrollments"
  ON classroom_students FOR SELECT
  USING (auth.uid() = student_id);

-- Students can join classrooms
DROP POLICY IF EXISTS "Students can join classrooms" ON classroom_students;
CREATE POLICY "Students can join classrooms"
  ON classroom_students FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

-- Instructors can remove students from their classrooms
DROP POLICY IF EXISTS "Instructors can remove students" ON classroom_students;
CREATE POLICY "Instructors can remove students"
  ON classroom_students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classrooms
      WHERE classrooms.id = classroom_students.classroom_id
        AND classrooms.instructor_id = auth.uid()
    )
  );

-- Students can leave classrooms
DROP POLICY IF EXISTS "Students can leave classrooms" ON classroom_students;
CREATE POLICY "Students can leave classrooms"
  ON classroom_students FOR DELETE
  USING (auth.uid() = student_id);

-- ============================================
-- RLS Policies: problem_submissions
-- ============================================

-- Students can view their own submissions
DROP POLICY IF EXISTS "Students can view own submissions" ON problem_submissions;
CREATE POLICY "Students can view own submissions"
  ON problem_submissions FOR SELECT
  USING (auth.uid() = student_id);

-- Students can create submissions
DROP POLICY IF EXISTS "Students can create submissions" ON problem_submissions;
CREATE POLICY "Students can create submissions"
  ON problem_submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Instructors can view submissions for their assignments
DROP POLICY IF EXISTS "Instructors can view assignment submissions" ON problem_submissions;
CREATE POLICY "Instructors can view assignment submissions"
  ON problem_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = problem_submissions.assignment_id
        AND assignments.created_by = auth.uid()
    )
  );

-- ============================================
-- Triggers for updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on assignments table
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Done!
-- ============================================
