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
}
