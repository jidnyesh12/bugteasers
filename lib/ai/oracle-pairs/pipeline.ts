/**
 * Pipeline: Complete End-to-End Oracle Pair Orchestration
 *
 * Coordinates all phases:
 * 1. Template materialization → Test case
 * 2. Model answer generation → Reference implementation
 * 3. Oracle validation → Check consistency
 * 4. Repair loop → Auto or escalate
 * 5. Result finalization → Persist & return
 *
 * Error handling at each stage with recovery strategies
 */

import type {
  OraclePair,
  OracleValidationResult,
  TestCase,
  ModelAnswer,
} from './types';
import type { TestCaseInputTemplate } from '../template-dsl/types';
import type { OrchestratorConfig } from './generation-orchestrator';
import type { RepairConfig } from './repair-engine';
import { DEFAULT_ORCHESTRATOR_CONFIG } from './generation-orchestrator';
import { DEFAULT_REPAIR_CONFIG } from './repair-engine';
import { TemplateDslError } from '../template-dsl/errors';

/**
 * Pipeline configuration - combines all sub-configs
 */
export interface PipelineConfig {
  orchestrator: OrchestratorConfig;
  repair: RepairConfig;
  resilience: {
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
    enableFallback: boolean;
  };
  observability: {
    logStages: boolean;
    logFailures: boolean;
    collectMetrics: boolean;
  };
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  orchestrator: DEFAULT_ORCHESTRATOR_CONFIG,
  repair: DEFAULT_REPAIR_CONFIG,
  resilience: {
    maxRetries: 2,
    retryDelayMs: 500,
    timeoutMs: 60000,
    enableFallback: true,
  },
  observability: {
    logStages: true,
    logFailures: true,
    collectMetrics: true,
  },
};

/**
 * Stage execution result
 */
export interface StageResult {
  stage: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: unknown;
  retry?: number;
}

/**
 * Complete pipeline execution result
 */
export interface PipelineResult {
  success: boolean;
  oraclePair?: OraclePair;
  validation?: OracleValidationResult;
  stages: StageResult[];
  totalDuration: number;
  finalStatus: 'success' | 'escalated' | 'failed';
  errors: string[];
  metrics?: {
    stageTimings: Record<string, number>;
    retryCount: number;
    autoRepairCount: number;
    escalationCount: number;
  };
}

/**
 * Pipeline context - shared state across stages
 */
interface PipelineContext {
  template: TestCaseInputTemplate;
  problemStatement: string;
  constraints: string;
  examples: string;
  generationSeed: string;
  config: PipelineConfig;
  stages: StageResult[];
  currentPair?: OraclePair;
  currentValidation?: OracleValidationResult;
  errors: string[];
  metrics: {
    retryCount: number;
    autoRepairCount: number;
    escalationCount: number;
  };
}

/**
 * Stage 1: Materialize test case from template
 */
async function stageMaterializeTestCase(
  ctx: PipelineContext
): Promise<{ testCase: TestCase; success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    // STUB: Would call actual materialization from template-dsl
    const testCase: TestCase = {
      inputData: ctx.examples.split('\n')[0] || '5',
      expectedOutput: ctx.examples.split('\n')[1] || '120',
      generationSeed: ctx.generationSeed,
      resolvedSeed: ctx.generationSeed,
      variables: { n: 5 },
      version: 1,
    };

    const duration = Date.now() - startTime;
    ctx.stages.push({
      stage: 'materialize_test_case',
      success: true,
      duration,
      data: testCase,
    });

    return { testCase, success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.stages.push({
      stage: 'materialize_test_case',
      success: false,
      duration,
      error: errorMsg,
    });

    ctx.errors.push(`Test materialization failed: ${errorMsg}`);
    return { testCase: {} as TestCase, success: false, error: errorMsg };
  }
}

/**
 * Stage 2: Generate model answer
 */
async function stageGenerateModelAnswer(
  ctx: PipelineContext
): Promise<{ answer: ModelAnswer; success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    // STUB: Would call LLM generator
    const answer: ModelAnswer = {
      code: `n = int(input())\nprint(n * 2)`,
      language: ctx.config.orchestrator.llmGenerator.language,
      generationSeed: ctx.generationSeed,
      version: 1,
      modelName: ctx.config.orchestrator.llmGenerator.modelName,
      temperature: ctx.config.orchestrator.llmGenerator.temperature,
      auditTrail: {
        originalSeed: ctx.generationSeed,
        timestamp: new Date().toISOString(),
        model: ctx.config.orchestrator.llmGenerator.modelName,
        retryCount: 0,
      },
    };

    const duration = Date.now() - startTime;
    ctx.stages.push({
      stage: 'generate_model_answer',
      success: true,
      duration,
      data: answer,
    });

    return { answer, success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.stages.push({
      stage: 'generate_model_answer',
      success: false,
      duration,
      error: errorMsg,
    });

    ctx.errors.push(`Model answer generation failed: ${errorMsg}`);
    return { answer: {} as ModelAnswer, success: false, error: errorMsg };
  }
}

/**
 * Stage 3: Create oracle pair
 */
async function stageCreateOraclePair(
  ctx: PipelineContext,
  testCase: TestCase,
  answer: ModelAnswer
): Promise<{ pair: OraclePair; success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    const pair: OraclePair = {
      version: 1,
      generationSeed: ctx.generationSeed,
      testCase,
      modelAnswer: answer,
      createdAt: new Date().toISOString(),
      metadata: {
        problemName: ctx.problemStatement.split('\n')[0],
      },
    };

    ctx.currentPair = pair;

    const duration = Date.now() - startTime;
    ctx.stages.push({
      stage: 'create_oracle_pair',
      success: true,
      duration,
    });

    return { pair, success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.stages.push({
      stage: 'create_oracle_pair',
      success: false,
      duration,
      error: errorMsg,
    });

    ctx.errors.push(`Oracle pair creation failed: ${errorMsg}`);
    return { pair: {} as OraclePair, success: false, error: errorMsg };
  }
}

/**
 * Stage 4: Validate oracle pair
 */
async function stageValidateOraclePair(
  ctx: PipelineContext,
  pair: OraclePair
): Promise<{ validation: OracleValidationResult; success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    // STUB: Would call actual validator
    const validation: OracleValidationResult = {
      version: 1,
      oraclePairId: pair.generationSeed,
      generationSeed: pair.generationSeed,
      timestamp: new Date().toISOString(),
      isConsistent: true,
      testCaseStatus: 'valid',
      modelAnswerStatus: 'correct',
      expectedOutput: pair.testCase.expectedOutput,
      actualOutput: pair.testCase.expectedOutput,
      outputMatch: true,
      failureAttributed: 'unknown',
      confidence: 1.0,
      diagnostics: {
        constraintViolations: [],
        executionErrors: [],
        nonDeterminismDetected: false,
      },
    };

    ctx.currentValidation = validation;

    const duration = Date.now() - startTime;
    ctx.stages.push({
      stage: 'validate_oracle_pair',
      success: true,
      duration,
    });

    return { validation, success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.stages.push({
      stage: 'validate_oracle_pair',
      success: false,
      duration,
      error: errorMsg,
    });

    ctx.errors.push(`Validation failed: ${errorMsg}`);
    return { validation: {} as OracleValidationResult, success: false, error: errorMsg };
  }
}

/**
 * Stage 5: Repair if needed
 */
async function stageRepairIfNeeded(
  ctx: PipelineContext,
  pair: OraclePair,
  validation: OracleValidationResult
): Promise<{ pair: OraclePair; repaired: boolean; success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    if (validation.isConsistent) {
      const duration = Date.now() - startTime;
      ctx.stages.push({
        stage: 'repair_if_needed',
        success: true,
        duration,
      });
      return { pair, repaired: false, success: true };
    }

    // STUB: Would call repair engine
    // For now, just escalate
    ctx.metrics.escalationCount++;

    const duration = Date.now() - startTime;
    ctx.stages.push({
      stage: 'repair_if_needed',
      success: false,
      duration,
      error: 'Escalated to manual review',
    });

    ctx.errors.push('Oracle pair inconsistent - escalated');
    return { pair, repaired: false, success: false, error: 'Escalated' };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.stages.push({
      stage: 'repair_if_needed',
      success: false,
      duration,
      error: errorMsg,
    });

    ctx.errors.push(`Repair failed: ${errorMsg}`);
    return { pair, repaired: false, success: false, error: errorMsg };
  }
}

/**
 * Stage 6: Finalize result
 */
async function stageFinalizeResult(
  ctx: PipelineContext,
  _pair: OraclePair // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    // STUB: Would persist to database if configured
    const validation = ctx.currentValidation;
    if (!validation) {
      throw new TemplateDslError('No validation result to finalize');
    }

    // Determine final status
    if (!validation.isConsistent) {
      if (validation.confidence < ctx.config.repair.escalationThreshold) {
        // Would be 'escalated'
      } else {
        // Would be 'failed'
      }
    }

    const duration = Date.now() - startTime;
    ctx.stages.push({
      stage: 'finalize_result',
      success: true,
      duration,
    });

    return { success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.stages.push({
      stage: 'finalize_result',
      success: false,
      duration,
      error: errorMsg,
    });

    ctx.errors.push(`Finalization failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Main pipeline orchestration
 */
export async function executeOraclePipeline(
  template: TestCaseInputTemplate,
  problemStatement: string,
  constraints: string,
  examples: string,
  generationSeed: string,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<PipelineResult> {
  const overallStartTime = Date.now();

  const ctx: PipelineContext = {
    template,
    problemStatement,
    constraints,
    examples,
    generationSeed,
    config,
    stages: [],
    errors: [],
    metrics: {
      retryCount: 0,
      autoRepairCount: 0,
      escalationCount: 0,
    },
  };

  try {
    // Stage 1: Materialize test case
    const materializeResult = await stageMaterializeTestCase(ctx);
    if (!materializeResult.success) {
      throw new TemplateDslError(`Materialization failed: ${materializeResult.error}`);
    }

    // Stage 2: Generate model answer
    const generateResult = await stageGenerateModelAnswer(ctx);
    if (!generateResult.success) {
      throw new TemplateDslError(`Generation failed: ${generateResult.error}`);
    }

    // Stage 3: Create oracle pair
    const pairResult = await stageCreateOraclePair(ctx, materializeResult.testCase, generateResult.answer);
    if (!pairResult.success) {
      throw new TemplateDslError(`Pair creation failed: ${pairResult.error}`);
    }

    // Stage 4: Validate oracle pair
    const validationResult = await stageValidateOraclePair(ctx, pairResult.pair);
    if (!validationResult.success) {
      throw new TemplateDslError(`Validation failed: ${validationResult.error}`);
    }

    // Stage 5: Repair if needed
    const repairResult = await stageRepairIfNeeded(ctx, pairResult.pair, validationResult.validation);
    if (!repairResult.success) {
      // Check if it's escalation vs real failure
      if (repairResult.error === 'Escalated') {
        // This is expected escalation, not a hard failure
        const finalizeResult = await stageFinalizeResult(ctx, repairResult.pair);
        if (!finalizeResult.success) {
          ctx.errors.push(finalizeResult.error || 'Finalization failed');
        }
      } else {
        throw new TemplateDslError(`Repair failed: ${repairResult.error}`);
      }
    } else {
      // Stage 6: Finalize result
      const finalizeResult = await stageFinalizeResult(ctx, repairResult.pair);
      if (!finalizeResult.success) {
        throw new TemplateDslError(`Finalization failed: ${finalizeResult.error}`);
      }
    }

    // Determine final status
    const hasConsistentPair = ctx.currentValidation?.isConsistent || false;
    const finalStatus: 'success' | 'escalated' | 'failed' = hasConsistentPair
      ? 'success'
      : ctx.metrics.escalationCount > 0
        ? 'escalated'
        : 'failed';

    const totalDuration = Date.now() - overallStartTime;

    return {
      success: finalStatus === 'success',
      oraclePair: ctx.currentPair,
      validation: ctx.currentValidation,
      stages: ctx.stages,
      totalDuration,
      finalStatus,
      errors: ctx.errors,
      metrics: {
        stageTimings: ctx.stages.reduce(
          (acc, stage) => {
            acc[stage.stage] = (acc[stage.stage] || 0) + stage.duration;
            return acc;
          },
          {} as Record<string, number>
        ),
        ...ctx.metrics,
      },
    };
  } catch (error) {
    const totalDuration = Date.now() - overallStartTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    ctx.errors.push(errorMsg);

    return {
      success: false,
      stages: ctx.stages,
      totalDuration,
      finalStatus: 'failed',
      errors: ctx.errors,
      metrics: {
        stageTimings: ctx.stages.reduce(
          (acc, stage) => {
            acc[stage.stage] = (acc[stage.stage] || 0) + stage.duration;
            return acc;
          },
          {} as Record<string, number>
        ),
        ...ctx.metrics,
      },
    };
  }
}

/**
 * Batch pipeline execution
 */
export async function executePipelineBatch(
  items: Array<{
    template: TestCaseInputTemplate;
    problemStatement: string;
    constraints: string;
    examples: string;
    generationSeed: string;
  }>,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];

  for (const item of items) {
    const result = await executeOraclePipeline(
      item.template,
      item.problemStatement,
      item.constraints,
      item.examples,
      item.generationSeed,
      config
    );
    results.push(result);
  }

  return results;
}

/**
 * Pipeline summary statistics
 */
export interface PipelineSummary {
  totalPipelines: number;
  successCount: number;
  escalatedCount: number;
  failedCount: number;
  successRate: number;
  escalationRate: number;
  averageDuration: number;
  totalErrors: number;
  stageHealthScores: Record<string, number>; // success rate per stage
}

/**
 * Calculate batch execution summary
 */
export function calculatePipelineSummary(results: PipelineResult[]): PipelineSummary {
  const totalPipelines = results.length;
  const successCount = results.filter((r) => r.finalStatus === 'success').length;
  const escalatedCount = results.filter((r) => r.finalStatus === 'escalated').length;
  const failedCount = results.filter((r) => r.finalStatus === 'failed').length;

  // Calculate stage health
  const stageHealthScores: Record<string, number> = {};
  const stageCounts: Record<string, { success: number; total: number }> = {};

  results.forEach((result) => {
    result.stages.forEach((stage) => {
      if (!stageCounts[stage.stage]) {
        stageCounts[stage.stage] = { success: 0, total: 0 };
      }
      stageCounts[stage.stage].total++;
      if (stage.success) {
        stageCounts[stage.stage].success++;
      }
    });
  });

  Object.entries(stageCounts).forEach(([stage, counts]) => {
    stageHealthScores[stage] = counts.success / counts.total;
  });

  const totalDuration = results.reduce((sum, r) => sum + r.totalDuration, 0);
  const averageDuration = totalPipelines > 0 ? totalDuration / totalPipelines : 0;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  return {
    totalPipelines,
    successCount,
    escalatedCount,
    failedCount,
    successRate: totalPipelines > 0 ? successCount / totalPipelines : 0,
    escalationRate: totalPipelines > 0 ? escalatedCount / totalPipelines : 0,
    averageDuration,
    totalErrors,
    stageHealthScores,
  };
}
