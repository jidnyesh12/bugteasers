-- ============================================================
-- AI Coding Tutor — Module A: Database Schema
-- Future-proof design for all planned modules
-- ============================================================

-- 1. Create custom enum types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM (
    'pending', 'running', 'accepted', 'wrong_answer',
    'time_limit', 'runtime_error', 'compilation_error'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE programming_language AS ENUM (
    'python', 'javascript', 'typescript', 'java', 'cpp', 'c'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- 2. Profiles table (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'student',
  bio         TEXT,
  institution TEXT,
  github_url  TEXT,
  website_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based queries (future: analytics, class listing)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow instructors to view student profiles (future: class management)
DROP POLICY IF EXISTS "Instructors can view all profiles" ON public.profiles;
CREATE POLICY "Instructors can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'instructor'
    )
  );

-- Allow admins full access
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- 3. User settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id               UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme                 TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  language              TEXT NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  editor_settings       JSONB NOT NULL DEFAULT '{
    "font_size": 14,
    "tab_size": 2,
    "word_wrap": true,
    "minimap": false,
    "line_numbers": true,
    "theme": "vs-dark"
  }'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 4. Auto-create profile + settings on signup (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role user_role := 'student';
  _role_text TEXT;
BEGIN
  -- Safely extract and cast role
  _role_text := NEW.raw_user_meta_data->>'role';
  IF _role_text IN ('student', 'instructor', 'admin') THEN
    _role := _role_text::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 6. Storage bucket for avatars
-- ============================================================
-- Note: Run this in the Supabase Dashboard SQL editor or ensure
-- the storage extension is enabled:
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- Module B: Classroom Management
-- ============================================================

-- 7. Classrooms table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classrooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  join_code   TEXT UNIQUE NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  max_students INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classrooms_instructor ON public.classrooms(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_join_code ON public.classrooms(join_code);
CREATE INDEX IF NOT EXISTS idx_classrooms_active ON public.classrooms(is_active);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Instructors can manage their own classrooms" ON public.classrooms;
CREATE POLICY "Instructors can manage their own classrooms"
  ON public.classrooms FOR ALL
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Students can view classrooms they're enrolled in" ON public.classrooms;
CREATE POLICY "Students can view classrooms they're enrolled in"
  ON public.classrooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.classroom_id = id AND e.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to classrooms" ON public.classrooms;
CREATE POLICY "Admins have full access to classrooms"
  ON public.classrooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS classrooms_updated_at ON public.classrooms;
CREATE TRIGGER classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 8. Enrollments table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_classroom ON public.enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can enroll themselves" ON public.enrollments;
CREATE POLICY "Students can enroll themselves"
  ON public.enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view enrollments in their classrooms" ON public.enrollments;
CREATE POLICY "Instructors can view enrollments in their classrooms"
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can manage enrollments in their classrooms" ON public.enrollments;
CREATE POLICY "Instructors can manage enrollments in their classrooms"
  ON public.enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to enrollments" ON public.enrollments;
CREATE POLICY "Admins have full access to enrollments"
  ON public.enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ============================================================
-- Module C: Problems & Test Cases
-- ============================================================

-- 9. Problems table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.problems (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  difficulty    difficulty_level NOT NULL DEFAULT 'easy',
  tags          TEXT[],
  constraints   TEXT,
  examples      JSONB,
  hints         JSONB,
  time_limit    INTEGER NOT NULL DEFAULT 2000,
  memory_limit  INTEGER NOT NULL DEFAULT 256,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  starter_code  TEXT,
  solution_code TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problems_created_by ON public.problems(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_usage_count ON public.problems(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON public.problems USING GIN(tags);

-- Enable RLS
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Everyone can view problems" ON public.problems;
CREATE POLICY "Everyone can view problems"
  ON public.problems FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Instructors can create problems" ON public.problems;
CREATE POLICY "Instructors can create problems"
  ON public.problems FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Instructors can update their own problems" ON public.problems;
CREATE POLICY "Instructors can update their own problems"
  ON public.problems FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Instructors can delete their own problems" ON public.problems;
CREATE POLICY "Instructors can delete their own problems"
  ON public.problems FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins have full access to problems" ON public.problems;
CREATE POLICY "Admins have full access to problems"
  ON public.problems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS problems_updated_at ON public.problems;
CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 10. Test Cases table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.test_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id      UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  input_data      TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample       BOOLEAN NOT NULL DEFAULT false,
  points          INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_sample ON public.test_cases(is_sample);

-- Enable RLS
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can view sample test cases" ON public.test_cases;
CREATE POLICY "Students can view sample test cases"
  ON public.test_cases FOR SELECT
  USING (is_sample = true);

DROP POLICY IF EXISTS "Instructors can view all test cases for their problems" ON public.test_cases;
CREATE POLICY "Instructors can view all test cases for their problems"
  ON public.test_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_id AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can manage test cases for their problems" ON public.test_cases;
CREATE POLICY "Instructors can manage test cases for their problems"
  ON public.test_cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_id AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_id AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to test cases" ON public.test_cases;
CREATE POLICY "Admins have full access to test cases"
  ON public.test_cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ============================================================
-- Module D: Assignments
-- ============================================================

-- Add assignment_status enum if not exists
DO $ BEGIN
  CREATE TYPE assignment_status AS ENUM ('active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $;

-- 11. Assignments table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  problem_id   UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  due_date     TIMESTAMPTZ,
  status       assignment_status NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, problem_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_problem ON public.assignments(problem_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can view assignments in their classrooms" ON public.assignments;
CREATE POLICY "Students can view assignments in their classrooms"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.classroom_id = assignments.classroom_id AND e.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can manage assignments in their classrooms" ON public.assignments;
CREATE POLICY "Instructors can manage assignments in their classrooms"
  ON public.assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
CREATE POLICY "Admins have full access to assignments"
  ON public.assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS assignments_updated_at ON public.assignments;
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- Module E: Submissions & Execution
-- ============================================================

-- 12. Submissions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_id      UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  code_content       TEXT NOT NULL,
  language           programming_language NOT NULL,
  status             submission_status NOT NULL DEFAULT 'pending',
  execution_time     FLOAT,
  memory_used        INTEGER,
  test_cases_passed  INTEGER DEFAULT 0,
  total_test_cases   INTEGER DEFAULT 0,
  error_message      TEXT,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions"
  ON public.submissions FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create their own submissions" ON public.submissions;
CREATE POLICY "Students can create their own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view submissions in their classrooms" ON public.submissions;
CREATE POLICY "Instructors can view submissions in their classrooms"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classrooms c ON c.id = a.classroom_id
      WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to submissions" ON public.submissions;
CREATE POLICY "Admins have full access to submissions"
  ON public.submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ============================================================
-- Module F: AI Intelligence
-- ============================================================

-- Add feedback_type enum if not exists
DO $ BEGIN
  CREATE TYPE feedback_type AS ENUM ('debugging', 'optimization');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $;

-- 13. AI Feedback Logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_feedback_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  feedback_type    feedback_type NOT NULL,
  message          TEXT NOT NULL,
  complexity_score TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_feedback_submission ON public.ai_feedback_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_feedback_logs(feedback_type);

-- Enable RLS
ALTER TABLE public.ai_feedback_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can view feedback for their submissions" ON public.ai_feedback_logs;
CREATE POLICY "Students can view feedback for their submissions"
  ON public.ai_feedback_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id AND s.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create feedback logs" ON public.ai_feedback_logs;
CREATE POLICY "System can create feedback logs"
  ON public.ai_feedback_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Instructors can view feedback in their classrooms" ON public.ai_feedback_logs;
CREATE POLICY "Instructors can view feedback in their classrooms"
  ON public.ai_feedback_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.classrooms c ON c.id = a.classroom_id
      WHERE s.id = submission_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to feedback logs" ON public.ai_feedback_logs;
CREATE POLICY "Admins have full access to feedback logs"
  ON public.ai_feedback_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- 14. Plagiarism Flags table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plagiarism_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id_a   UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  submission_id_b   UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  similarity_score  FLOAT NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plagiarism_submission_a ON public.plagiarism_flags(submission_id_a);
CREATE INDEX IF NOT EXISTS idx_plagiarism_submission_b ON public.plagiarism_flags(submission_id_b);
CREATE INDEX IF NOT EXISTS idx_plagiarism_score ON public.plagiarism_flags(similarity_score DESC);

-- Enable RLS
ALTER TABLE public.plagiarism_flags ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Instructors can view plagiarism flags in their classrooms" ON public.plagiarism_flags;
CREATE POLICY "Instructors can view plagiarism flags in their classrooms"
  ON public.plagiarism_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.classrooms c ON c.id = a.classroom_id
      WHERE (s.id = submission_id_a OR s.id = submission_id_b)
        AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create plagiarism flags" ON public.plagiarism_flags;
CREATE POLICY "System can create plagiarism flags"
  ON public.plagiarism_flags FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to plagiarism flags" ON public.plagiarism_flags;
CREATE POLICY "Admins have full access to plagiarism flags"
  ON public.plagiarism_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ============================================================
-- Module G: Student Progress Tracking
-- ============================================================

-- Add progress_status enum if not exists
DO $ BEGIN
  CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'solved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $;

-- 15. Student Progress table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id          UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  best_submission_id  UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  status              progress_status NOT NULL DEFAULT 'not_started',
  attempts            INTEGER NOT NULL DEFAULT 0,
  first_solved_at     TIMESTAMPTZ,
  last_attempt_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, problem_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_problem ON public.student_progress(problem_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_status ON public.student_progress(status);

-- Enable RLS
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can view their own progress" ON public.student_progress;
CREATE POLICY "Students can view their own progress"
  ON public.student_progress FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own progress" ON public.student_progress;
CREATE POLICY "Students can update their own progress"
  ON public.student_progress FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view progress of students in their classrooms" ON public.student_progress;
CREATE POLICY "Instructors can view progress of students in their classrooms"
  ON public.student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classrooms c ON c.id = e.classroom_id
      WHERE e.student_id = student_progress.student_id
        AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to student progress" ON public.student_progress;
CREATE POLICY "Admins have full access to student progress"
  ON public.student_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS student_progress_updated_at ON public.student_progress;
CREATE TRIGGER student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to generate unique join codes for classrooms
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$ LANGUAGE plpgsql;

-- Function to auto-update problem usage count
CREATE OR REPLACE FUNCTION public.increment_problem_usage()
RETURNS TRIGGER AS $
BEGIN
  UPDATE public.problems
  SET usage_count = usage_count + 1
  WHERE id = NEW.problem_id;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_usage_on_assignment ON public.assignments;
CREATE TRIGGER increment_usage_on_assignment
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.increment_problem_usage();

-- Function to auto-update student progress on submission
CREATE OR REPLACE FUNCTION public.update_student_progress_on_submission()
RETURNS TRIGGER AS $
DECLARE
  _problem_id UUID;
  _is_solved BOOLEAN;
BEGIN
  -- Get problem_id from assignment
  SELECT a.problem_id INTO _problem_id
  FROM public.assignments a
  WHERE a.id = NEW.assignment_id;

  -- Check if submission is accepted
  _is_solved := (NEW.status = 'accepted');

  -- Insert or update student progress
  INSERT INTO public.student_progress (
    student_id,
    problem_id,
    best_submission_id,
    status,
    attempts,
    first_solved_at,
    last_attempt_at
  )
  VALUES (
    NEW.student_id,
    _problem_id,
    CASE WHEN _is_solved THEN NEW.id ELSE NULL END,
    CASE WHEN _is_solved THEN 'solved'::progress_status ELSE 'in_progress'::progress_status END,
    1,
    CASE WHEN _is_solved THEN NEW.submitted_at ELSE NULL END,
    NEW.submitted_at
  )
  ON CONFLICT (student_id, problem_id)
  DO UPDATE SET
    attempts = student_progress.attempts + 1,
    status = CASE
      WHEN _is_solved THEN 'solved'::progress_status
      ELSE student_progress.status
    END,
    best_submission_id = CASE
      WHEN _is_solved AND student_progress.status != 'solved'::progress_status THEN NEW.id
      ELSE student_progress.best_submission_id
    END,
    first_solved_at = CASE
      WHEN _is_solved AND student_progress.first_solved_at IS NULL THEN NEW.submitted_at
      ELSE student_progress.first_solved_at
    END,
    last_attempt_at = NEW.submitted_at,
    updated_at = now();

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_progress_on_submission ON public.submissions;
CREATE TRIGGER update_progress_on_submission
  AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_student_progress_on_submission();


-- ============================================================
-- End of Schema
-- ============================================================
