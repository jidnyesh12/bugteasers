// Integration tests for code execution API routes

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as runPost } from "@/app/api/problems/[id]/run/route";
import { POST as submitPost } from "@/app/api/problems/[id]/submit/route";

// Mock NextAuth
vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth")>();
  return {
    ...actual,
    default: vi.fn(),
    getServerSession: vi.fn(),
  };
});

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock execution service
vi.mock("@/lib/execution", () => ({
  createExecutionService: vi.fn(),
}));

describe("POST /api/problems/[id]/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 when code is missing", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("code");
  });

  it("should return 400 when language is missing", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")' }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("language");
  });

  it("should return 400 when language is unsupported", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "ruby" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("language");
  });

  it("should return 200 with test results when execution succeeds", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "test-id" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "assignment_problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({ data: [{ id: "ap-1" }], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "classroom_assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue({
                  data: [{ classroom_id: "classroom-1" }],
                  error: null,
                }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue({
                  data: [{ id: "enrollment-1" }],
                  error: null,
                }),
            }),
          }),
        }),
      };
    });
    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const mockRunCode = vi.fn().mockResolvedValue({
      results: [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "hello",
          expectedOutput: "hello",
          pointsEarned: 10,
          pointsAvailable: 10,
        },
      ],
      score: {
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: mockRunCode,
      submitCode: vi.fn(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.score.status).toBe("passed");
    expect(mockRunCode).toHaveBeenCalledWith({
      code: 'print("hello")',
      language: "python",
      problemId: "test-id",
    });
  });

  it("should allow run requests even when assignmentId is provided for a closed assignment", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "test-id" },
                error: null,
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>;
    });

    const mockRunCode = vi.fn().mockResolvedValue({
      results: [],
      score: {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        status: "failed",
      },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: mockRunCode,
      submitCode: vi.fn(),
    });

    const response = await runPost(
      new NextRequest("http://localhost:3000/api/problems/test-id/run", {
        method: "POST",
        body: JSON.stringify({
          code: 'print("practice")',
          language: "python",
          assignmentId: "closed-assignment-id",
        }),
      }),
      { params: Promise.resolve({ id: "test-id" }) },
    );

    expect(response.status).toBe(200);
    expect(mockRunCode).toHaveBeenCalledWith({
      code: 'print("practice")',
      language: "python",
      problemId: "test-id",
    });
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalledWith("assignments");
  });

  it("should return 500 when execution service throws error", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockRunCode = vi
      .fn()
      .mockRejectedValue(new Error("Execution failed"));

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: mockRunCode,
      submitCode: vi.fn(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

describe("POST /api/problems/[id]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 when code is missing", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("code");
  });

  it("should return 400 when language is missing", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")' }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("language");
  });

  it("should return 400 when language is unsupported", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "ruby" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("language");
  });

  it("should return 200 with submission ID and results when execution succeeds", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { id: "test-id" }, error: null }),
            }),
          }),
        };
      }

      if (table === "assignment_problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({ data: [{ id: "ap-1" }], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "classroom_assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue({
                  data: [{ classroom_id: "classroom-1" }],
                  error: null,
                }),
            }),
          }),
        };
      }

      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({
                    data: [{ id: "enrollment-1" }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }

      if (table === "assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { closed_at: null }, error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });
    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const mockSubmitCode = vi.fn().mockResolvedValue({
      submissionId: "submission-123",
      results: [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "hello",
          expectedOutput: "hello",
          pointsEarned: 10,
          pointsAvailable: 10,
        },
      ],
      score: {
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: mockSubmitCode,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.submissionId).toBe("submission-123");
    expect(data.results).toHaveLength(1);
    expect(data.score.status).toBe("passed");
    expect(mockSubmitCode).toHaveBeenCalledWith(
      {
        code: 'print("hello")',
        language: "python",
        problemId: "test-id",
      },
      "user-1",
    );
  });

  it("should include assignmentId when provided", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { id: "test-id" }, error: null }),
            }),
          }),
        };
      }

      if (table === "assignment_problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({ data: [{ id: "ap-1" }], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "classroom_assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue({
                  data: [{ classroom_id: "classroom-1" }],
                  error: null,
                }),
            }),
          }),
        };
      }

      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({
                    data: [{ id: "enrollment-1" }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }

      if (table === "assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { closed_at: null }, error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });
    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const mockSubmitCode = vi.fn().mockResolvedValue({
      submissionId: "submission-123",
      results: [],
      score: {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        status: "passed",
      },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: mockSubmitCode,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({
          code: 'print("hello")',
          language: "python",
          assignmentId: "assignment-456",
        }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });

    expect(response.status).toBe(200);
    expect(mockSubmitCode).toHaveBeenCalledWith(
      {
        code: 'print("hello")',
        language: "python",
        problemId: "test-id",
        assignmentId: "assignment-456",
      },
      "user-1",
    );
  });

  it("should allow assignment submit when student is enrolled in one of multiple assigned classrooms", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { id: "test-id" }, error: null }),
            }),
          }),
        };
      }

      if (table === "assignment_problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({ data: [{ id: "ap-1" }], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "classroom_assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { classroom_id: "classroom-1" },
                  { classroom_id: "classroom-2" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi
              .fn()
              .mockImplementation((_field: string, classroomId: string) => ({
                eq: vi
                  .fn()
                  .mockImplementation(
                    (_studentField: string, studentId: string) => ({
                      limit: vi.fn().mockResolvedValue({
                        data:
                          classroomId === "classroom-2" &&
                          studentId === "user-1"
                            ? [{ id: "enrollment-1" }]
                            : [],
                        error: null,
                      }),
                    }),
                  ),
              })),
          }),
        };
      }

      if (table === "assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { closed_at: null }, error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const mockSubmitCode = vi.fn().mockResolvedValue({
      submissionId: "submission-123",
      results: [],
      score: {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        status: "passed",
      },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: mockSubmitCode,
    });

    const response = await submitPost(
      new NextRequest("http://localhost:3000/api/problems/test-id/submit", {
        method: "POST",
        body: JSON.stringify({
          code: 'print("hello")',
          language: "python",
          assignmentId: "assignment-456",
        }),
      }),
      { params: Promise.resolve({ id: "test-id" }) },
    );

    expect(response.status).toBe(200);
    expect(mockSubmitCode).toHaveBeenCalledTimes(1);
  });

  it("should return 403 when assignment is closed", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { id: "test-id" }, error: null }),
            }),
          }),
        };
      }

      if (table === "assignment_problems") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({ data: [{ id: "ap-1" }], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "classroom_assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue({
                  data: [{ classroom_id: "classroom-1" }],
                  error: null,
                }),
            }),
          }),
        };
      }

      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue({
                    data: [{ id: "enrollment-1" }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }

      if (table === "assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { closed_at: "2026-03-01T00:00:00.000Z" },
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const mockSubmitCode = vi.fn().mockResolvedValue({
      submissionId: "submission-123",
      results: [],
      score: {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        status: "failed",
      },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: mockSubmitCode,
    });

    const response = await submitPost(
      new NextRequest("http://localhost:3000/api/problems/test-id/submit", {
        method: "POST",
        body: JSON.stringify({
          code: 'print("hello")',
          language: "python",
          assignmentId: "assignment-456",
        }),
      }),
      { params: Promise.resolve({ id: "test-id" }) },
    );

    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("closed");
    expect(mockSubmitCode).not.toHaveBeenCalled();
  });

  it("should return 500 when execution service throws error", async () => {
    const { getServerSession } = await import("next-auth");
    const { createExecutionService } = await import("@/lib/execution");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockSubmitCode = vi
      .fn()
      .mockRejectedValue(new Error("Execution failed"));

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: mockSubmitCode,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

// Additional test cases for edge cases and missing coverage

describe("POST /api/problems/[id]/run - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when code is empty string", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: "", language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("code");
  });

  it("should return 400 when code is only whitespace", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: "   \n  \t  ", language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("code");
  });

  it("should return 400 when request body is invalid JSON", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: "invalid json {",
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("JSON");
  });

  it("should return 404 when problem does not exist", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const request = new NextRequest(
      "http://localhost:3000/api/problems/nonexistent/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Problem not found");
  });

  it("should return 401 when session exists but user.id is missing", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: "test@example.com", role: "student" } as unknown as Record<
        string,
        unknown
      >,
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/run",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await runPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});

describe("POST /api/problems/[id]/submit - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when code is empty string", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: "", language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("code");
  });

  it("should return 400 when code is only whitespace", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: "   \n  \t  ", language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("code");
  });

  it("should return 400 when request body is invalid JSON", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: "invalid json {",
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("JSON");
  });

  it("should return 404 when problem does not exist", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    vi.mocked(supabase.from).mockImplementation(
      mockFrom as unknown as typeof supabase.from,
    );

    const request = new NextRequest(
      "http://localhost:3000/api/problems/nonexistent/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Problem not found");
  });

  it("should return 400 when assignmentId is not a string", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "student" },
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({
          code: 'print("hello")',
          language: "python",
          assignmentId: 123,
        }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("assignmentId");
  });

  it("should return 401 when session exists but user.id is missing", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: "test@example.com", role: "student" } as unknown as Record<
        string,
        unknown
      >,
      expires: "2024-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/problems/test-id/submit",
      {
        method: "POST",
        body: JSON.stringify({ code: 'print("hello")', language: "python" }),
      },
    );

    const response = await submitPost(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
