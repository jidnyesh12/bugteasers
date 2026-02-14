// ============================================================
// Core Types for AI Coding Tutor Platform
// ============================================================

export type UserRole = 'student' | 'instructor' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  bio: string | null
  institution: string | null
  github_url: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  theme: 'dark' | 'light' | 'system'
  language: string
  notifications_enabled: boolean
  editor_settings: EditorSettings
  created_at: string
  updated_at: string
}

export interface EditorSettings {
  font_size: number
  tab_size: number
  word_wrap: boolean
  minimap: boolean
  line_numbers: boolean
  theme: string
}

// ============================================================
// Auth Types
// ============================================================

export interface AuthState {
  user: import('@supabase/supabase-js').User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
  role: UserRole
}

export interface SignInData {
  email: string
  password: string
}

// ============================================================
// Future Module Types (Stubs for future-proofing)
// ============================================================

export type Difficulty = 'easy' | 'medium' | 'hard'
export type SubmissionStatus = 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compilation_error'
export type ProgrammingLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'c'

// Problem stub — will be fully implemented in Module B
export interface ProblemStub {
  id: string
  title: string
  difficulty: Difficulty
  created_by: string
}

// Submission stub — will be fully implemented in Module C
export interface SubmissionStub {
  id: string
  problem_id: string
  user_id: string
  status: SubmissionStatus
  language: ProgrammingLanguage
}
