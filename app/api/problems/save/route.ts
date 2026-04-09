// API route for saving generated problems

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase/client";
import {
  normalizeProblemTestCasesForSave,
  SaveProblemValidationError,
  type SaveGeneratedTestCase,
} from "@/lib/problems/save-testcases";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "instructor" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only instructors can save problems" },
        { status: 403 },
      );
    }

    const { problems } = await request.json();

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json(
        { error: "No problems provided" },
        { status: 400 },
      );
    }

    const savedProblems = [];

    for (const problem of problems) {
      let normalizedTestCases: SaveGeneratedTestCase[];
      try {
        normalizedTestCases = normalizeProblemTestCasesForSave({
          testCases: problem.test_cases,
          problemTitle: problem.title,
          userId: session.user.id,
        });
      } catch (error) {
        if (error instanceof SaveProblemValidationError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        throw error;
      }

      // Insert problem
      const { data: insertedProblem, error: problemError } = await supabase
        .from("problems")
        .insert({
          created_by: session.user.id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          tags: problem.tags,
          constraints: problem.constraints,
          examples: problem.examples,
          hints: problem.hints,
          time_limit: problem.time_limit,
          memory_limit: problem.memory_limit,
          solution_code: problem.solution_code,
        })
        .select()
        .single();

      if (problemError) {
        console.error("Error inserting problem:", problemError);
        return NextResponse.json(
          { error: `DB error: ${problemError.message}`, details: problemError },
          { status: 500 },
        );
      }

      // Insert test cases
      if (normalizedTestCases.length > 0) {
        const testCasesToInsert = normalizedTestCases.map(
          (tc: SaveGeneratedTestCase) => ({
            problem_id: insertedProblem.id,
            input_data: tc.input_data,
            input_template: tc.input_template ?? null,
            expected_output: tc.expected_output,
            is_sample: tc.is_sample ?? false,
            points: tc.points ?? 1,
            generated_at: tc.generated_at ?? null,
            generation_model: tc.generation_model ?? null,
            generation_seed: tc.generation_seed ?? null,
            is_generated: tc.is_generated ?? false,
            input_hash:
              tc.input_hash ??
              createHash("sha256").update(tc.input_data).digest("hex"),
          }),
        );

        const { error: testCasesError } = await supabase
          .from("test_cases")
          .insert(testCasesToInsert);

        if (testCasesError) {
          console.error("Error inserting test cases:", testCasesError);
          return NextResponse.json(
            {
              error: `Test case error: ${testCasesError.message}`,
              details: testCasesError,
            },
            { status: 500 },
          );
        }
      }

      savedProblems.push(insertedProblem);
    }

    return NextResponse.json({ problems: savedProblems }, { status: 201 });
  } catch (error) {
    console.error("Error saving problems:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save problems: ${message}` },
      { status: 500 },
    );
  }
}
