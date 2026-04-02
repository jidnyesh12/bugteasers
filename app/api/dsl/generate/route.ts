/**
 * POST /api/dsl/generate
 *
 * Full DSL pipeline:
 *  1. Gemini generates a TemplateDSL object.
 *  2. Materializer produces deterministic inputs.
 *  3. Consensus oracle evaluates expected outputs.
 *  4. Returns DslTestCase[] ready to save.
 *
 * Request body: {
 *   problem_id: string,
 *   title: string,
 *   description: string,
 *   difficulty: "easy" | "medium" | "hard",
 *   oracle_invocations?: number,
 *   skip_oracle?: boolean
 * }
 *
 * Response:
 *   200  DslPipelineResult
 *   400  { error: string }
 *   500  { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateTestCasesViaDsl } from "@/lib/ai/dsl-generator";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      session.user.role !== "instructor" &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only instructors can generate test cases" },
        { status: 403 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { problem_id, title, description, difficulty, oracle_invocations, skip_oracle } =
      body;

    if (!problem_id || !title || !description || !difficulty) {
      return NextResponse.json(
        { error: "problem_id, title, description, and difficulty are required" },
        { status: 400 }
      );
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty must be easy, medium, or hard" },
        { status: 400 }
      );
    }

    const result = await generateTestCasesViaDsl({
      problem_id,
      title,
      description,
      difficulty,
      oracle_invocations:
        typeof oracle_invocations === "number" ? oracle_invocations : 3,
      skip_oracle: skip_oracle === true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("DSL generate error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
