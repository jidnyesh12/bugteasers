-- 1. UPDATE SUBMISSIONS TABLE
-- We add columns to store the "DNA" (fingerprint) and the "Verdict" (scores)
ALTER TABLE public.problem_submissions 
ADD COLUMN IF NOT EXISTS fingerprint jsonb,
ADD COLUMN IF NOT EXISTS max_plagiarism_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_match_submission_id uuid REFERENCES public.problem_submissions(id),
ADD COLUMN IF NOT EXISTS is_ai_match boolean DEFAULT false;

-- 2. CREATE TELEMETRY TABLE
-- This acts as the "Black Box" recorder for student behavior
CREATE TABLE IF NOT EXISTS public.telemetry (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id),
  problem_id uuid NOT NULL REFERENCES public.problems(id),
  assignment_id uuid REFERENCES public.assignments(id),
  events jsonb NOT NULL DEFAULT '{
    "summary": {
      "paste_count": 0,
      "total_pasted_chars": 0,
      "tab_switch_count": 0,
      "backspace_count": 0,
      "total_active_time_ms": 0,
      "total_idle_time_ms": 0,
      "run_count": 0
    },
    "intervals": [], 
    "history": []   
  }'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT telemetry_pkey PRIMARY KEY (id),
  CONSTRAINT unique_student_problem_assignment UNIQUE (student_id, problem_id, assignment_id)
);

-- 3. CREATE PLAGIARISM MATCHES TABLE
-- This stores the detailed "Evidence" for N x N comparisons
CREATE TABLE IF NOT EXISTS public.plagiarism_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id),
  submission_a_id uuid NOT NULL REFERENCES public.problem_submissions(id),
  submission_b_id uuid NOT NULL REFERENCES public.problem_submissions(id),
  similarity_score numeric NOT NULL,
  match_metadata jsonb, -- Stores specific line/token matches
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plagiarism_matches_pkey PRIMARY KEY (id)
);

-- 4. ADD INDEXES FOR PERFORMANCE
-- These are CRITICAL for making the N x N worker queries fast
CREATE INDEX IF NOT EXISTS idx_submissions_fingerprint ON public.problem_submissions USING gin (fingerprint);
CREATE INDEX IF NOT EXISTS idx_telemetry_lookup ON public.telemetry (student_id, problem_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_assignment ON public.plagiarism_matches (assignment_id);