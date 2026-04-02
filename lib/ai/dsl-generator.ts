/**
 * AI DSL Generator
 *
 * Uses Gemini to generate a TemplateDSL object for a problem, then runs
 * the full DSL pipeline (validation → materialisation → consensus oracle)
 * to produce concrete test cases with expected outputs.
 *
 * The oracle uses Gemini as well, running the problem independently N times
 * with different prompting strategies to compute a consensus expected output.
 * This resolves the chicken-and-egg problem: neither the test inputs nor the
 * reference solutions are trusted unconditionally — both are cross-validated.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { runPipeline, OracleInvoker, DslPipelineResult } from "@/lib/dsl";
import { DSL_SYSTEM_PROMPT, buildDslGenerationPrompt } from "./dsl-prompts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```\s*$/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Gemini-backed Oracle Invoker
// ---------------------------------------------------------------------------

function makeGeminiOracle(
  genAI: GoogleGenerativeAI,
  modelName: string
): OracleInvoker {
  return {
    async solve(
      problemDescription: string,
      input: string,
      strategyHint: string
    ): Promise<string> {
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = [
        "You are a competitive programming judge.  Given the problem and input below,",
        "compute the correct output and return ONLY the raw output (exactly as it would",
        "appear on stdout) — no explanation, no markdown, no extra text.",
        "",
        `Strategy hint: ${strategyHint}`,
        "",
        "=== PROBLEM ===",
        problemDescription,
        "",
        "=== INPUT ===",
        input,
        "",
        "=== OUTPUT (raw stdout only) ===",
      ].join("\n");

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    },
  };
}

// ---------------------------------------------------------------------------
// DSL template generator
// ---------------------------------------------------------------------------

async function generateDslTemplate(
  genAI: GoogleGenerativeAI,
  modelName: string,
  title: string,
  description: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<unknown> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const fullPrompt = [
    DSL_SYSTEM_PROMPT,
    "",
    buildDslGenerationPrompt(title, description, difficulty),
  ].join("\n");

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();
  const cleaned = stripJsonFences(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      `AI returned invalid JSON for DSL template: ${cleaned.slice(0, 200)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DslGenerationRequest {
  problem_id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  /** Number of oracle invocations per test case (default 3). */
  oracle_invocations?: number;
  /** Skip oracle evaluation — produce structural inputs only (default false). */
  skip_oracle?: boolean;
}

/**
 * Generate test cases for a problem using the DSL pipeline.
 *
 * Steps:
 *  1. Ask Gemini to generate a TemplateDSL JSON object.
 *  2. Validate + materialise the template.
 *  3. Run the consensus oracle (Gemini, N independent invocations).
 *  4. Return the full pipeline result.
 */
export async function generateTestCasesViaDsl(
  request: DslGenerationRequest
): Promise<DslPipelineResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-2.0-flash";

  // Step 1: Generate DSL template
  const rawTemplate = await generateDslTemplate(
    genAI,
    modelName,
    request.title,
    request.description,
    request.difficulty
  );

  // Inject problem_id from request
  if (typeof rawTemplate === "object" && rawTemplate !== null) {
    (rawTemplate as Record<string, unknown>).problem_id = request.problem_id;
  }

  // Step 2: Run the full pipeline
  const invoker = request.skip_oracle
    ? null
    : makeGeminiOracle(genAI, modelName);

  return runPipeline(rawTemplate, invoker, {
    oracleInvocations: request.oracle_invocations ?? 3,
    problemDescription: `${request.title}\n\n${request.description}`,
    repair: true,
  });
}
