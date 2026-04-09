// Unit tests for test case evaluator

import { describe, it, expect } from "vitest";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";
import type {
  ExecutionResponse,
  TestCase,
  TestResult,
} from "@/lib/execution/types";

describe("TestCaseEvaluator Unit Tests", () => {
  const evaluator = new TestCaseEvaluatorImpl();

  describe("Output Normalization", () => {
    it("should normalize Windows line endings to Unix", () => {
      const input = "Hello\r\nWorld\r\n";
      const expected = "Hello\nWorld";
      expect(evaluator.normalizeOutput(input)).toBe(expected);
    });

    it("should remove trailing whitespace per line", () => {
      const input = "Hello   \nWorld  \n";
      const expected = "Hello\nWorld";
      expect(evaluator.normalizeOutput(input)).toBe(expected);
    });

    it("should remove leading and trailing empty lines", () => {
      const input = "\n\nHello\nWorld\n\n";
      const expected = "Hello\nWorld";
      expect(evaluator.normalizeOutput(input)).toBe(expected);
    });

    it("should preserve internal whitespace", () => {
      const input = "Hello    World";
      const expected = "Hello    World";
      expect(evaluator.normalizeOutput(input)).toBe(expected);
    });

    it("should handle empty string", () => {
      expect(evaluator.normalizeOutput("")).toBe("");
    });

    it("should handle string with only whitespace", () => {
      expect(evaluator.normalizeOutput("   \n\n  ")).toBe("");
    });

    it("should handle mixed line endings", () => {
      const input = "Line1\r\nLine2\nLine3\rLine4";
      const expected = "Line1\nLine2\nLine3\nLine4";
      expect(evaluator.normalizeOutput(input)).toBe(expected);
    });

    it("should handle tabs", () => {
      const input = "Hello\t\tWorld\t\n";
      const expected = "Hello\t\tWorld";
      expect(evaluator.normalizeOutput(input)).toBe(expected);
    });
  });

  describe("Test Case Evaluation", () => {
    it("should pass when outputs match exactly", () => {
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "Hello, World!\n",
          stderr: "",
          code: 0,
          signal: null,
          output: "Hello, World!\n",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "Hello, World!",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(true);
      expect(result.pointsEarned).toBe(10);
      expect(result.pointsAvailable).toBe(10);
      expect(result.error).toBeUndefined();
    });

    it("should pass when outputs match after normalization", () => {
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "Hello\r\nWorld  \n",
          stderr: "",
          code: 0,
          signal: null,
          output: "Hello\r\nWorld  \n",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "Hello\nWorld",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(true);
      expect(result.pointsEarned).toBe(10);
    });

    it("should fail when outputs do not match", () => {
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "Hello, World!",
          stderr: "",
          code: 0,
          signal: null,
          output: "Hello, World!",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "Goodbye, World!",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.pointsAvailable).toBe(10);
    });

    it("should fail on non-zero exit code", () => {
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "",
          stderr: 'NameError: name "x" is not defined',
          code: 1,
          signal: null,
          output: 'NameError: name "x" is not defined',
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "Hello",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.error).toContain("NameError");
    });

    it("should fail on compilation error", () => {
      const response: ExecutionResponse = {
        language: "java",
        version: "17.0.0",
        compile: {
          stdout: "",
          stderr: "Main.java:1: error: semicolon expected",
          code: 1,
          signal: null,
          output: "Main.java:1: error: semicolon expected",
        },
        run: {
          stdout: "",
          stderr: "",
          code: 0,
          signal: null,
          output: "",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "Hello",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.error).toContain("error");
    });

    it("should handle empty output correctly", () => {
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "",
          stderr: "",
          code: 0,
          signal: null,
          output: "",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(true);
      expect(result.pointsEarned).toBe(10);
    });

    it("should include execution metadata in result", () => {
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "Hello",
          stderr: "",
          code: 0,
          signal: null,
          output: "Hello",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: "Hello",
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.testCaseId).toBe("test-1");
      expect(result.actualOutput).toBe("Hello");
      expect(result.expectedOutput).toBe("Hello");
    });
  });

  describe("Score Calculation", () => {
    it("should calculate score for all passing tests", () => {
      const results: TestResult[] = [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "Hello",
          expectedOutput: "Hello",
          pointsEarned: 10,
          pointsAvailable: 10,
        },
        {
          testCaseId: "test-2",
          passed: true,
          actualOutput: "World",
          expectedOutput: "World",
          pointsEarned: 15,
          pointsAvailable: 15,
        },
      ];

      const score = evaluator.calculateScore(results);

      expect(score.totalPoints).toBe(25);
      expect(score.earnedPoints).toBe(25);
      expect(score.percentage).toBe(100);
      expect(score.status).toBe("passed");
    });

    it("should calculate score for all failing tests", () => {
      const results: TestResult[] = [
        {
          testCaseId: "test-1",
          passed: false,
          actualOutput: "Hello",
          expectedOutput: "Goodbye",
          pointsEarned: 0,
          pointsAvailable: 10,
        },
        {
          testCaseId: "test-2",
          passed: false,
          actualOutput: "World",
          expectedOutput: "Universe",
          pointsEarned: 0,
          pointsAvailable: 15,
        },
      ];

      const score = evaluator.calculateScore(results);

      expect(score.totalPoints).toBe(25);
      expect(score.earnedPoints).toBe(0);
      expect(score.percentage).toBe(0);
      expect(score.status).toBe("failed");
    });

    it("should calculate score for partial passing tests", () => {
      const results: TestResult[] = [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "Hello",
          expectedOutput: "Hello",
          pointsEarned: 10,
          pointsAvailable: 10,
        },
        {
          testCaseId: "test-2",
          passed: false,
          actualOutput: "World",
          expectedOutput: "Universe",
          pointsEarned: 0,
          pointsAvailable: 10,
        },
      ];

      const score = evaluator.calculateScore(results);

      expect(score.totalPoints).toBe(20);
      expect(score.earnedPoints).toBe(10);
      expect(score.percentage).toBe(50);
      expect(score.status).toBe("partial");
    });

    it("should handle single test case", () => {
      const results: TestResult[] = [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "Hello",
          expectedOutput: "Hello",
          pointsEarned: 100,
          pointsAvailable: 100,
        },
      ];

      const score = evaluator.calculateScore(results);

      expect(score.totalPoints).toBe(100);
      expect(score.earnedPoints).toBe(100);
      expect(score.percentage).toBe(100);
      expect(score.status).toBe("passed");
    });

    it("should handle varying point values", () => {
      const results: TestResult[] = [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "A",
          expectedOutput: "A",
          pointsEarned: 5,
          pointsAvailable: 5,
        },
        {
          testCaseId: "test-2",
          passed: true,
          actualOutput: "B",
          expectedOutput: "B",
          pointsEarned: 10,
          pointsAvailable: 10,
        },
        {
          testCaseId: "test-3",
          passed: false,
          actualOutput: "C",
          expectedOutput: "D",
          pointsEarned: 0,
          pointsAvailable: 20,
        },
      ];

      const score = evaluator.calculateScore(results);

      expect(score.totalPoints).toBe(35);
      expect(score.earnedPoints).toBe(15);
      expect(score.percentage).toBeCloseTo(42.86, 1);
      expect(score.status).toBe("partial");
    });

    it("should ensure earned points never exceed total points", () => {
      const results: TestResult[] = [
        {
          testCaseId: "test-1",
          passed: true,
          actualOutput: "Hello",
          expectedOutput: "Hello",
          pointsEarned: 10,
          pointsAvailable: 10,
        },
      ];

      const score = evaluator.calculateScore(results);

      expect(score.earnedPoints).toBeLessThanOrEqual(score.totalPoints);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long output", () => {
      const longOutput = "x".repeat(10000);
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: longOutput,
          stderr: "",
          code: 0,
          signal: null,
          output: longOutput,
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: longOutput,
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(true);
      expect(result.pointsEarned).toBe(10);
    });

    it("should handle output with special characters", () => {
      const specialOutput = "Hello\t\nWorld\r\n!@#$%^&*()";
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: specialOutput,
          stderr: "",
          code: 0,
          signal: null,
          output: specialOutput,
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: specialOutput,
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(true);
    });

    it("should handle multiline output", () => {
      const multilineOutput = "Line 1\nLine 2\nLine 3\nLine 4";
      const response: ExecutionResponse = {
        language: "python",
        version: "3.10.0",
        run: {
          stdout: multilineOutput + "\n",
          stderr: "",
          code: 0,
          signal: null,
          output: multilineOutput + "\n",
        },
      };

      const testCase: TestCase = {
        id: "test-1",
        input: "",
        expectedOutput: multilineOutput,
        points: 10,
      };

      const result = evaluator.evaluateTestCase(response, testCase);

      expect(result.passed).toBe(true);
    });
  });
});
