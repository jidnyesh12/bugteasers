import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase/client";
import { shortenForPreview } from "@/lib/execution/output-preview";

interface StoredTestCase {
  is_sample: boolean;
  input_data?: string | null;
  expected_output?: string | null;
  input_template?: unknown;
  [key: string]: unknown;
}

interface ProblemWithUsageCount {
  usage_count: number | null;
  assignment_problems?: { count: number }[] | null;
  test_cases?: StoredTestCase[];
  [key: string]: unknown;
}

function toDisplayTestCase(testCase: StoredTestCase) {
  const input = shortenForPreview(testCase.input_data ?? "");
  const expected = shortenForPreview(testCase.expected_output ?? "");

  return {
    ...testCase,
    input_data: input.text,
    expected_output: expected.text,
    input_data_truncated: input.truncated,
    expected_output_truncated: expected.truncated,
    generated_from_template:
      testCase.input_template !== null && testCase.input_template !== undefined,
  };
}

function resolveUsageCount(problem: ProblemWithUsageCount): number {
  const relationCount = problem.assignment_problems?.[0]?.count;

  if (typeof relationCount === "number" && Number.isFinite(relationCount)) {
    return relationCount;
  }

  if (
    typeof problem.usage_count === "number" &&
    Number.isFinite(problem.usage_count)
  ) {
    return problem.usage_count;
  }

  return 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: problem, error } = await supabase
      .from("problems")
      .select(
        `
        *,
        assignment_problems (count),
        test_cases (
          id,
          input_data,
          input_template,
          expected_output,
          is_sample,
          points,
          created_at
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching problem:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Problem not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch problem" },
        { status: 500 },
      );
    }

    const rawProblem = problem as ProblemWithUsageCount;
    const normalizedProblem: ProblemWithUsageCount = {
      ...rawProblem,
      usage_count: resolveUsageCount(rawProblem),
      test_cases: rawProblem.test_cases?.map(toDisplayTestCase),
    };
    delete normalizedProblem.assignment_problems;

    const isInstructor = session.user.role === "instructor";

    if (isInstructor) {
      // Instructors get everything including solution_code
      return NextResponse.json({ problem: normalizedProblem });
    }

    // Students: strip solution_code, only show sample test cases
    const safeFields = { ...normalizedProblem };
    delete (safeFields as Record<string, unknown>).solution_code;
    const sampleTestCases = (
      (normalizedProblem.test_cases as
        | Array<{ is_sample: boolean }>
        | undefined) || []
    ).filter((tc: { is_sample: boolean }) => tc.is_sample);

    return NextResponse.json({
      problem: {
        ...safeFields,
        test_cases: sampleTestCases,
      },
    });
  } catch (error) {
    console.error("Error in problem detail API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
