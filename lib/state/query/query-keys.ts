export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
    profile: (userId: string) => ["auth", "profile", userId] as const,
  },
  dashboard: {
    instructorStats: ["dashboard", "instructor", "stats"] as const,
    studentStats: ["dashboard", "student", "stats"] as const,
  },
  classrooms: {
    all: ["classrooms"] as const,
    instructorMine: ["classrooms", "instructor", "mine"] as const,
    studentMine: ["classrooms", "student", "mine"] as const,
    detail: (classroomId: string) =>
      ["classrooms", "detail", classroomId] as const,
    students: (classroomId: string) =>
      ["classrooms", "detail", classroomId, "students"] as const,
    assignments: (classroomId: string) =>
      ["classrooms", "detail", classroomId, "assignments"] as const,
  },
  assignments: {
    all: ["assignments"] as const,
    mine: ["assignments", "mine"] as const,
    detail: (assignmentId: string) =>
      ["assignments", "detail", assignmentId] as const,
  },
  problems: {
    all: ["problems"] as const,
    mine: ["problems", "mine"] as const,
    detail: (problemId: string) => ["problems", "detail", problemId] as const,
  },
  submissions: {
    all: ["submissions"] as const,
    byProblem: (problemId: string) =>
      ["submissions", "problem", problemId] as const,
    assignmentSummary: (assignmentId: string) =>
      ["submissions", "assignment", assignmentId, "summary"] as const,
    history: (problemId: string, assignmentId?: string) =>
      [
        "submissions",
        "problem",
        problemId,
        "assignment",
        assignmentId ?? null,
      ] as const,
  },
} as const;
