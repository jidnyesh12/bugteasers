import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as listClassroomsGet,
  POST as createClassroomPost,
} from "@/app/api/classrooms/route";
import { POST as joinClassroomPost } from "@/app/api/classrooms/join/route";

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

describe("Classrooms API lifecycle checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects classroom creation for non-instructors", async () => {
    const { getServerSession } = await import("next-auth");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    const response = await createClassroomPost(
      new NextRequest("http://localhost:3000/api/classrooms", {
        method: "POST",
        body: JSON.stringify({ name: "DSA" }),
      }),
    );

    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toContain("Only instructors");
  });

  it("returns 401 for unauthenticated classroom listing request", async () => {
    const { getServerSession } = await import("next-auth");

    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listClassroomsGet();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("lists classrooms for instructors based on ownership", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "instructor-1",
        role: "instructor",
        email: "inst@example.com",
      },
      expires: "2099-01-01",
    });

    const orderMock = vi.fn().mockResolvedValue({
      data: [{ id: "classroom-1", name: "DSA", instructor_id: "instructor-1" }],
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classrooms") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await listClassroomsGet();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.classrooms).toHaveLength(1);
    expect(data.classrooms[0].instructor_id).toBe("instructor-1");
  });

  it("lists classrooms for students based on enrollment", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "enroll-1",
          joined_at: "2026-03-01T00:00:00.000Z",
          classroom: {
            id: "classroom-1",
            name: "DSA",
            instructor_id: "instructor-1",
          },
        },
      ],
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await listClassroomsGet();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.classrooms).toHaveLength(1);
    expect(data.classrooms[0].classroom.id).toBe("classroom-1");
  });

  it("normalizes classroom relation arrays for student enrollments", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "enroll-1",
          joined_at: "2026-03-01T00:00:00.000Z",
          classroom: [
            {
              id: "classroom-1",
              name: "DSA",
              instructor_id: "instructor-1",
            },
          ],
        },
      ],
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await listClassroomsGet();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.classrooms).toHaveLength(1);
    expect(Array.isArray(data.classrooms[0].classroom)).toBe(false);
    expect(data.classrooms[0].classroom.id).toBe("classroom-1");
  });

  it("retries join code generation on collision and creates classroom", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "instructor-1",
        role: "instructor",
        email: "inst@example.com",
      },
      expires: "2099-01-01",
    });

    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.111111)
      .mockReturnValueOnce(0.222222);

    const collisionLimit = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "existing-code" }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const selectForCollision = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: collisionLimit,
      }),
    });

    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: "classroom-1",
        name: "DSA Lab",
        instructor_id: "instructor-1",
        join_code: "UNIQUE1",
      },
      error: null,
    });

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: insertSingle,
      }),
    });

    const classroomsFrom = {
      select: selectForCollision,
      insert: insertMock,
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classrooms") {
        return classroomsFrom as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await createClassroomPost(
      new NextRequest("http://localhost:3000/api/classrooms", {
        method: "POST",
        body: JSON.stringify({ name: "DSA Lab" }),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(collisionLimit).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(data.classroom.id).toBe("classroom-1");

    randomSpy.mockRestore();
  });

  it("rejects classroom join for non-students", async () => {
    const { getServerSession } = await import("next-auth");

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "instructor-1",
        role: "instructor",
        email: "inst@example.com",
      },
      expires: "2099-01-01",
    });

    const response = await joinClassroomPost(
      new NextRequest("http://localhost:3000/api/classrooms/join", {
        method: "POST",
        body: JSON.stringify({ join_code: "ABC123" }),
      }),
    );

    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toContain("Only students");
  });

  it("joins classroom for student when code is valid and enrollment does not exist", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    const classroomsSingle = vi.fn().mockResolvedValue({
      data: { id: "classroom-1", name: "DSA Lab" },
      error: null,
    });

    const classroomStudentsSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });
    const classroomStudentsInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classrooms") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: classroomsSingle,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: classroomStudentsSingle,
              }),
            }),
          }),
          insert: classroomStudentsInsert,
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await joinClassroomPost(
      new NextRequest("http://localhost:3000/api/classrooms/join", {
        method: "POST",
        body: JSON.stringify({ join_code: "ABC123" }),
      }),
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(classroomStudentsInsert).toHaveBeenCalledTimes(1);
  });
});
