/**
 * Integration Tests: Pipeline End-to-End Orchestration
 *
 * Tests for:
 * - Complete pipeline execution
 * - Stage progression and error handling
 * - Batch processing
 * - Summary statistics
 * - Recovery and resilience
 *
 * Run with: npm test -- oracle-pairs.pipeline.e2e.test.ts
 */

import { describe, test, expect } from 'vitest';
import {
  executeOraclePipeline,
  executePipelineBatch,
  calculatePipelineSummary,
  DEFAULT_PIPELINE_CONFIG,
} from '../../lib/ai/oracle-pairs';
import type { PipelineConfig, PipelineResult, TestCaseInputTemplate } from '../../lib/ai/oracle-pairs';

describe('Pipeline End-to-End Orchestration', () => {
  describe('Single Pipeline Execution', () => {
    test('should execute complete pipeline successfully', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Find factorial of N',
        '1 <= N <= 10',
        'Input: 5\nOutput: 120',
        'seed-pipeline-001'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stages');
      expect(result).toHaveProperty('totalDuration');
      expect(result).toHaveProperty('finalStatus');
      expect(result.stages.length).toBeGreaterThan(0);
    });

    test('should track all pipeline stages', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Test problem',
        'No constraints',
        'No examples',
        'seed-pipeline-002'
      );

      const stageNames = result.stages.map((s) => s.stage);

      // Should include at least these stages
      expect(stageNames).toContain('materialize_test_case');
      expect(stageNames).toContain('generate_model_answer');
      expect(stageNames).toContain('create_oracle_pair');
      expect(stageNames).toContain('validate_oracle_pair');
      expect(stageNames).toContain('repair_if_needed');
      expect(stageNames).toContain('finalize_result');
    });

    test('should measure stage durations', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-pipeline-003'
      );

      result.stages.forEach((stage) => {
        expect(stage.duration).toBeGreaterThanOrEqual(0);
        expect(typeof stage.duration).toBe('number');
      });

      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
    });

    test('should record success status for each stage', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-pipeline-004'
      );

      result.stages.forEach((stage) => {
        expect(typeof stage.success).toBe('boolean');
      });
    });

    test('should include oracle pair in result', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-pipeline-005'
      );

      if (result.success) {
        expect(result.oraclePair).toBeDefined();
        expect(result.oraclePair?.generationSeed).toBe('seed-pipeline-005');
      }
    });

    test('should include validation result', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-pipeline-006'
      );

      expect(result.validation).toBeDefined();
      if (result.validation) {
        expect(result.validation.generationSeed).toBe('seed-pipeline-006');
        expect(result.validation).toHaveProperty('isConsistent');
      }
    });

    test('should determine final status correctly', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-pipeline-007'
      );

      expect(result.finalStatus).toMatch(/success|escalated|failed/);
    });

    test('should collect error messages', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-pipeline-008'
      );

      expect(Array.isArray(result.errors)).toBe(true);
      // May or may not have errors
      expect(typeof result.errors).toBe('object');
    });
  });

  describe('Batch Pipeline Execution', () => {
    test('should execute batch of pipelines', async () => {
      const items = [
        {
          template: { variables: [], output: '' } as unknown as TestCaseInputTemplate,
          problemStatement: 'Problem 1',
          constraints: 'C1',
          examples: 'E1',
          generationSeed: 'seed-batch-001',
        },
        {
          template: { variables: [], output: '' } as unknown as TestCaseInputTemplate,
          problemStatement: 'Problem 2',
          constraints: 'C2',
          examples: 'E2',
          generationSeed: 'seed-batch-002',
        },
        {
          template: { variables: [], output: '' } as unknown as TestCaseInputTemplate,
          problemStatement: 'Problem 3',
          constraints: 'C3',
          examples: 'E3',
          generationSeed: 'seed-batch-003',
        },
      ];

      const results = await executePipelineBatch(items);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('stages');
        expect(result).toHaveProperty('finalStatus');
      });
    });

    test('should maintain seed for each batch item', async () => {
      const items = Array(3)
        .fill(0)
        .map((_, i) => ({
          template: { variables: [], output: '' } as unknown as TestCaseInputTemplate,
          problemStatement: `Problem ${i}`,
          constraints: 'Constraints',
          examples: 'Examples',
          generationSeed: `seed-batch-item-${i}`,
        }));

      const results = await executePipelineBatch(items);

      results.forEach((result, i) => {
        expect(result.oraclePair?.generationSeed).toBe(`seed-batch-item-${i}`);
      });
    });

    test('should complete all items even if some fail', async () => {
      const items = Array(5)
        .fill(0)
        .map((_, i) => ({
          template: { variables: [], output: '' } as unknown as TestCaseInputTemplate,
          problemStatement: `Problem ${i}`,
          constraints: i % 2 === 0 ? 'Valid constraints' : '',
          examples: 'Examples',
          generationSeed: `seed-batch-resilience-${i}`,
        }));

      const results = await executePipelineBatch(items);

      expect(results).toHaveLength(5);
      // All should complete regardless of success/failure
      results.forEach((result) => {
        expect(result).toHaveProperty('finalStatus');
      });
    });
  });

  describe('Pipeline Summary Statistics', () => {
    test('should calculate success metrics', () => {
      const mockResults: PipelineResult[] = [
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 1000,
          errors: [],
        },
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 1200,
          errors: [],
        },
        {
          success: false,
          finalStatus: 'failed',
          stages: [],
          totalDuration: 800,
          errors: ['Error 1'],
        },
      ];

      const summary = calculatePipelineSummary(mockResults);

      expect(summary.totalPipelines).toBe(3);
      expect(summary.successCount).toBe(2);
      expect(summary.failedCount).toBe(1);
      expect(summary.successRate).toBe(2 / 3);
    });

    test('should track escalation rate', () => {
      const mockResults: PipelineResult[] = [
        {
          success: false,
          finalStatus: 'escalated',
          stages: [],
          totalDuration: 1000,
          errors: [],
        },
        {
          success: false,
          finalStatus: 'escalated',
          stages: [],
          totalDuration: 1000,
          errors: [],
        },
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 1000,
          errors: [],
        },
      ];

      const summary = calculatePipelineSummary(mockResults);

      expect(summary.escalatedCount).toBe(2);
      expect(summary.escalationRate).toBe(2 / 3);
    });

    test('should calculate average duration', () => {
      const mockResults: PipelineResult[] = [
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 1000,
          errors: [],
        },
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 2000,
          errors: [],
        },
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 3000,
          errors: [],
        },
      ];

      const summary = calculatePipelineSummary(mockResults);

      expect(summary.averageDuration).toBeCloseTo(2000, 1);
    });

    test('should calculate stage health scores', () => {
      const mockResults: PipelineResult[] = [
        {
          success: true,
          finalStatus: 'success',
          stages: [
            { stage: 'stage1', success: true, duration: 100 },
            { stage: 'stage2', success: true, duration: 100 },
          ],
          totalDuration: 200,
          errors: [],
        },
        {
          success: false,
          finalStatus: 'failed',
          stages: [
            { stage: 'stage1', success: true, duration: 100 },
            { stage: 'stage2', success: false, duration: 100 },
          ],
          totalDuration: 200,
          errors: ['Error'],
        },
      ];

      const summary = calculatePipelineSummary(mockResults);

      expect(summary.stageHealthScores['stage1']).toBe(1.0); // 2/2 success
      expect(summary.stageHealthScores['stage2']).toBe(0.5); // 1/2 success
    });

    test('should count total errors', () => {
      const mockResults: PipelineResult[] = [
        {
          success: true,
          finalStatus: 'success',
          stages: [],
          totalDuration: 1000,
          errors: ['Error 1', 'Error 2'],
        },
        {
          success: false,
          finalStatus: 'failed',
          stages: [],
          totalDuration: 1000,
          errors: ['Error 3'],
        },
      ];

      const summary = calculatePipelineSummary(mockResults);

      expect(summary.totalErrors).toBe(3);
    });
  });

  describe('Configuration & Customization', () => {
    test('should use default config when not provided', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-default-config'
      );

      expect(result).toHaveProperty('stages');
      expect(result.stages.length).toBeGreaterThan(0);
    });

    test('should accept custom config', async () => {
      const customConfig: PipelineConfig = {
        ...DEFAULT_PIPELINE_CONFIG,
        resilience: {
          maxRetries: 5,
          retryDelayMs: 1000,
          timeoutMs: 120000,
          enableFallback: true,
        },
      };

      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-custom-config',
        customConfig
      );

      expect(result).toHaveProperty('stages');
    });

    test('should respect timeout config', async () => {
      const config: PipelineConfig = {
        ...DEFAULT_PIPELINE_CONFIG,
        resilience: {
          ...DEFAULT_PIPELINE_CONFIG.resilience,
          timeoutMs: 100, // Very short timeout
        },
      };

      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-timeout-config',
        config
      );

      // Should complete (possibly with errors) even with short timeout
      expect(result).toHaveProperty('totalDuration');
    });
  });

  describe('Metrics & Observability', () => {
    test('should include stage timing metrics', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-metrics-001'
      );

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.stageTimings).toBeDefined();
      expect(typeof result.metrics?.stageTimings).toBe('object');
    });

    test('should track retry count in metrics', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-metrics-002'
      );

      expect(result.metrics?.retryCount).toBeDefined();
      expect(typeof result.metrics?.retryCount).toBe('number');
    });

    test('should track repair count in metrics', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-metrics-003'
      );

      expect(result.metrics?.autoRepairCount).toBeDefined();
    });

    test('should track escalation count in metrics', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Problem',
        'Constraints',
        'Examples',
        'seed-metrics-004'
      );

      expect(result.metrics?.escalationCount).toBeDefined();
    });
  });

  describe('Error Handling & Recovery', () => {
    test('should handle empty problem statement gracefully', async () => {
      const result = await executeOraclePipeline({} as unknown as TestCaseInputTemplate, '', 'Constraints', 'Examples', 'seed-empty-problem');

      expect(result).toHaveProperty('finalStatus');
      expect(result.stages.length).toBeGreaterThan(0);
    });

    test('should record errors in result', async () => {
      const result = await executeOraclePipeline({} as unknown as TestCaseInputTemplate, '', '', '', '');

      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should continue on individual stage failures', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Test Problem',
        'Constraints',
        'Examples',
        'seed-stage-failure'
      );

      // Should still have result structure even if stages fail
      expect(result).toHaveProperty('stages');
      expect(result).toHaveProperty('finalStatus');
    });

    test('should handle malformed input gracefully', async () => {
      const result = await executeOraclePipeline(
        null as unknown as TestCaseInputTemplate,
        null as unknown as string,
        null as unknown as string,
        null as unknown as string,
        'seed-malformed'
      );

      expect(result.success === false || result.finalStatus !== 'success').toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle factorial problem', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Calculate factorial of N',
        '1 <= N <= 10',
        'Input: 5\nOutput: 120\nInput: 3\nOutput: 6',
        'seed-factorial'
      );

      expect(result).toHaveProperty('oraclePair');
      expect(result).toHaveProperty('validation');
    });

    test('should handle fibonacci sequence problem', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Find Nth Fibonacci number',
        '1 <= N <= 30',
        'Input: 5\nOutput: 5\nInput: 10\nOutput: 55',
        'seed-fibonacci'
      );

      expect(result.stages.length).toBeGreaterThan(0);
    });

    test('should handle sorting problem', async () => {
      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        'Sort array in ascending order',
        'Array size up to 1000',
        'Input: 3 1 4 1 5\nOutput: 1 1 3 4 5',
        'seed-sorting'
      );

      expect(result).toHaveProperty('finalStatus');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long problem statements', async () => {
      const longStatement = 'x'.repeat(10000);

      const result = await executeOraclePipeline(
        {} as unknown as TestCaseInputTemplate,
        longStatement,
        'Constraints',
        'Examples',
        'seed-long-problem'
      );

      expect(result.stages.length).toBeGreaterThan(0);
    });

    test('should handle special characters in seeds', async () => {
      const specialSeeds = ['seed-dash-1', 'seed_underscore_2', 'seed.dot.3', 'seed12345'];

      for (const seed of specialSeeds) {
        const result = await executeOraclePipeline({} as unknown as TestCaseInputTemplate, 'Problem', 'Constraints', 'Examples', seed);
        expect(result).toHaveProperty('finalStatus');
      }
    });

    test('should handle concurrent pipeline executions', async () => {
      const promises = Array(5)
        .fill(0)
        .map((_, i) =>
          executeOraclePipeline({} as unknown as TestCaseInputTemplate, `Problem ${i}`, 'Constraints', 'Examples', `seed-concurrent-${i}`)
        );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toHaveProperty('finalStatus');
      });
    });
  });
});
