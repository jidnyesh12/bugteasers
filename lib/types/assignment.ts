import { Classroom } from '../types'

export interface Assignment {
  id: string
  title: string
  description?: string
  created_by: string
  deadline: string
  created_at: string
  updated_at: string
}

export interface AssignmentProblem {
  id: string
  assignment_id: string
  problem_id: string
  order_index: number
  created_at: string
}

export interface ClassroomAssignment {
  id: string
  classroom_id: string
  assignment_id: string
  assigned_at: string
}

export interface ClassroomStudent {
  id: string
  classroom_id: string
  student_id: string
  joined_at: string
}

export interface ProblemSubmission {
  id: string
  student_id: string
  problem_id: string
  assignment_id?: string
  code: string
  language: string
  status: 'pending' | 'passed' | 'failed'
  test_results?: unknown
  submitted_at: string
}

// Extended types with joined data
export interface AssignmentWithDetails extends Assignment {
  problem_count?: number
  classroom_count?: number
  problems?: Array<{
    id: string
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    order_index: number
  }>
}

export interface ClassroomWithStudentCount extends Classroom {
  student_count?: number
}

export interface StudentEnrollment extends ClassroomStudent {
  classroom?: {
    id: string
    name: string
    join_code: string
    created_by: string
    instructor_name?: string
  }
}
