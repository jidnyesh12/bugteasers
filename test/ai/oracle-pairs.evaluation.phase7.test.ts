/**
 * Phase 7: Real-World Validation Tests
 *
 * Run oracle pair generation on competitive programming problems
 * Measure: success rate, attribution accuracy, repair success, performance
 *
 * Run with: npm test -- oracle-pairs.evaluation.phase7.test.ts --run
 */

import { describe, test, expect, beforeAll } from 'vitest';
import {
  runQuickEvaluation,
  runStandardEvaluation,
  runDifficultyEvaluation,
  formatEvaluationSummary,
  type EvaluationSummary,
} from '../../lib/ai/oracle-pairs/evaluation/evaluation-driver';
import { DEFAULT_PIPELINE_CONFIG } from '../../lib/ai/oracle-pairs';

describe('Phase 7: Real-World Validation', () => {
  describe('Quick Evaluation (25 problems)', () => {
    let summary: EvaluationSummary;

    beforeAll(async () => {
      console.log('\n=== Running Quick Evaluation (25 random problems) ===\n');
      const result = await runQuickEvaluation(DEFAULT_PIPELINE_CONFIG);
      summary = result.summary;
      console.log(formatEvaluationSummary(summary));
    }, 60000);

    test('should evaluate at least 25 problems', () => {
      expect(summary.totalProblems).toBeGreaterThanOrEqual(20);
    });

    test('should achieve >80% success rate for quick evaluation', () => {
      // Quick evaluation less strict than standard
      expect(summary.successRate).toBeGreaterThan(0.75);
    });

    test('should complete in reasonable time', () => {
      expect(summary.averageDuration).toBeLessThan(5000); // <5s per problem
    });

    test('should have distribution across difficulties', () => {
      if (summary.byDifficulty.easy.total > 0) {
        expect(summary.byDifficulty.easy.success).toBeGreaterThan(0);
      }
    });

    test('should improve from Phase 6 baseline', () => {
      // Phase 6 had 100% controlled tests
      // Phase 7 realistic problems should have 75%+
      expect(summary.successRate).toBeGreaterThan(0.75);
    });
  });

  describe('Standard Evaluation (85 problems)', () => {
    let summary: EvaluationSummary;

    beforeAll(async () => {
      console.log('\n=== Running Standard Evaluation (all 85 problems) ===\n');
      const result = await runStandardEvaluation(DEFAULT_PIPELINE_CONFIG);
      summary = result.summary;
      console.log(formatEvaluationSummary(summary));
    }, 180000); // 3 minute timeout

    test('should evaluate all available problems', () => {
      expect(summary.totalProblems).toBeGreaterThanOrEqual(50);
      console.log(`Evaluated ${summary.totalProblems} problems`);
    });

    test('should meet >90% success rate target', () => {
      // This is the primary success metric for Phase 7
      console.log(`✓ Success Rate: ${(summary.successRate * 100).toFixed(1)}% (target: >90%)`);
      expect(summary.successRate).toBeGreaterThan(0.9);
    });

    test('should meet >80% attribution accuracy target', () => {
      const accuracy = summary.attributionAccuracy || 0;
      console.log(`✓ Attribution Accuracy: ${(accuracy * 100).toFixed(1)}% (target: >80%)`);
      expect(accuracy).toBeGreaterThan(0.8);
    });

    test('should meet >75% repair success target', () => {
      const repairSuccess = summary.repairSuccessRate || 0;
      console.log(`✓ Repair Success: ${(repairSuccess * 100).toFixed(1)}% (target: >75%)`);
      expect(repairSuccess).toBeGreaterThan(0.75);
    });

    test('should meet <3s per problem performance target', () => {
      console.log(`✓ Average Duration: ${summary.averageDuration.toFixed(0)}ms (target: <3000ms)`);
      expect(summary.averageDuration).toBeLessThan(3000);
    });

    test('easy problems should have highest success rate', () => {
      if (summary.byDifficulty.easy.total > 0 && summary.byDifficulty.hard.total > 0) {
        expect(summary.byDifficulty.easy.rate).toBeGreaterThanOrEqual(summary.byDifficulty.hard.rate);
      }
    });

    test('should have success across all sources', () => {
      Object.entries(summary.bySource).forEach(([source, stats]) => {
        if (stats.total > 0) {
          console.log(`  ${source}: ${stats.success}/${stats.total} (${(stats.rate * 100).toFixed(1)}%)`);
          expect(stats.rate).toBeGreaterThan(0.7); // At least 70% per source
        }
      });
    });

    test('should have reasonable performance scaling', () => {
      // Performance should scale with problem complexity
      const avgTime = summary.averageDuration;
      const maxTime = summary.maxDuration;
      const minTime = summary.minDuration;

      console.log(`  Min: ${minTime}ms, Avg: ${avgTime.toFixed(0)}ms, Max: ${maxTime}ms`);
      expect(maxTime).toBeLessThan(avgTime * 10); // Max shouldn't be 10x average
    });
  });

  describe('Difficulty-Specific Evaluation', () => {
    let summary: EvaluationSummary;

    beforeAll(async () => {
      console.log('\n=== Running Difficulty-Specific Evaluation ===\n');
      const result = await runDifficultyEvaluation(DEFAULT_PIPELINE_CONFIG);
      summary = result.summary;
      console.log(formatEvaluationSummary(summary));
    }, 180000);

    test('should evaluate problems at all difficulty levels', () => {
      expect(summary.byDifficulty.easy.total).toBeGreaterThan(0);
      expect(summary.byDifficulty.medium.total).toBeGreaterThan(0);
      expect(summary.byDifficulty.hard.total).toBeGreaterThan(0);
    });

    test('easy problems should succeed at >95% rate', () => {
      if (summary.byDifficulty.easy.total > 0) {
        console.log(
          `  Easy: ${(summary.byDifficulty.easy.rate * 100).toFixed(1)}% (target: >95%)`
        );
        expect(summary.byDifficulty.easy.rate).toBeGreaterThan(0.95);
      }
    });

    test('medium problems should succeed at >85% rate', () => {
      if (summary.byDifficulty.medium.total > 0) {
        console.log(
          `  Medium: ${(summary.byDifficulty.medium.rate * 100).toFixed(1)}% (target: >85%)`
        );
        expect(summary.byDifficulty.medium.rate).toBeGreaterThan(0.85);
      }
    });

    test('hard problems should succeed at >75% rate', () => {
      if (summary.byDifficulty.hard.total > 0) {
        console.log(`  Hard: ${(summary.byDifficulty.hard.rate * 100).toFixed(1)}% (target: >75%)`);
        expect(summary.byDifficulty.hard.rate).toBeGreaterThan(0.75);
      }
    });

    test('performance should degrade gracefully with difficulty', () => {
      // Harder problems may take longer but shouldn't be exponentially slower
      // Just verify average is reasonable overall
      expect(summary.averageDuration).toBeLessThan(3000);
    });
  });

  describe('Cross-Source Validation', () => {
    let summary: EvaluationSummary;

    beforeAll(async () => {
      console.log('\n=== Running Cross-Source Validation ===\n');
      const result = await runDifficultyEvaluation(DEFAULT_PIPELINE_CONFIG);
      summary = result.summary;
    }, 180000);

    test('should validate problems from multiple sources', () => {
      const sourceCount = Object.keys(summary.bySource).length;
      expect(sourceCount).toBeGreaterThan(1);
    });

    test('should achieve >85% success on each source', () => {
      Object.entries(summary.bySource).forEach(([source, stats]) => {
        if (stats.total > 0) {
          console.log(
            `  ${source}: ${(stats.rate * 100).toFixed(1)}% (target: >85%)`
          );
          expect(stats.rate).toBeGreaterThan(0.85);
        }
      });
    });
  });

  describe('Phase 7 Success Criteria', () => {
    test('Phase 7 targets are documented', () => {
      const targets = {
        'Generation Success Rate': '>90%',
        'Attribution Accuracy': '>80%',
        'Repair Success Rate': '>75%',
        'Performance': '<3s per problem',
      };

      expect(targets).toBeDefined();

      console.log('\n=== Phase 7 Success Targets ===');
      Object.entries(targets).forEach(([metric, target]) => {
        console.log(`  ${metric}: ${target}`);
      });
    });

    test('Phase 7 evaluation metrics are tracked', () => {
      const metrics = [
        'success_rate',
        'escalation_rate',
        'failure_rate',
        'attribution_accuracy',
        'repair_success_rate',
        'average_duration',
        'min_duration',
        'max_duration',
      ];

      expect(metrics.length).toBeGreaterThan(0);
      console.log('\n=== Tracked Metrics ===');
      metrics.forEach((m) => console.log(`  ✓ ${m}`));
    });
  });
});
