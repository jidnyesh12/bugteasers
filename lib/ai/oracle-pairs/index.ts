/**
 * Oracle Pairs: Main entry point
 *
 * Exports core types, functions, and registries for oracle pair generation
 * and bidirectional validation.
 */

// Import types first
import type {
  DSLConstraint,
  ConstraintCheck,
  ConstraintValidationResult,
  MaterializedTestCaseWithVariables,
  TestCase,
  ModelAnswer,
  OraclePair,
  OraclePairWithMetadata,
  ExecutionResult,
  OutputMismatch,
  OracleValidationResult,
  RepairRecommendation,
  RepairLog,
  BatchOracleGenerationResult,
  SupportedLanguage,
  FailureAttribution,
  TestCaseStatus,
  ModelAnswerStatus,
  TemplateGeneratedValue,
  TestCaseInputTemplate,
} from './types';

import { ORACLE_PAIR_VERSION, ConstraintLevel, RepairActionType, isOraclePair, isConsistent } from './types';
import type { GenerationSeedInfo } from './seeding';

// Re-export types
export type {
  DSLConstraint,
  ConstraintCheck,
  ConstraintValidationResult,
  MaterializedTestCaseWithVariables,
  TestCase,
  ModelAnswer,
  OraclePair,
  OraclePairWithMetadata,
  ExecutionResult,
  OutputMismatch,
  OracleValidationResult,
  RepairRecommendation,
  RepairLog,
  BatchOracleGenerationResult,
  SupportedLanguage,
  FailureAttribution,
  TestCaseStatus,
  ModelAnswerStatus,
  TemplateGeneratedValue,
  TestCaseInputTemplate,
  GenerationSeedInfo,
};

export { ORACLE_PAIR_VERSION, ConstraintLevel, RepairActionType, isOraclePair, isConsistent };

// Re-export seeding
export { GenerationSeed, SeedDerivationBuilder, deriveSeedsForBatch, verifyBatchSeedConsistency } from './seeding';
export { GENERATION_SEED_VERSION, GENERATION_SEED_LENGTH } from './seeding';

// Re-export constraints
export { ConstraintRegistry, getConstraintRegistry, registerConstraint, validateTestCaseConstraints } from './constraints';

// Re-export validator
export {
  validateHardConstraints,
  validateSoftConstraints,
  compareOutputs,
  attributeFailure,
  validateOraclePair,
  validateOraclePairWithDeterminismCheck,
} from './validator';
export type { ValidatorConfig, ValidationDiagnostics } from './validator';
export { DEFAULT_VALIDATOR_CONFIG } from './validator';

// Re-export executor
export { executeCode, executeAndCompare } from './executor';
export type { ExecutorConfig } from './executor';
export { DEFAULT_EXECUTOR_CONFIG } from './executor';

// Re-export LLM generator
export {
  buildGenerationPrompt,
  constructGeminiPrompt,
  constructClaudePrompt,
  validateGeneratedCode,
  generateModelAnswer,
  generateMultipleAnswers,
} from './llm-generator';
export type { LLMGeneratorConfig } from './llm-generator';
export { DEFAULT_LLM_CONFIG } from './llm-generator';

// Re-export generation orchestrator
export {
  materializeTestCase,
  generateAnswer,
  validatePair,
  attemptRepair,
  generateOraclePair,
  generateOraclePairBatch,
} from './generation-orchestrator';
export type {
  OrchestratorConfig,
  GenerationStats,
  GenerationResult,
} from './generation-orchestrator';
export { DEFAULT_ORCHESTRATOR_CONFIG } from './generation-orchestrator';

// Re-export batch utilities
export { calculateBatchStatistics } from './batch-utils';
export type { OrchestrationProgress } from './batch-utils';

// Re-export repair engine
export {
  makeRepairDecision,
  repairSoftConstraints,
  repairModelAnswer,
  repairTestCase,
  executeRepair,
  buildRepairLog,
  repairOraclePair,
} from './repair-engine';
export type { RepairConfig, RepairContext, RepairDecision } from './repair-engine';
export { DEFAULT_REPAIR_CONFIG } from './repair-engine';

// Re-export differential tester
export {
  runDifferentialOracle,
  normalizeOutput,
  reachConsensus,
  analyzeFailureMode,
  runFullDifferentialTest,
  selectDiverseImplementations,
  scoreConsensusConfidence,
} from './differential-tester';
export type { OracleVote, ConsensusDecision } from './differential-tester';

// Re-export pipeline
export {
  executeOraclePipeline,
  executePipelineBatch,
  calculatePipelineSummary,
} from './pipeline';
export type {
  PipelineConfig,
  PipelineResult,
  StageResult,
  PipelineSummary,
} from './pipeline';
export { DEFAULT_PIPELINE_CONFIG } from './pipeline';

// Factory functions

/**
 * Create a test case from materialized template
 */
export function createTestCase(
  inputData: string,
  expectedOutput: string,
  generationSeed: string,
  resolvedSeed: string,
  variables: Record<string, TemplateGeneratedValue>,
  templateVersion?: number
): TestCase {
  return {
    inputData,
    expectedOutput,
    generationSeed,
    resolvedSeed,
    variables,
    version: ORACLE_PAIR_VERSION,
    templateVersion,
  };
}

/**
 * Create a model answer
 */
export function createModelAnswer(
  code: string,
  language: SupportedLanguage,
  generationSeed: string,
  modelName?: string
): ModelAnswer {
  return {
    code,
    language,
    generationSeed,
    version: ORACLE_PAIR_VERSION,
    modelName,
    auditTrail: {
      originalSeed: generationSeed,
      timestamp: new Date().toISOString(),
      model: modelName ?? 'unknown',
      retryCount: 0,
    },
  };
}

/**
 * Create an oracle pair from test case and model answer
 * Validates that both share the same generation seed
 */
export function createOraclePair(
  testCase: TestCase,
  modelAnswer: ModelAnswer,
  metadata?: Record<string, unknown>
): OraclePair {
  // Verify seed consistency
  if (testCase.generationSeed !== modelAnswer.generationSeed) {
    throw new Error(
      `Seed mismatch: test case seed (${testCase.generationSeed}) != model answer seed (${modelAnswer.generationSeed})`
    );
  }

  return {
    version: ORACLE_PAIR_VERSION,
    generationSeed: testCase.generationSeed,
    testCase,
    modelAnswer,
    createdAt: new Date().toISOString(),
    metadata: metadata
      ? {
          problemId: typeof metadata.problemId === 'string' ? metadata.problemId : undefined,
          problemName: typeof metadata.problemName === 'string' ? metadata.problemName : undefined,
          difficulty: ['easy', 'medium', 'hard'].includes(String(metadata.difficulty)) ? (metadata.difficulty as 'easy' | 'medium' | 'hard') : undefined,
          tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : undefined,
        }
      : undefined,
  };
}

/**
 * Validate oracle pair structure
 */
export function validateOraclePairStructure(pair: unknown): pair is OraclePair {
  return isOraclePair(pair);
}

/**
 * Create oracle pair with metadata
 */
export function createOraclePairWithMetadata(
  pair: OraclePair,
  metadata?: {
    validation?: OracleValidationResult;
    repairLog?: RepairLog;
    savedAt?: string;
    savedToDatabase?: boolean;
  }
): OraclePairWithMetadata {
  return {
    ...pair,
    ...metadata,
  };
}
