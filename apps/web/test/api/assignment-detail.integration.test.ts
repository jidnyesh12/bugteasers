import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getAssignmentDetail } from "@/app/api/assignments/[id]/route";

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth")>();
  return {
    ...actual,
    default: vi.fn(),
    getServerSession: vi.fn(),
  };
});

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("Assignment detail API access checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows student when enrolled in one of multiple assigned classrooms", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "a-1",
                  created_by: "instructor-1",
                  assignment_problems: [
                    {
                      order_index: 0,
                      problems: {
                        id: "p-1",
                        title: "Two Sum",
                        difficulty: "easy",
                        tags: ["array"],
                      },
                    },
                  ],
                },
                error: null,
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
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
        } as unknown as ReturnType<typeof supabase.from>;
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
                          studentId === "student-1"
                            ? [{ id: "enrollment-1" }]
                            : [],
                        error: null,
                      }),
                    }),
                  ),
              })),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await getAssignmentDetail(
      new NextRequest("http://localhost:3000/api/assignments/a-1", {
        method: "GET",
      }),
      { params: Promise.resolve({ id: "a-1" }) },
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.assignment.id).toBe("a-1");
    expect(data.assignment.problems).toHaveLength(1);
  });

  it("returns 403 when student is not enrolled in any assigned classroom", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "assignments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "a-1",
                  created_by: "instructor-1",
                  assignment_problems: [],
                },
                error: null,
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
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
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await getAssignmentDetail(
      new NextRequest("http://localhost:3000/api/assignments/a-1", {
        method: "GET",
      }),
      { params: Promise.resolve({ id: "a-1" }) },
    );

    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe("Access denied");
  });
});
