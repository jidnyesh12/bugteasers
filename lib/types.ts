export type UserRole = 'student' | 'instructor'

export interface UserProfile {
    id: string
    email: string
    full_name: string
    role: UserRole
    created_at: string
}

export interface Classroom {
    id: string
    name: string
    join_code: string
    instructor_id: string
    created_at: string
    classroom_students?: { count: number }[]
    classroom_assignments?: { count: number }[]
}

// Assignment system types
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
