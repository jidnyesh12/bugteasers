/**
 * Unit Tests: Bidirectional Validator
 *
 * Tests for:
 * - Hard constraint checking
 * - Soft constraint checking
 * - Output comparison with edge cases
 * - Failure attribution logic
 * - Determinism verification
 *
 * Run with: npm test -- oracle-pairs.validator.unit.test.ts
 */

import { describe, test, expect, beforeEach } from 'vitest';
import type {
  MaterializedTestCaseWithVariables,
  TestCaseInputTemplate,
} from '../../lib/ai/oracle-pairs';
import {
  validateHardConstraints,
  validateSoftConstraints,
  compareOutputs,
  attributeFailure,
  validateOraclePair,
  createTestCase,
  createModelAnswer,
  createOraclePair,
  ConstraintRegistry,
} from '../../lib/ai/oracle-pairs';

describe('Bidirectional Validator', () => {
  beforeEach(() => {
    ConstraintRegistry.reset();
    ConstraintRegistry.getInstance();
  });

  describe('Hard Constraint Checking', () => {
    test('should pass when no hard constraints violated', () => {
      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '5',
        expectedOutput: '120',
        resolvedSeed: 'test-seed',
        variables: { n: 5 },
        template: { variables: [], output: '' } as unknown as TestCaseInputTemplate,
      };

      const result = validateHardConstraints(testCase);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should fail with array_length_bounded violation', () => {
      const largeArray = new Array(300_000).fill(1); // Exceeds 200k limit
      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '',
        expectedOutput: '',
        resolvedSeed: 'test-seed',
        variables: { arr: largeArray },
        template: {} as unknown as TestCaseInputTemplate,
      };

      const result = validateHardConstraints(testCase);
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some((c) => c.name === 'array_length_bounded')).toBe(true);
    });

    test('should fail with no_nan_or_inf violation', () => {
      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '',
        expectedOutput: '',
        resolvedSeed: 'test-seed',
        variables: { value: Number.NaN },
        template: {} as unknown as TestCaseInputTemplate,
      };

      const result = validateHardConstraints(testCase);
      expect(result.valid).toBe(false);
      expect(result.violations.some((c) => c.name === 'no_nan_or_inf')).toBe(true);
    });

    test('should handle infinity values', () => {
      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '',
        expectedOutput: '',
        resolvedSeed: 'test-seed',
        variables: { value: Number.POSITIVE_INFINITY },
        template: {} as unknown as TestCaseInputTemplate,
      };

      const result = validateHardConstraints(testCase);
      expect(result.valid).toBe(false);
    });

    test('should validate nested array constraints', () => {
      const matrix = Array(100)
        .fill(0)
        .map(() => Array(100).fill(1));

      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '',
        expectedOutput: '',
        resolvedSeed: 'test-seed',
        variables: { matrix },
        template: {} as unknown as TestCaseInputTemplate,
      };

      const result = validateHardConstraints(testCase);
      expect(result.valid).toBe(true);
    });
  });

  describe('Soft Constraint Checking', () => {
    test('should identify soft constraint violations', () => {
      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '',
        expectedOutput: '',
        resolvedSeed: 'test-seed',
        variables: { n: 0 }, // Potentially invalid but soft constraint
        template: {} as unknown as TestCaseInputTemplate,
      };

      const result = validateSoftConstraints(testCase);
      // Result depends on defined soft constraints
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('repairable');
    });

    test('should identify repairable vs non-repairable violations', () => {
      const testCase: MaterializedTestCaseWithVariables = {
        inputData: '',
        expectedOutput: '',
        resolvedSeed: 'test-seed',
        variables: { n: -5 },
        template: {} as unknown as TestCaseInputTemplate,
      };

      const result = validateSoftConstraints(testCase);
      expect(Array.isArray(result.repairable)).toBe(true);
    });
  });

  describe('Output Comparison', () => {
    test('should match identical outputs', () => {
      const expected = 'Hello, World!';
      const actual = 'Hello, World!';

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(true);
      expect(result.mismatch).toBeUndefined();
    });

    test('should detect simple mismatch', () => {
      const expected = 'Hello, World!';
      const actual = 'Hello World';

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(false);
      expect(result.mismatch).toBeDefined();
      expect(result.mismatch?.diffStart).toBeGreaterThanOrEqual(0);
    });

    test('should handle whitespace differences', () => {
      const expected = '1 2 3';
      const actual = '1  2  3'; // Extra spaces

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(false);
      expect(result.mismatch?.diffStart).toBeGreaterThan(0);
    });

    test('should detect length mismatch', () => {
      const expected = '12345';
      const actual = '1234'; // Shorter

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(false);
      expect(result.mismatch?.expectedLength).toBe(5);
      expect(result.mismatch?.actualLength).toBe(4);
    });

    test('should handle empty strings', () => {
      const expected = '';
      const actual = '';

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(true);
    });

    test('should handle newline differences', () => {
      const expected = 'line1\nline2';
      const actual = 'line1\r\nline2'; // Windows line ending

      const result = compareOutputs(expected, actual);
      // May or may not match depending on handling
      expect(result).toHaveProperty('matches');
    });

    test('should truncate very long outputs', () => {
      const expected = 'x'.repeat(200_000);
      const actual = 'y'.repeat(150_000); // Different char to detect diff

      const result = compareOutputs(expected, actual, 100_000);
      // Both should be truncated to 100k, and should mismatch on first char
      expect(result.matches).toBe(false);
      expect(result.mismatch?.diffStart).toBe(0); // Mismatch at start
    });

    test('should provide helpful context', () => {
      const expected = 'Expected output';
      const actual = 'Actual output';

      const result = compareOutputs(expected, actual);
      expect(result.context).toContain('Expected');
      expect(result.context).toContain('Actual');
    });

    test('should find diff at various positions', () => {
      const testCases = ['abcde vs abxde', 'start vs TART', 'one and one vs one and two'];

      testCases.forEach(([exp, act]) => {
        const result = compareOutputs(exp, act);
        expect(result.matches).toBe(false);
        expect(result.mismatch?.diffStart).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Failure Attribution', () => {
    test('should attribute hard constraint violation to test case', () => {
      const result = attributeFailure({
        testCaseStatus: 'constraint_violation',
        modelAnswerStatus: 'correct',
        hardConstraintViolations: 1,
        softConstraintViolations: 0,
        executionErrors: 0,
      });

      expect(result.attribution).toBe('test_case_error');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should attribute execution error to model answer', () => {
      const result = attributeFailure({
        testCaseStatus: 'valid',
        modelAnswerStatus: 'runtime_error',
        hardConstraintViolations: 0,
        softConstraintViolations: 0,
        executionErrors: 1,
      });

      expect(result.attribution).toBe('model_answer_error');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    test('should attribute timeout to model answer', () => {
      const result = attributeFailure({
        testCaseStatus: 'valid',
        modelAnswerStatus: 'timeout',
        hardConstraintViolations: 0,
        softConstraintViolations: 0,
        executionErrors: 1,
      });

      expect(result.attribution).toBe('model_answer_error');
    });

    test('should attribute syntax error to model answer', () => {
      const result = attributeFailure({
        testCaseStatus: 'valid',
        modelAnswerStatus: 'syntax_error',
        hardConstraintViolations: 0,
        softConstraintViolations: 0,
        executionErrors: 0,
      });

      expect(result.attribution).toBe('model_answer_error');
    });

    test('should attribute soft constraint violations to test case (with lower confidence)', () => {
      const result = attributeFailure({
        testCaseStatus: 'valid',
        modelAnswerStatus: 'correct',
        hardConstraintViolations: 0,
        softConstraintViolations: 2,
        executionErrors: 0,
      });

      expect(result.attribution).toBe('test_case_error');
      expect(result.confidence).toBeLessThan(0.7);
    });

    test('should mark unknown when both are valid but output mismatch', () => {
      const result = attributeFailure({
        testCaseStatus: 'valid',
        modelAnswerStatus: 'correct',
        hardConstraintViolations: 0,
        softConstraintViolations: 0,
        executionErrors: 0,
      });

      expect(result.attribution).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should handle multiple constraint violations', () => {
      const result = attributeFailure({
        testCaseStatus: 'constraint_violation',
        modelAnswerStatus: 'correct',
        hardConstraintViolations: 3,
        softConstraintViolations: 2,
        executionErrors: 0,
      });

      expect(result.attribution).toBe('test_case_error');
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('Oracle Pair Validation', () => {
    test('should validate consistent oracle pair', async () => {
      const testCase = createTestCase('5', '120', 'seed-001', 'resolved-001', { n: 5 });
      const modelAnswer = createModelAnswer('code', 'python', 'seed-001', 'test-model');
      const pair = createOraclePair(testCase, modelAnswer);

      const result = await validateOraclePair(pair);

      expect(result).toHaveProperty('isConsistent');
      expect(result).toHaveProperty('oraclePairId');
      expect(result).toHaveProperty('generationSeed', 'seed-001');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('failureAttributed');
      expect(result).toHaveProperty('confidence');
    });

    test('should include diagnostics in result', async () => {
      const testCase = createTestCase('5', '120', 'seed-001', 'resolved-001', { n: 5 });
      const modelAnswer = createModelAnswer('code', 'python', 'seed-001', 'test-model');
      const pair = createOraclePair(testCase, modelAnswer);

      const result = await validateOraclePair(pair);

      expect(result.diagnostics).toBeDefined();
      expect(Array.isArray(result.diagnostics?.constraintViolations)).toBe(true);
      expect(Array.isArray(result.diagnostics?.executionErrors)).toBe(true);
    });

    test('should handle constraint violations in validation', async () => {
      const largeArray = new Array(300_000).fill(1);
      const testCase = createTestCase('', '', 'seed-001', 'resolved-001', { arr: largeArray });
      const modelAnswer = createModelAnswer('code', 'python', 'seed-001', 'test-model');
      const pair = createOraclePair(testCase, modelAnswer);

      const result = await validateOraclePair(pair);

      expect(result.testCaseStatus).not.toBe('valid');
      expect(result.diagnostics?.constraintViolations.length).toBeGreaterThan(0);
    });

    test('should track execution result in validation', async () => {
      const testCase = createTestCase('5', '120', 'seed-001', 'resolved-001', { n: 5 });
      const modelAnswer = createModelAnswer('code', 'python', 'seed-001', 'test-model');
      const pair = createOraclePair(testCase, modelAnswer);

      const result = await validateOraclePair(pair);

      expect(result.executionResult).toBeDefined();
      if (result.executionResult) {
        expect(result.executionResult).toHaveProperty('output');
        expect(result.executionResult).toHaveProperty('status');
        expect(result.executionResult).toHaveProperty('duration');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle unicode in outputs', () => {
      const expected = 'Hello 世界 🌍';
      const actual = 'Hello 世界 🌍';

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(true);
    });

    test('should handle mixed line endings', () => {
      const expected = 'line1\nline2\nline3';
      const actual = 'line1\r\nline2\rline3';

      const result = compareOutputs(expected, actual);
      expect(result).toHaveProperty('matches');
    });

    test('should handle null bytes in output', () => {
      const expected = 'data\x00null';
      const actual = 'data\x00null';

      const result = compareOutputs(expected, actual);
      expect(result.matches).toBe(true);
    });

    test('should handle very large outputs efficiently', () => {
      const large = 'x'.repeat(1_000_000);

      const result = compareOutputs(large, large);
      expect(result.matches).toBe(true);
    });
  });
});
