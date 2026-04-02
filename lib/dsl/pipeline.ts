/**
 * Template DSL — End-to-End Pipeline
 *
 * Orchestrates:
 *   1. Template validation
 *   2. Deterministic materialisation (all profiles × cases_per_profile)
 *   3. Multi-invocation consensus oracle
 *   4. Self-healing repair (bounded retries)
 *   5. Confidence-based sample selection
 *   6. Final DslTestCase assembly
 *
 * The pipeline is designed for AI-native use: AI generates the DSL template
 * (a JSON object matching TemplateDSL), and the pipeline handles everything
 * downstream deterministically.
 */

import {
  TemplateDSL,
  MaterializedTestCase,
  DslTestCase,
  DslPipelineResult,
  GenerationProfile,
} from "./types";
import { DslError, SchemaError } from "./errors";
import { validateTemplate } from "./validator";
import { hashTemplate } from "./hash";
import { materializeAll, materializeOne } from "./materializer";
import { OracleInvoker, runOracle } from "./oracle";
import { repairTemplate, MAX_REPAIR_ATTEMPTS } from "./repair";

const PIPELINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Points assignment by profile
// ---------------------------------------------------------------------------

function pointsForProfile(profile: GenerationProfile): number {
  switch (profile) {
    case "edge_cases":
      return 1;
    case "random":
      return 1;
    case "worst_case":
      return 2;
    case "adversarial":
      return 3;
  }
}

// ---------------------------------------------------------------------------
// Sample-case selection
// ---------------------------------------------------------------------------

/**
 * Mark a subset of test cases as samples (visible to students).
 * Strategy: pick one random-profile case and one edge-cases case.
 */
function markSamples(cases: DslTestCase[]): void {
  const random = cases.find((c) => c.profile === "random");
  const edge = cases.find((c) => c.profile === "edge_cases");
  if (random) random.is_sample = true;
  if (edge && edge !== random) edge.is_sample = true;
}

// ---------------------------------------------------------------------------
// Pipeline entry point
// ---------------------------------------------------------------------------

export interface PipelineOptions {
  /** Number of oracle invocations per test case (default 3). */
  oracleInvocations?: number;
  /** Base seed for materialisation (default 42). */
  baseSeed?: number;
  /** Whether to attempt self-healing repairs on failures (default true). */
  repair?: boolean;
  /** Problem description passed to the oracle. */
  problemDescription?: string;
}

/**
 * Run the full DSL pipeline on a raw (possibly AI-generated) template object.
 *
 * @param rawTemplate   The raw JSON object to validate and run.
 * @param invoker       The oracle AI invoker.  Pass `null` to skip oracle
 *                      evaluation (inputs only — useful for testing).
 * @param opts          Pipeline options.
 */
export async function runPipeline(
  rawTemplate: unknown,
  invoker: OracleInvoker | null,
  opts: PipelineOptions = {}
): Promise<DslPipelineResult> {
  const {
    oracleInvocations = 3,
    baseSeed = 42,
    repair = true,
    problemDescription = "",
  } = opts;

  // -------------------------------------------------------------------------
  // Stage 1: Validate template (with optional repair)
  // -------------------------------------------------------------------------
  let template: TemplateDSL;
  let repairAttempts = 0;

  while (true) {
    try {
      template = validateTemplate(rawTemplate);
      break;
    } catch (err) {
      if (!repair || repairAttempts >= MAX_REPAIR_ATTEMPTS) throw err;
      if (!(err instanceof SchemaError)) throw err;

      const result = repairTemplate({
        kind: "schema_error",
        message: err.message,
        template: rawTemplate as TemplateDSL,
        attempts: repairAttempts,
      });
      repairAttempts++;

      if (!result.success || !result.template) {
        throw err; // Give up
      }
      rawTemplate = result.template;
    }
  }

  const templateHash = hashTemplate(template);

  // -------------------------------------------------------------------------
  // Stage 2: Materialise all test cases
  // -------------------------------------------------------------------------
  let materialized: MaterializedTestCase[];
  let matRepairAttempts = 0;
  let currentTemplate = template;

  while (true) {
    try {
      materialized = materializeAll(currentTemplate, templateHash, baseSeed);
      break;
    } catch (err) {
      if (!repair || matRepairAttempts >= MAX_REPAIR_ATTEMPTS) throw err;
      if (!(err instanceof DslError)) throw err;

      const result = repairTemplate({
        kind: err.kind,
        message: err.message,
        template: currentTemplate,
        attempts: matRepairAttempts,
      });
      matRepairAttempts++;

      if (!result.success || !result.template) throw err;
      currentTemplate = result.template;
    }
  }
  // Use potentially-repaired template henceforth
  template = currentTemplate;

  // -------------------------------------------------------------------------
  // Stage 3: Oracle evaluation (or skip)
  // -------------------------------------------------------------------------
  const testCases: DslTestCase[] = [];
  const disputedCases: DslTestCase[] = [];

  for (const mc of materialized) {
    if (invoker === null) {
      // No oracle — produce input-only test case (expected_output = "")
      testCases.push({
        input_data: mc.input,
        expected_output: "",
        is_sample: false,
        points: pointsForProfile(mc.profile),
        profile: mc.profile,
        seed: mc.seed,
        template_hash: mc.template_hash,
        oracle_confidence: "disputed",
        disputed: true,
      });
      continue;
    }

    let oracleResult;
    let invocations = oracleInvocations;

    try {
      oracleResult = await runOracle(invoker, problemDescription, mc, invocations);
    } catch {
      // Retry with 1 invocation
      try {
        invocations = 1;
        oracleResult = await runOracle(invoker, problemDescription, mc, invocations);
      } catch {
        // Give up — mark as disputed
        const disputed: DslTestCase = {
          input_data: mc.input,
          expected_output: "",
          is_sample: false,
          points: pointsForProfile(mc.profile),
          profile: mc.profile,
          seed: mc.seed,
          template_hash: mc.template_hash,
          oracle_confidence: "disputed",
          disputed: true,
        };
        disputedCases.push(disputed);
        continue;
      }
    }

    const tc: DslTestCase = {
      input_data: mc.input,
      expected_output: oracleResult.expected_output,
      is_sample: false,
      points: pointsForProfile(mc.profile),
      profile: mc.profile,
      seed: mc.seed,
      template_hash: mc.template_hash,
      oracle_confidence: oracleResult.confidence,
      disputed: oracleResult.confidence === "disputed",
    };

    if (oracleResult.confidence === "disputed") {
      disputedCases.push(tc);
    } else {
      testCases.push(tc);
    }
  }

  // -------------------------------------------------------------------------
  // Stage 4: Sample selection
  // -------------------------------------------------------------------------
  markSamples(testCases);

  return {
    template,
    template_hash: templateHash,
    test_cases: testCases,
    disputed_cases: disputedCases,
    metadata: {
      generated_at: new Date().toISOString(),
      total_materialized: materialized.length,
      total_oracle_evaluated: invoker !== null ? materialized.length : 0,
      total_disputed: disputedCases.length,
      pipeline_version: PIPELINE_VERSION,
    },
  };
}

// ---------------------------------------------------------------------------
// Convenience: materialise only (no oracle)
// ---------------------------------------------------------------------------

export function materializeTemplate(
  rawTemplate: unknown,
  baseSeed: number = 42
): MaterializedTestCase[] {
  const template = validateTemplate(rawTemplate);
  const hash = hashTemplate(template);
  return materializeAll(template, hash, baseSeed);
}

// ---------------------------------------------------------------------------
// Convenience: materialise a single case
// ---------------------------------------------------------------------------

export function materializeSingleCase(
  rawTemplate: unknown,
  seed: number,
  profile: GenerationProfile
): MaterializedTestCase {
  const template = validateTemplate(rawTemplate);
  const hash = hashTemplate(template);
  return materializeOne(template, seed, profile, hash);
}
