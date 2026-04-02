/**
 * Template DSL — Multi-Invocation Consensus Oracle
 *
 * This module resolves the chicken-and-egg problem in automated test-case
 * generation: neither the reference solution nor the test inputs should be
 * trusted unconditionally.
 *
 * Instead we:
 *  1. Generate structural inputs independently (via the materializer).
 *  2. Ask an AI model to solve the problem N times with different prompting
 *     strategies (role diversity).
 *  3. Normalise each output and compute a majority vote.
 *  4. Assign a confidence label:
 *       high     ≥ ceil(2/3 * N) agree
 *       medium   ≥ ceil(1/2 * N) agree
 *       low      at least one agreement but below medium
 *       disputed zero or one unique answer (all different)
 *
 * Disputed cases are flagged for manual review and not silently accepted.
 */

import {
  OracleResult,
  OracleConfidence,
  OracleSolution,
  MaterializedTestCase,
} from "./types";
import { OracleError } from "./errors";

// ---------------------------------------------------------------------------
// Output normalisation
// ---------------------------------------------------------------------------

/**
 * Canonical normalisation for judge output comparison:
 *  - Trim leading/trailing whitespace
 *  - Collapse runs of whitespace within lines to single spaces
 *  - Remove trailing spaces per line
 *  - Normalise line endings to \n
 */
export function normaliseOutput(raw: string): string {
  return raw
    .trim()
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n");
}

// ---------------------------------------------------------------------------
// Confidence computation
// ---------------------------------------------------------------------------

function computeConfidence(
  agreementCount: number,
  total: number
): OracleConfidence {
  if (total === 0) return "disputed";
  const ratio = agreementCount / total;
  if (ratio >= 2 / 3) return "high";
  if (ratio >= 1 / 2) return "medium";
  if (agreementCount > 1) return "low";
  return "disputed";
}

// ---------------------------------------------------------------------------
// Public Oracle API
// ---------------------------------------------------------------------------

export interface OracleInvoker {
  /**
   * Run a solution attempt.
   * @param problemDescription  The full problem statement (markdown).
   * @param input               The stdin input for this test case.
   * @param strategyHint        A hint to encourage diverse reasoning.
   * @returns                   The raw stdout output.
   */
  solve(
    problemDescription: string,
    input: string,
    strategyHint: string
  ): Promise<string>;
}

const STRATEGY_HINTS = [
  "Think step by step carefully.",
  "Use a brute-force approach first, then optimise.",
  "Consider edge cases explicitly before writing your answer.",
  "Verify your answer by tracing through the example manually.",
  "Use the simplest correct algorithm you can think of.",
];

/**
 * Run the consensus oracle for a single materialised test case.
 *
 * @param invoker             Pluggable AI invoker (allows testing without AI).
 * @param problemDescription  Full problem statement.
 * @param testCase            The materialised test case to evaluate.
 * @param invocations         Number of independent solution attempts (default 3).
 */
export async function runOracle(
  invoker: OracleInvoker,
  problemDescription: string,
  testCase: MaterializedTestCase,
  invocations: number = 3
): Promise<OracleResult> {
  const solutions: OracleSolution[] = [];

  for (let i = 0; i < invocations; i++) {
    const hint = STRATEGY_HINTS[i % STRATEGY_HINTS.length];
    try {
      const raw = await invoker.solve(problemDescription, testCase.input, hint);
      solutions.push({ output: raw, normalised: normaliseOutput(raw) });
    } catch (err) {
      throw new OracleError(
        `Oracle invocation ${i + 1}/${invocations} failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  if (solutions.length === 0) {
    throw new OracleError("All oracle invocations failed");
  }

  // Majority vote on normalised outputs
  const votes = new Map<string, number>();
  for (const s of solutions) {
    votes.set(s.normalised, (votes.get(s.normalised) ?? 0) + 1);
  }

  let consensus = "";
  let maxVotes = 0;
  for (const [output, count] of votes.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      consensus = output;
    }
  }

  const confidence = computeConfidence(maxVotes, solutions.length);

  return {
    expected_output: consensus,
    solutions,
    agreement_count: maxVotes,
    total_invocations: solutions.length,
    confidence,
  };
}

/**
 * Run the oracle for a batch of test cases.
 * Returns oracle results in the same order as the input.
 */
export async function runOracleBatch(
  invoker: OracleInvoker,
  problemDescription: string,
  testCases: MaterializedTestCase[],
  invocations: number = 3
): Promise<OracleResult[]> {
  return Promise.all(
    testCases.map((tc) =>
      runOracle(invoker, problemDescription, tc, invocations)
    )
  );
}
