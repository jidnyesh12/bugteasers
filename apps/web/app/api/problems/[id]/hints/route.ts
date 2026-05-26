import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase/client";
import { generateContextualHint } from "@/lib/ai/hint-generator";
import {
  getOrCreateHintUsage,
  incrementHintUsage,
  resetHintUsage,
  hasReachedHintLimit,
} from "@/lib/ai/hint-usage-db";
import type {
  HintGenerationRequest,
  HintGenerationResponse,
} from "@/lib/ai/hint-types";
import { HINT_CONFIG, calculateHintsRemaining } from "@/lib/ai/hint-config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can request hints" },
        { status: 403 },
      );
    }

    const { id: problemId } = await params;
    const body: HintGenerationRequest = await request.json();

    const {
      code,
      language,
      executionResults,
      previousHints = [],
      assignmentId,
    } = body;

    // 2. Validate request
    if (!code || !language) {
      return NextResponse.json(
        { error: "Missing required fields: code, language" },
        { status: 400 },
      );
    }

    if (previousHints.length >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 hints per session" },
        { status: 400 },
      );
    }

    const studentId = session.user.id;

    // 3. Check hint usage limit
    const limitCheck = await hasReachedHintLimit(
      studentId,
      problemId,
      assignmentId,
    );

    if (limitCheck.hasReached) {
      if (limitCheck.canReset) {
        // Reset is due - reset the counter
        await resetHintUsage(studentId, problemId, assignmentId);
      } else {
        // No hints remaining and can't reset yet
        return NextResponse.json(
          {
            error: "No hints remaining",
            hintsUsed: limitCheck.hintsUsed,
            resetAt: limitCheck.resetAt,
          },
          { status: 429 },
        );
      }
    }

    // 4. Fetch problem details
    const { data: problem, error: problemError } = await supabase
      .from("problems")
      .select("title, description, difficulty, constraints, examples")
      .eq("id", problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 },
      );
    }

    // 5. Get current usage to determine hint level
    const usage = await getOrCreateHintUsage(
      studentId,
      problemId,
      assignmentId,
    );
    const hintLevel = Math.min(previousHints.length + 1, 3);

    // 6. Generate hint
    const hint = await generateContextualHint({
      problem: {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        constraints: problem.constraints,
        examples: problem.examples || [],
      },
      studentCode: code,
      language,
      executionResults,
      previousHints,
      hintLevel,
    });

    // 7. Increment usage counter
    const updatedUsage = await incrementHintUsage(
      studentId,
      problemId,
      assignmentId,
    );

    // 8. Calculate hints remaining
    const hasReset = updatedUsage.hintsUsed > HINT_CONFIG.initialHints;
    const hintsRemaining = calculateHintsRemaining(
      updatedUsage.hintsUsed,
      hasReset,
    );

    // 9. Return hint
    const response: HintGenerationResponse = {
      hint,
      hintLevel,
      hintsRemaining,
      resetAt: updatedUsage.resetAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating hint:", error);

    // Handle specific error types
    const errorMessage = (error as Error).message;

    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json(
        {
          error:
            "AI service is currently experiencing high demand. Please try again in a moment.",
        },
        { status: 503 },
      );
    }

    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate hint. Please try again." },
      { status: 500 },
    );
  }
}
