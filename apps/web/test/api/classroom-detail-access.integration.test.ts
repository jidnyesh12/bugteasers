import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getClassroomDetail } from "@/app/api/classrooms/[id]/route";
import { GET as getClassroomStudents } from "@/app/api/classrooms/[id]/students/route";
import { GET as getClassroomAssignments } from "@/app/api/classrooms/[id]/assignments/route";

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

describe("Classroom detail access responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for non-enrolled student on classroom detail route", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classrooms") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "classroom-1", instructor_id: "instructor-1" },
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
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await getClassroomDetail(
      new NextRequest("http://localhost:3000/api/classrooms/classroom-1", {
        method: "GET",
      }),
      { params: Promise.resolve({ id: "classroom-1" }) },
    );

    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe("Classroom not found");
  });

  it("returns 404 for non-enrolled student on classroom students route", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await getClassroomStudents(
      new NextRequest(
        "http://localhost:3000/api/classrooms/classroom-1/students",
        { method: "GET" },
      ),
      { params: Promise.resolve({ id: "classroom-1" }) },
    );

    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe("Classroom not found");
  });

  it("returns 404 for non-enrolled student on classroom assignments route", async () => {
    const { getServerSession } = await import("next-auth");
    const { supabase } = await import("@/lib/supabase/client");

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "student-1", role: "student", email: "student@example.com" },
      expires: "2099-01-01",
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "classroom_students") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await getClassroomAssignments(
      new NextRequest(
        "http://localhost:3000/api/classrooms/classroom-1/assignments",
        { method: "GET" },
      ),
      { params: Promise.resolve({ id: "classroom-1" }) },
    );

    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe("Classroom not found");
  });
});
