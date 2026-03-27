// Property-based tests for test case evaluator

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { TestResult, ExecutionResponse, TestCase } from '@/lib/execution/types';
import { TestCaseEvaluatorImpl } from '@/lib/execution/evaluator';

describe('Output Normalization is Idempotent', () => {
  const evaluator = new TestCaseEvaluatorImpl();

  it('should produce same result when normalizing twice', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 1000 }),
        (output) => {
          const normalized1 = evaluator.normalizeOutput(output);
          const normalized2 = evaluator.normalizeOutput(normalized1);
          
          expect(normalized1).toBe(normalized2);
          return true;
        }
      )
    );
  });

  it('should handle various line ending combinations', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
        (lines) => {
          // Test with different line endings
          const crlfOutput = lines.join('\r\n');
          const lfOutput = lines.join('\n');
          const crOutput = lines.join('\r');
          
          const normalizedCrlf = evaluator.normalizeOutput(crlfOutput);
          const normalizedLf = evaluator.normalizeOutput(lfOutput);
          const normalizedCr = evaluator.normalizeOutput(crOutput);
          
          // All should normalize to same result
          expect(normalizedCrlf).toBe(normalizedLf);
          expect(normalizedLf).toBe(normalizedCr);
          
          return true;
        }
      )
    );
  });

  it('should remove trailing whitespace per line', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
        fc.constantFrom('', ' ', '  ', '\t', ' \t '),
        (lines, trailingWs) => {
          const withTrailing = lines.map(line => line + trailingWs).join('\n');
          const withoutTrailing = lines.join('\n');
          
          const normalizedWith = evaluator.normalizeOutput(withTrailing);
          const normalizedWithout = evaluator.normalizeOutput(withoutTrailing);
          
          expect(normalizedWith).toBe(normalizedWithout);
          return true;
        }
      )
    );
  });

  it('should preserve internal whitespace', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.includes(' ')),
        (output) => {
          const normalized = evaluator.normalizeOutput(output);
          
          // Internal spaces should be preserved (not collapsed)
          const internalSpaces = output.trim().match(/ +/g);
          if (internalSpaces) {
            internalSpaces.forEach(spaces => {
              expect(normalized).toContain(spaces);
            });
          }
          
          return true;
        }
      )
    );
  });
});

describe('Earned Points Never Exceed Total Points', () => {
  const evaluator = new TestCaseEvaluatorImpl();

  const testResultArbitrary = fc.integer({ min: 1, max: 100 }).chain(pointsAvailable =>
    fc.record({
      testCaseId: fc.string({ minLength: 1, maxLength: 20 }),
      passed: fc.boolean(),
      actualOutput: fc.string({ maxLength: 100 }),
      expectedOutput: fc.string({ maxLength: 100 }),
      pointsEarned: fc.integer({ min: 0, max: pointsAvailable }),
      pointsAvailable: fc.constant(pointsAvailable),
    })
  );

  it('should never allow earned points to exceed total points', () => {
    fc.assert(
      fc.property(
        fc.array(testResultArbitrary, { minLength: 1, maxLength: 20 }),
        (results) => {
          const score = evaluator.calculateScore(results as TestResult[]);
          
          expect(score.earnedPoints).toBeLessThanOrEqual(score.totalPoints);
          expect(score.earnedPoints).toBeGreaterThanOrEqual(0);
          expect(score.totalPoints).toBeGreaterThan(0);
          
          return true;
        }
      )
    );
  });

  it('should calculate percentage correctly', () => {
    fc.assert(
      fc.property(
        fc.array(testResultArbitrary, { minLength: 1, maxLength: 20 }),
        (results) => {
          const score = evaluator.calculateScore(results as TestResult[]);
          
          const expectedPercentage = (score.earnedPoints / score.totalPoints) * 100;
          
          expect(score.percentage).toBeCloseTo(expectedPercentage, 2);
          expect(score.percentage).toBeGreaterThanOrEqual(0);
          expect(score.percentage).toBeLessThanOrEqual(100);
          
          return true;
        }
      )
    );
  });
});

describe('Submission Status Matches Test Results', () => {
  const evaluator = new TestCaseEvaluatorImpl();

  const testResultArbitrary = fc.integer({ min: 1, max: 100 }).chain(pointsAvailable =>
    fc.record({
      testCaseId: fc.string({ minLength: 1, maxLength: 20 }),
      passed: fc.boolean(),
      actualOutput: fc.string({ maxLength: 100 }),
      expectedOutput: fc.string({ maxLength: 100 }),
      pointsEarned: fc.integer({ min: 0, max: pointsAvailable }),
      pointsAvailable: fc.constant(pointsAvailable),
    })
  );

  it('should set status to passed when all tests pass', () => {
    fc.assert(
      fc.property(
        fc.array(testResultArbitrary, { minLength: 1, maxLength: 20 }),
        (results) => {
          // Force all tests to pass
          const passedResults = results.map(r => ({
            ...r,
            passed: true,
            pointsEarned: r.pointsAvailable,
          })) as TestResult[];
          
          const score = evaluator.calculateScore(passedResults);
          
          expect(score.status).toBe('passed');
          expect(score.earnedPoints).toBe(score.totalPoints);
          expect(score.percentage).toBe(100);
          
          return true;
        }
      )
    );
  });

  it('should set status to failed when no tests pass', () => {
    fc.assert(
      fc.property(
        fc.array(testResultArbitrary, { minLength: 1, maxLength: 20 }),
        (results) => {
          // Force all tests to fail
          const failedResults = results.map(r => ({
            ...r,
            passed: false,
            pointsEarned: 0,
          })) as TestResult[];
          
          const score = evaluator.calculateScore(failedResults);
          
          expect(score.status).toBe('failed');
          expect(score.earnedPoints).toBe(0);
          expect(score.percentage).toBe(0);
          
          return true;
        }
      )
    );
  });

  it('should set status to partial when some tests pass', () => {
    fc.assert(
      fc.property(
        fc.array(testResultArbitrary, { minLength: 2, maxLength: 20 }),
        (results) => {
          // Force mixed results (at least one pass, at least one fail)
          const mixedResults = results.map((r, i) => ({
            ...r,
            passed: i % 2 === 0,
            pointsEarned: i % 2 === 0 ? r.pointsAvailable : 0,
          })) as TestResult[];
          
          const score = evaluator.calculateScore(mixedResults);
          
          expect(score.status).toBe('partial');
          expect(score.earnedPoints).toBeGreaterThan(0);
          expect(score.earnedPoints).toBeLessThan(score.totalPoints);
          expect(score.percentage).toBeGreaterThan(0);
          expect(score.percentage).toBeLessThan(100);
          
          return true;
        }
      )
    );
  });
});

describe('Test Case Evaluation is Deterministic', () => {
  const evaluator = new TestCaseEvaluatorImpl();

  const executionResponseArbitrary = fc.record({
    language: fc.constantFrom('python', 'java', 'c++', 'c'),
    version: fc.string({ minLength: 1, maxLength: 20 }),
    run: fc.record({
      stdout: fc.string({ maxLength: 500 }),
      stderr: fc.string({ maxLength: 500 }),
      code: fc.integer({ min: 0, max: 1 }),
      signal: fc.constant(null),
      output: fc.string({ maxLength: 500 }),
    }),
  });

  const testCaseArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    input: fc.string({ maxLength: 100 }),
    expectedOutput: fc.string({ maxLength: 500 }),
    points: fc.integer({ min: 1, max: 100 }),
  });

  it('should produce same result when evaluating same inputs twice', () => {
    fc.assert(
      fc.property(
        executionResponseArbitrary,
        testCaseArbitrary,
        (response, testCase) => {
          const result1 = evaluator.evaluateTestCase(
            response as ExecutionResponse,
            testCase as TestCase
          );
          const result2 = evaluator.evaluateTestCase(
            response as ExecutionResponse,
            testCase as TestCase
          );
          
          expect(result1.passed).toBe(result2.passed);
          expect(result1.pointsEarned).toBe(result2.pointsEarned);
          expect(result1.actualOutput).toBe(result2.actualOutput);
          expect(result1.expectedOutput).toBe(result2.expectedOutput);
          
          return true;
        }
      )
    );
  });

  it('should award full points when outputs match after normalization', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (output, points) => {
          const response: ExecutionResponse = {
            language: 'python',
            version: '3.10.0',
            run: {
              stdout: output,
              stderr: '',
              code: 0,
              signal: null,
              output: output,
            },
          };
          
          const testCase: TestCase = {
            id: 'test-1',
            input: '',
            expectedOutput: output,
            points,
          };
          
          const result = evaluator.evaluateTestCase(response, testCase);
          
          expect(result.passed).toBe(true);
          expect(result.pointsEarned).toBe(points);
          
          return true;
        }
      )
    );
  });

  it('should award zero points when outputs do not match', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s !== ''),
        fc.integer({ min: 1, max: 100 }),
        (output1, output2, points) => {
          // Ensure outputs are different after normalization
          const normalized1 = evaluator.normalizeOutput(output1);
          const normalized2 = evaluator.normalizeOutput(output2);
          
          if (normalized1 === normalized2) {
            return true; // Skip this case
          }
          
          const response: ExecutionResponse = {
            language: 'python',
            version: '3.10.0',
            run: {
              stdout: output1,
              stderr: '',
              code: 0,
              signal: null,
              output: output1,
            },
          };
          
          const testCase: TestCase = {
            id: 'test-1',
            input: '',
            expectedOutput: output2,
            points,
          };
          
          const result = evaluator.evaluateTestCase(response, testCase);
          
          expect(result.passed).toBe(false);
          expect(result.pointsEarned).toBe(0);
          
          return true;
        }
      )
    );
  });
});
