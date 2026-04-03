/**
 * Unit Tests: Repair Engine & Differential Tester
 *
 * Tests for:
 * - Repair decision making based on confidence
 * - Auto-repair vs escalation logic
 * - Differential oracle consensus voting
 * - Failure mode analysis
 * - Multi-implementation consensus
 *
 * Run with: npm test -- oracle-pairs.repair.unit.test.ts
 */

import { describe, test, expect } from 'vitest';
import {
  makeRepairDecision,
  normalizeOutput,
  reachConsensus,
  analyzeFailureMode,
  selectDiverseImplementations,
  scoreConsensusConfidence,
  createTestCase,
  createModelAnswer,
  createOraclePair,
  DEFAULT_REPAIR_CONFIG,
} from '../../lib/ai/oracle-pairs';
import type { RepairContext } from '../../lib/ai/oracle-pairs';

describe('Repair Engine & Differential Tester', () => {
  describe('Repair Decision Making', () => {
    test('should recommend escalation forlow confidence', () => {
      const pair = createOraclePair(
        createTestCase('1', '2', 'seed-001', 'resolved', { x: 1 }),
        createModelAnswer('code', 'python', 'seed-001')
      );

      const context: RepairContext = {
        pair,
        validation: {
          version: 1,
          oraclePairId: 'test',
          generationSeed: 'seed-001',
          timestamp: new Date().toISOString(),
          isConsistent: false,
          testCaseStatus: 'valid',
          modelAnswerStatus: 'correct',
          expectedOutput: '2',
          actualOutput: '3',
          outputMatch: false,
          failureAttributed: 'unknown',
          confidence: 0.3, // Low confidence
          diagnostics: {
            constraintViolations: [],
            executionErrors: [],
            nonDeterminismDetected: false,
          },
        },
        repairAttempt: 0,
        confidenceBefore: 0.3,
        estimatedConfidenceAfter: 0.24,
      };

      const decision = makeRepairDecision(context, DEFAULT_REPAIR_CONFIG);

      expect(decision.recommendedEscalation).toBe(true);
      expect(decision.action).toBe('manual_review');
    });

    test('should auto-repair with high confidence', () => {
      const pair = createOraclePair(
        createTestCase('1', '2', 'seed-001', 'resolved', { x: 1 }),
        createModelAnswer('code', 'python', 'seed-001')
      );

      const context: RepairContext = {
        pair,
        validation: {
          version: 1,
          oraclePairId: 'test',
          generationSeed: 'seed-001',
          timestamp: new Date().toISOString(),
          isConsistent: false,
          testCaseStatus: 'valid',
          modelAnswerStatus: 'wrong',
          expectedOutput: '2',
          actualOutput: '3',
          outputMatch: false,
          failureAttributed: 'model_answer_error',
          confidence: 0.95, // High confidence
          diagnostics: {
            constraintViolations: [],
            executionErrors: [],
            nonDeterminismDetected: false,
          },
        },
        repairAttempt: 0,
        confidenceBefore: 0.95,
        estimatedConfidenceAfter: 0.76,
      };

      const decision = makeRepairDecision(context, DEFAULT_REPAIR_CONFIG);

      expect(decision.isAutoRepair).toBe(true);
      expect(decision.recommendedEscalation).toBe(false);
    });

    test('should recommend differential oracle for unknown failures', () => {
      const pair = createOraclePair(
        createTestCase('1', '2', 'seed-001', 'resolved', { x: 1 }),
        createModelAnswer('code', 'python', 'seed-001')
      );

      const context: RepairContext = {
        pair,
        validation: {
          version: 1,
          oraclePairId: 'test',
          generationSeed: 'seed-001',
          timestamp: new Date().toISOString(),
          isConsistent: false,
          testCaseStatus: 'valid',
          modelAnswerStatus: 'correct',
          expectedOutput: '2',
          actualOutput: '3',
          outputMatch: false,
          failureAttributed: 'unknown',
          confidence: 0.5,
          diagnostics: {
            constraintViolations: [],
            executionErrors: [],
            nonDeterminismDetected: false,
          },
        },
        repairAttempt: 0,
        confidenceBefore: 0.5,
        estimatedConfidenceAfter: 0.4,
      };

      const decision = makeRepairDecision(context, DEFAULT_REPAIR_CONFIG);

      expect(decision.action).toBe('use_reference_implementation');
      expect(decision.isAutoRepair).toBe(false);
    });

    test('should escalate after max repair attempts', () => {
      const pair = createOraclePair(
        createTestCase('1', '2', 'seed-001', 'resolved', { x: 1 }),
        createModelAnswer('code', 'python', 'seed-001')
      );

      const context: RepairContext = {
        pair,
        validation: {
          version: 1,
          oraclePairId: 'test',
          generationSeed: 'seed-001',
          timestamp: new Date().toISOString(),
          isConsistent: false,
          testCaseStatus: 'valid',
          modelAnswerStatus: 'correct',
          expectedOutput: '2',
          actualOutput: '3',
          outputMatch: false,
          failureAttributed: 'unknown',
          confidence: 0.95, // High confidence
          diagnostics: {
            constraintViolations: [],
            executionErrors: [],
            nonDeterminismDetected: false,
          },
        },
        repairAttempt: DEFAULT_REPAIR_CONFIG.maxAttempts, // At max
        confidenceBefore: 0.95,
        estimatedConfidenceAfter: 0.75,
      };

      const decision = makeRepairDecision(context, DEFAULT_REPAIR_CONFIG);

      expect(decision.recommendedEscalation).toBe(true);
    });
  });

  describe('Output Normalization', () => {
    test('should normalize whitespace', () => {
      const output1 = '  1  2  3  \n';
      const output2 = '1\n2\n3';

      const norm1 = normalizeOutput(output1);
      normalizeOutput(output2); // Verify it doesn't throw

      expect(norm1).toContain('1');
      expect(norm1).toContain('2');
      expect(norm1).toContain('3');
    });

    test('should remove empty lines', () => {
      const output = 'line1\n\n\nline2\n\n';

      const normalized = normalizeOutput(output);

      expect(normalized).not.toContain('line1\n\n');
      expect(normalized.split('\n')).toHaveLength(2);
    });

    test('should trim each line', () => {
      const output = '  line1  \n  line2  \n';

      const normalized = normalizeOutput(output);

      expect(normalized).toBe('line1\nline2');
    });
  });

  describe('Consensus Voting', () => {
    test('should determine consensus from votes', () => {
      const votes = [
        { implementation: 'impl1', output: 'correct', passed: true, error: undefined },
        { implementation: 'impl2', output: 'correct', passed: true, error: undefined },
        { implementation: 'impl3', output: 'wrong', passed: false, error: undefined },
      ];

      const consensus = reachConsensus(votes, 'correct', [
        { name: 'impl1' },
        { name: 'impl2' },
        { name: 'impl3' },
      ]);

      expect(consensus.consensusOutput).toBe('correct');
      expect(consensus.majorityWin).toBe(true);
      expect(consensus.confidenceScore).toBeGreaterThan(0.5);
    });

    test('should attribute error to model answer when consensus matches expected', () => {
      const votes = [
        { implementation: 'ref1', output: 'correct', passed: true, error: undefined },
        { implementation: 'ref2', output: 'correct', passed: true, error: undefined },
        { implementation: 'model', output: 'wrong', passed: false, error: undefined },
      ];

      const consensus = reachConsensus(votes, 'correct', [
        { name: 'ref1' },
        { name: 'ref2' },
        { name: 'model' },
      ]);

      expect(consensus.attribution).toBe('model_answer_error');
    });

    test('should attribute error to test case when consensus differs from expected', () => {
      const votes = [
        { implementation: 'ref1', output: 'different', passed: false, error: undefined },
        { implementation: 'ref2', output: 'different', passed: false, error: undefined },
        { implementation: 'model', output: 'different', passed: false, error: undefined },
      ];

      const consensus = reachConsensus(votes, 'expected', [
        { name: 'ref1' },
        { name: 'ref2' },
        { name: 'model' },
      ]);

      expect(consensus.attribution).toBe('test_case_error');
    });

    test('should score confidence based on voting strength', () => {
      // Unanimous vote
      const unanimousVotes = [
        { implementation: 'impl1', output: 'result', passed: true, error: undefined },
        { implementation: 'impl2', output: 'result', passed: true, error: undefined },
        { implementation: 'impl3', output: 'result', passed: true, error: undefined },
      ];

      const unanimous = reachConsensus(unanimousVotes, 'result', [
        { name: 'impl1' },
        { name: 'impl2' },
        { name: 'impl3' },
      ]);

      // Close vote
      const closeVotes = [
        { implementation: 'impl1', output: 'result1', passed: true, error: undefined },
        { implementation: 'impl2', output: 'result2', passed: true, error: undefined },
        { implementation: 'impl3', output: 'result1', passed: true, error: undefined },
      ];

      const close = reachConsensus(closeVotes, 'result1', [
        { name: 'impl1' },
        { name: 'impl2' },
        { name: 'impl3' },
      ]);

      // Unanimous should have higher confidence
      expect(unanimous.confidenceScore).toBeGreaterThan(close.confidenceScore);
    });
  });

  describe('Failure Mode Analysis', () => {
    test('should detect model answer error', () => {
      const analysis = analyzeFailureMode(
        '100', // expected
        '101', // actual from model
        '100' // consensus agrees with expected
      );

      expect(analysis.likelyError).toBe('model_answer');
      expect(analysis.confidence).toBeGreaterThan(0.8);
    });

    test('should detect test case error', () => {
      const analysis = analyzeFailureMode(
        '100', // expected
        '99', // actual
        '99' // consensus disagrees
      );

      expect(analysis.likelyError).toBe('test_case');
    });

    test('should detect both wrong when consensus differs', () => {
      const analysis = analyzeFailureMode(
        '100', // expected
        '50', // actual
        '75' // consensus is different from both
      );

      expect(analysis.likelyError).toBe('both');
    });
  });

  describe('Implementation Diversity', () => {
    test('should select diverse implementations', () => {
      const answers = [
        createModelAnswer('code1', 'python', 'seed-001', 'claude-1'),
        createModelAnswer('code2', 'python', 'seed-002', 'claude-2'),
        createModelAnswer('code3', 'cpp', 'seed-003', 'gpt-1'),
        createModelAnswer('code4', 'java', 'seed-004', 'claude-3'),
      ];

      const selected = selectDiverseImplementations(answers, 3);

      expect(selected).toHaveLength(3);
      expect(selected[0]).toHaveProperty('weight');
      expect(selected[0].weight).toBeGreaterThan(0);
    });

    test('should score consensus confidence from results', () => {
      const consensus = {
        consensusOutput: 'result',
        votingWeights: {},
        majorityWin: true,
        confidenceScore: 0.9,
        votingDetails: [],
        attribution: 'model_answer_error' as const,
      };

      const score = scoreConsensusConfidence(consensus, {
        passed: 3,
        failed: 0,
      });

      expect(score).toBeGreaterThan(0.8);
    });

    test('should lower confidence for low pass rates', () => {
      const consensus = {
        consensusOutput: 'result',
        votingWeights: {},
        majorityWin: true,
        confidenceScore: 0.9,
        votingDetails: [],
        attribution: 'model_answer_error' as const,
      };

      const highScore = scoreConsensusConfidence(consensus, { passed: 3, failed: 0 });
      const lowScore = scoreConsensusConfidence(consensus, { passed: 1, failed: 2 });

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty outputs', () => {
      const consensus = reachConsensus(
        [
          { implementation: 'impl1', output: '', passed: true, error: undefined },
          { implementation: 'impl2', output: '', passed: true, error: undefined },
        ],
        '',
        [{ name: 'impl1' }, { name: 'impl2' }]
      );

      expect(consensus.consensusOutput).toBe('');
    });

    test('should handle execution errors in votes', () => {
      const votes = [
        { implementation: 'impl1', output: 'result', passed: true, error: undefined },
        { implementation: 'impl2', output: '', passed: false, error: 'Timeout' },
        { implementation: 'impl3', output: 'result', passed: true, error: undefined },
      ];

      const consensus = reachConsensus(votes, 'result', [
        { name: 'impl1' },
        { name: 'impl2' },
        { name: 'impl3' },
      ]);

      expect(consensus.consensusOutput).toBe('result');
      expect(consensus.majorityWin).toBe(true);
    });

    test('should handle single vote', () => {
      const votes = [{ implementation: 'impl1', output: 'only_result', passed: true, error: undefined }];

      const consensus = reachConsensus(votes, 'only_result', [{ name: 'impl1' }]);

      expect(consensus.consensusOutput).toBe('only_result');
    });
  });
});
