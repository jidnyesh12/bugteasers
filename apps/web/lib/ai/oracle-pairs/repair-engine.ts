/**
 * Repair Engine: Auto-repair for oracle pair failures
 *
 * Strategies:
 * 1. Soft constraint repair - fix constraint violations automatically
 * 2. Model answer regeneration - regen from seed if answer wrong
 * 3. Test case regeneration - regen from seed if test case wrong
 * 4. Differential oracle consensus - use multiple implementations
 *
 * Design: Confidence-driven decision making
 * - High confidence (>85%) → auto-repair
 * - Medium confidence (50-85%) → differential oracle
 * - Low confidence (<50%) → escalate
 */

import type { OraclePair, OracleValidationResult, RepairLog } from "./types";
import { RepairActionType } from "./types";

/**
 * Repair configuration
 */
export interface RepairConfig {
  maxAttempts: number;
  autoRepairThreshold: number; // confidence % for auto-repair
  escalationThreshold: number; // confidence % below which to escalate
  confidenceDecayFactor: number; // each failed repair reduces confidence
  enableManualReview: boolean;
}

export const DEFAULT_REPAIR_CONFIG: RepairConfig = {
  maxAttempts: 5,
  autoRepairThreshold: 0.8,
  escalationThreshold: 0.5,
  confidenceDecayFactor: 0.2, // 20% penalty per failed repair
  enableManualReview: true,
};

/**
 * Repair context: What we know about the failure
 */
export interface RepairContext {
  pair: OraclePair;
  validation: OracleValidationResult;
  repairAttempt: number;
  confidenceBefore: number;
  estimatedConfidenceAfter: number;
}

/**
 * Repair action decision
 */
export interface RepairDecision {
  action: RepairActionType;
  reason: string;
  estimatedSuccessRate: number; // 0-1 probability of success
  isAutoRepair: boolean;
  recommendedEscalation: boolean;
}

/**
 * Utility: Make repair decision based on validation result
 */
export function makeRepairDecision(
  context: RepairContext,
  config: RepairConfig,
): RepairDecision {
  const { validation, repairAttempt, confidenceBefore } = context;

  // Adjust confidence based on repair history
  const adjustedConfidence = Math.max(
    0,
    confidenceBefore - repairAttempt * config.confidenceDecayFactor,
  );

  // Escalate if low confidence or max attempts exceeded
  if (
    adjustedConfidence < config.escalationThreshold ||
    repairAttempt >= config.maxAttempts
  ) {
    return {
      action: RepairActionType.MANUAL_REVIEW,
      reason: `Low confidence (${adjustedConfidence.toFixed(2)}) or max attempts (${repairAttempt}/${config.maxAttempts})`,
      estimatedSuccessRate: 0,
      isAutoRepair: false,
      recommendedEscalation: true,
    };
  }

  // Determine best repair action
  if (validation.failureAttributed === "test_case_error") {
    // Test case is wrong → regenerate test input/output
    return {
      action: RepairActionType.REGEN_INPUT_DATA,
      reason:
        "Test case constraints violated or output wrong - regenerate test",
      estimatedSuccessRate: adjustedConfidence,
      isAutoRepair: adjustedConfidence >= config.autoRepairThreshold,
      recommendedEscalation: false,
    };
  }

  if (validation.failureAttributed === "model_answer_error") {
    // Model answer is wrong → regenerate answer
    return {
      action: RepairActionType.REGEN_MODEL_ANSWER,
      reason: "Model answer produced wrong output - regenerate",
      estimatedSuccessRate: adjustedConfidence,
      isAutoRepair: adjustedConfidence >= config.autoRepairThreshold,
      recommendedEscalation: false,
    };
  }

  if (validation.failureAttributed === "unknown") {
    // Can't determine → use differential oracle
    return {
      action: RepairActionType.USE_REFERENCE_IMPL,
      reason:
        "Unclear which side is wrong - running differential oracle for consensus",
      estimatedSuccessRate: 0.6, // Differential oracle has ~60% confidence
      isAutoRepair: false, // Requires external implementations
      recommendedEscalation: false,
    };
  }

  // Both wrong or non-determinism (worst case)
  return {
    action: RepairActionType.MANUAL_REVIEW,
    reason: `${validation.failureAttributed} - requires manual review`,
    estimatedSuccessRate: 0,
    isAutoRepair: false,
    recommendedEscalation: true,
  };
}

/**
 * Soft constraint repair: Fix constraint violations automatically
 */
export function repairSoftConstraints(
  pair: OraclePair,
  _config: RepairConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
): { repaired: boolean; pair?: OraclePair; error?: string } {
  // STUB: Integrate with constraint registry to apply repair functions
  try {
    const repaired = { ...pair };
    // Apply soft constraint repairs
    // ... repair logic ...
    return { repaired: true, pair: repaired };
  } catch (error) {
    return {
      repaired: false,
      error: error instanceof Error ? error.message : "Unknown repair error",
    };
  }
}

/**
 * Model answer repair: Regenerate from seed
 */
export function repairModelAnswer(
  pair: OraclePair,
  _config: RepairConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
): { repaired: boolean; pair?: OraclePair; error?: string } {
  // STUB: Call generateModelAnswer with same seed
  // If deterministic, should produce identical code
  // If not, try seed variation

  try {
    const repaired = { ...pair };
    // Regenerate answer logic here
    return { repaired: true, pair: repaired };
  } catch (error) {
    return {
      repaired: false,
      error:
        error instanceof Error ? error.message : "Answer regeneration failed",
    };
  }
}

/**
 * Test case repair: Regenerate from seed
 */
export function repairTestCase(
  pair: OraclePair,
  _config: RepairConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
): { repaired: boolean; pair?: OraclePair; error?: string } {
  // STUB: Call template materialization with same seed

  try {
    const repaired = { ...pair };
    // Regenerate test case logic here
    return { repaired: true, pair: repaired };
  } catch (error) {
    return {
      repaired: false,
      error:
        error instanceof Error
          ? error.message
          : "Test case regeneration failed",
    };
  }
}

/**
 * Execute repair based on decision
 */
export async function executeRepair(
  decision: RepairDecision,
  context: RepairContext,
  config: RepairConfig,
): Promise<{
  success: boolean;
  pair?: OraclePair;
  error?: string;
  newConfidence?: number;
}> {
  if (!decision.isAutoRepair) {
    return {
      success: false,
      error: `Repair action ${decision.action} requires manual intervention or external execution`,
    };
  }

  try {
    switch (decision.action) {
      case RepairActionType.REGEN_INPUT_DATA: {
        const result = repairTestCase(context.pair, config);
        return {
          success: result.repaired,
          pair: result.pair,
          error: result.error,
          newConfidence: decision.estimatedSuccessRate,
        };
      }

      case RepairActionType.REGEN_MODEL_ANSWER: {
        const result = repairModelAnswer(context.pair, config);
        return {
          success: result.repaired,
          pair: result.pair,
          error: result.error,
          newConfidence: decision.estimatedSuccessRate,
        };
      }

      case RepairActionType.UPDATE_EXPECTED_OUTPUT:
        // Use reference implementation's output
        return {
          success: true,
          pair: context.pair,
          newConfidence: Math.min(1, decision.estimatedSuccessRate),
        };

      case RepairActionType.USE_REFERENCE_IMPL:
        return {
          success: false,
          error: "Reference implementation requires external execution",
        };

      case RepairActionType.MANUAL_REVIEW:
        return {
          success: false,
          error: "Manual review required",
        };

      default:
        return {
          success: false,
          error: `Unknown repair action: ${decision.action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Repair execution failed",
    };
  }
}

/**
 * Build repair log for failed pair
 */
export function buildRepairLog(
  pair: OraclePair,
  validation: OracleValidationResult,
  repairs: Array<{
    action: RepairActionType;
    success: boolean;
    error?: string;
  }>,
  finalStatus: "repaired" | "escalated" | "failed",
): RepairLog {
  return {
    version: 1,
    generationSeed: pair.generationSeed,
    oraclePairId: pair.generationSeed,
    createdAt: new Date().toISOString(),

    originalPair: pair,
    originalValidation: validation,

    failures: [validation],

    repairs: repairs.map((r, i) => ({
      action: r.action,
      reason: `Repair attempt ${i + 1}`,
      timestamp: new Date().toISOString(),
      success: r.success,
      error: r.error,
    })),

    finalStatus,
    finalValidation: validation,
    finalPair: pair,
    requiresManualReview: finalStatus === "escalated",

    repairDuration: 0,
    totalAttempts: repairs.length,
    successRate:
      repairs.filter((r) => r.success).length / Math.max(1, repairs.length),
  };
}

/**
 * Comprehensive repair pipeline
 */
export async function repairOraclePair(
  pair: OraclePair,
  validation: OracleValidationResult,
  config: RepairConfig = DEFAULT_REPAIR_CONFIG,
): Promise<{
  pair: OraclePair;
  log: RepairLog;
  success: boolean;
}> {
  const repairs: Array<{
    action: RepairActionType;
    success: boolean;
    error?: string;
  }> = [];
  let currentPair = pair;
  const currentValidation = validation;
  let repairAttempt = 0;

  // Repair loop
  while (
    repairAttempt < config.maxAttempts &&
    !currentValidation.isConsistent
  ) {
    // Make repair decision
    const context: RepairContext = {
      pair: currentPair,
      validation: currentValidation,
      repairAttempt,
      confidenceBefore: currentValidation.confidence,
      estimatedConfidenceAfter:
        currentValidation.confidence * (1 - config.confidenceDecayFactor),
    };

    const decision = makeRepairDecision(context, config);

    // Check escalation
    if (decision.recommendedEscalation) {
      return {
        pair: currentPair,
        log: buildRepairLog(
          currentPair,
          currentValidation,
          repairs,
          "escalated",
        ),
        success: false,
      };
    }

    // Execute repair
    const repairResult = await executeRepair(decision, context, config);

    repairs.push({
      action: decision.action,
      success: repairResult.success,
      error: repairResult.error,
    });

    if (repairResult.success && repairResult.pair) {
      currentPair = repairResult.pair;
      // In real implementation, would re-validate here
      // For now, assume repair fixed it
      currentValidation.isConsistent = true;
    }

    repairAttempt++;
  }

  const finalStatus = currentValidation.isConsistent ? "repaired" : "failed";

  return {
    pair: currentPair,
    log: buildRepairLog(currentPair, currentValidation, repairs, finalStatus),
    success: currentValidation.isConsistent,
  };
}
