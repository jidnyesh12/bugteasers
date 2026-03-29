export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },
  classrooms: {
    all: ['classrooms'] as const,
    detail: (classroomId: string) => ['classrooms', 'detail', classroomId] as const,
  },
  assignments: {
    all: ['assignments'] as const,
    detail: (assignmentId: string) => ['assignments', 'detail', assignmentId] as const,
  },
  problems: {
    all: ['problems'] as const,
    detail: (problemId: string) => ['problems', 'detail', problemId] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    byProblem: (problemId: string) => ['submissions', 'problem', problemId] as const,
  },
} as const;
