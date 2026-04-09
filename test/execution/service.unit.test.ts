// Unit tests for execution service

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import { materializeTestCaseInputTemplate } from "@/lib/ai/template-dsl";
import type {
  PistonClient,
  TestCaseEvaluator,
  ExecutionResponse,
  TestResult,
  ScoreResult,
} from "@/lib/execution/types";

describe("ExecutionService Unit Tests", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: ExecutionServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock that returns data after any .eq() call
    const mockEqResult = {
      data: [
        {
          id: "test-1",
          input_data: "input",
          input_template: null,
          generation_seed: null,
          expected_output: "output",
          is_sample: true,
          points: 10,
        },
      ],
      error: null,
    };

    // Mock .eq() to return itself (for chaining) and also be awaitable
    mockEq = vi.fn().mockImplementation(() => {
      const chainable = {
        eq: mockEq,
        then: (resolve: (value: typeof mockEqResult) => void) =>
          resolve(mockEqResult),
      };
      return chainable;
    });

    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "submission-id" }, error: null }),
      }),
    });

    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = vi.fn((table: string) => {
      if (table === "test_cases") {
        return { select: mockSelect };
      }
      return { insert: mockInsert };
    });
    mockSupabase = { from: mockFrom } as Partial<SupabaseClient>;

    mockPistonClient = {
      execute: vi.fn(),
      mapLanguage: vi.fn(),
      getRuntimes: vi.fn(),
      validateResponse: vi.fn(),
    } as unknown as PistonClient;

    mockEvaluator = {
      evaluateTestCase: vi.fn(),
      calculateScore: vi.fn(),
      normalizeOutput: vi.fn(),
    } as unknown as TestCaseEvaluator;

    service = new ExecutionServiceImpl({
      pistonClient: mockPistonClient,
      evaluator: mockEvaluator,
      supabase: mockSupabase as SupabaseClient,
    });
  });

  describe("runCode", () => {
    it("should execute code and return results without saving", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: true,
        actualOutput: "output",
        expectedOutput: "output",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      const result = await service.runCode({
        code: 'print("output")',
        language: "python",
        problemId: "problem-1",
      });

      expect(result.results).toHaveLength(1);
      expect(result.score.status).toBe("passed");
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should fetch only sample test cases", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: true,
        actualOutput: "output",
        expectedOutput: "output",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      await service.runCode({
        code: 'print("output")',
        language: "python",
        problemId: "problem-1",
      });

      expect(mockEq).toHaveBeenCalledWith("problem_id", "problem-1");
      expect(mockEq).toHaveBeenCalledWith("is_sample", true);
    });

    it("should materialize input from template specs before execution", async () => {
      const template = {
        version: 1,
        variables: {
          n: { type: "const", value: 5 },
          arr: { type: "int_array", length: { ref: "n" }, min: 1, max: 9 },
        },
        output: [
          { type: "line", values: [{ ref: "n" }] },
          { type: "line", values: [{ ref: "arr" }] },
        ],
      } as const;

      const expectedMaterializedInput = materializeTestCaseInputTemplate(
        template,
        {
          seedMaterial: "template-seed",
        },
      ).inputData;

      mockEq.mockImplementation(() => {
        const chainable = {
          eq: mockEq,
          then: (
            resolve: (value: {
              data: Array<Record<string, unknown>>;
              error: null;
            }) => void,
          ) =>
            resolve({
              data: [
                {
                  id: "test-template-1",
                  input_data: "__GENERATED_FROM_TEMPLATE__",
                  input_template: template,
                  generation_seed: "template-seed",
                  expected_output: "5",
                  is_sample: true,
                  points: 10,
                },
              ],
              error: null,
            }),
        };
        return chainable;
      });

      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: { stdout: "5", stderr: "", code: 0, signal: null, output: "5" },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-template-1",
        passed: true,
        actualOutput: "5",
        expectedOutput: "5",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      await service.runCode({
        code: "print(5)",
        language: "python",
        problemId: "problem-1",
      });

      expect(mockPistonClient.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          stdin: expectedMaterializedInput,
        }),
      );
    });

    it("should reject template test cases without generation_seed", async () => {
      const template = {
        version: 1,
        variables: {
          n: { type: "const", value: 5 },
        },
        output: [{ type: "line", values: [{ ref: "n" }] }],
      } as const;

      mockEq.mockImplementation(() => {
        const chainable = {
          eq: mockEq,
          then: (
            resolve: (value: {
              data: Array<Record<string, unknown>>;
              error: null;
            }) => void,
          ) =>
            resolve({
              data: [
                {
                  id: "test-template-missing-seed",
                  input_data: "",
                  input_template: template,
                  generation_seed: null,
                  expected_output: "5",
                  is_sample: true,
                  points: 10,
                },
              ],
              error: null,
            }),
        };
        return chainable;
      });

      await expect(
        service.runCode({
          code: "print(5)",
          language: "python",
          problemId: "problem-1",
        }),
      ).rejects.toThrow(/generation_seed/i);
    });

    it("should throw error if no test cases found", async () => {
      mockEq.mockImplementation(() => {
        const chainable = {
          eq: mockEq,
          then: (resolve: (value: { data: never[]; error: null }) => void) =>
            resolve({ data: [], error: null }),
        };
        return chainable;
      });

      await expect(
        service.runCode({
          code: 'print("output")',
          language: "python",
          problemId: "problem-1",
        }),
      ).rejects.toThrow("No test cases found for problem");
    });

    it("should handle database errors when fetching test cases", async () => {
      mockEq.mockImplementation(() => {
        const chainable = {
          eq: mockEq,
          then: (_resolve: unknown, reject: (error: Error) => void) =>
            reject(new Error("Failed to fetch test cases: Database error")),
        };
        return chainable;
      });

      await expect(
        service.runCode({
          code: 'print("output")',
          language: "python",
          problemId: "problem-1",
        }),
      ).rejects.toThrow("Failed to fetch test cases: Database error");
    });
  });

  describe("submitCode", () => {
    it("should execute code, evaluate, and save submission", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: true,
        actualOutput: "output",
        expectedOutput: "output",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      const result = await service.submitCode(
        { code: 'print("output")', language: "python", problemId: "problem-1" },
        "user-1",
      );

      expect(result.submissionId).toBe("submission-id");
      expect(result.score.status).toBe("passed");
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: "user-1",
          problem_id: "problem-1",
          code: 'print("output")',
          language: "python",
          status: "passed",
          score: 100,
          total_points: 10,
          earned_points: 10,
        }),
      );
    });

    it("should fetch all test cases regardless of is_sample", async () => {
      mockEq.mockResolvedValue({
        data: [
          {
            id: "test-1",
            input_data: "input1",
            expected_output: "output1",
            is_sample: true,
            points: 10,
          },
          {
            id: "test-2",
            input_data: "input2",
            expected_output: "output2",
            is_sample: false,
            points: 15,
          },
        ],
        error: null,
      });

      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: true,
        actualOutput: "output",
        expectedOutput: "output",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 25,
        earnedPoints: 25,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      await service.submitCode(
        { code: 'print("output")', language: "python", problemId: "problem-1" },
        "user-1",
      );

      expect(mockEq).toHaveBeenCalledWith("problem_id", "problem-1");
      expect(mockEq).not.toHaveBeenCalledWith("is_sample", expect.anything());
    });

    it("should include assignment_id when provided", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: true,
        actualOutput: "output",
        expectedOutput: "output",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      await service.submitCode(
        {
          code: 'print("output")',
          language: "python",
          problemId: "problem-1",
          assignmentId: "assignment-1",
        },
        "user-1",
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          assignment_id: "assignment-1",
        }),
      );
    });

    it("should handle database errors when saving submission", async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
        }),
      });

      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: true,
        actualOutput: "output",
        expectedOutput: "output",
        pointsEarned: 10,
        pointsAvailable: 10,
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 10,
        percentage: 100,
        status: "passed",
      } as ScoreResult);

      await expect(
        service.submitCode(
          {
            code: 'print("output")',
            language: "python",
            problemId: "problem-1",
          },
          "user-1",
        ),
      ).rejects.toThrow("Failed to save submission: Database error");
    });
  });

  describe("Error Handling", () => {
    it("should propagate execution errors", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockRejectedValue(
        new Error("Execution timeout"),
      );

      await expect(
        service.runCode({
          code: 'print("output")',
          language: "python",
          problemId: "problem-1",
        }),
      ).rejects.toThrow("Execution timeout");
    });

    it("should handle compilation errors", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("java");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "java",
        version: "17.0.0",
        compile: {
          stdout: "",
          stderr: "Main.java:1: error: semicolon expected",
          code: 1,
          signal: null,
          output: "Main.java:1: error: semicolon expected",
        },
        run: { stdout: "", stderr: "", code: 0, signal: null, output: "" },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: false,
        actualOutput: "",
        expectedOutput: "output",
        pointsEarned: 0,
        pointsAvailable: 10,
        error: "Main.java:1: error: semicolon expected",
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 0,
        percentage: 0,
        status: "failed",
      } as ScoreResult);

      const result = await service.runCode({
        code: "invalid java code",
        language: "java",
        problemId: "problem-1",
      });

      expect(result.score.status).toBe("failed");
      expect(result.results[0].error).toContain("error");
    });

    it("should handle runtime errors", async () => {
      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "",
          stderr: 'NameError: name "x" is not defined',
          code: 1,
          signal: null,
          output: 'NameError: name "x" is not defined',
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
        testCaseId: "test-1",
        passed: false,
        actualOutput: "",
        expectedOutput: "output",
        pointsEarned: 0,
        pointsAvailable: 10,
        error: 'NameError: name "x" is not defined',
      } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 10,
        earnedPoints: 0,
        percentage: 0,
        status: "failed",
      } as ScoreResult);

      const result = await service.runCode({
        code: "print(x)",
        language: "python",
        problemId: "problem-1",
      });

      expect(result.score.status).toBe("failed");
      expect(result.results[0].error).toContain("NameError");
    });
  });

  describe("Edge Cases", () => {
    it("should handle partial success", async () => {
      type TestCaseData = {
        id: string;
        input_data: string;
        expected_output: string;
        is_sample: boolean;
        points: number;
      };

      mockEq.mockImplementation(() => {
        const chainable = {
          eq: mockEq,
          then: (
            resolve: (value: { data: TestCaseData[]; error: null }) => void,
          ) =>
            resolve({
              data: [
                {
                  id: "test-1",
                  input_data: "input1",
                  expected_output: "output1",
                  is_sample: true,
                  points: 10,
                },
                {
                  id: "test-2",
                  input_data: "input2",
                  expected_output: "output2",
                  is_sample: true,
                  points: 10,
                },
              ],
              error: null,
            }),
        };
        return chainable;
      });

      vi.mocked(mockPistonClient.mapLanguage).mockReturnValue("python");
      vi.mocked(mockPistonClient.execute).mockResolvedValue({
        language: "python",
        version: "3.10.0",
        run: {
          stdout: "output",
          stderr: "",
          code: 0,
          signal: null,
          output: "output",
        },
      } as ExecutionResponse);

      vi.mocked(mockEvaluator.evaluateTestCase)
        .mockReturnValueOnce({
          testCaseId: "test-1",
          passed: true,
          actualOutput: "output1",
          expectedOutput: "output1",
          pointsEarned: 10,
          pointsAvailable: 10,
        } as TestResult)
        .mockReturnValueOnce({
          testCaseId: "test-2",
          passed: false,
          actualOutput: "wrong",
          expectedOutput: "output2",
          pointsEarned: 0,
          pointsAvailable: 10,
        } as TestResult);

      vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
        totalPoints: 20,
        earnedPoints: 10,
        percentage: 50,
        status: "partial",
      } as ScoreResult);

      const result = await service.runCode({
        code: 'print("output")',
        language: "python",
        problemId: "problem-1",
      });

      expect(result.score.status).toBe("partial");
      expect(result.score.percentage).toBe(50);
    });

    it("should handle different programming languages", async () => {
      type LanguageMapping = {
        lang: "python" | "java" | "cpp" | "c";
        pistonLang: "python" | "java" | "c++" | "c";
      };

      const languages: LanguageMapping[] = [
        { lang: "python", pistonLang: "python" },
        { lang: "java", pistonLang: "java" },
        { lang: "cpp", pistonLang: "c++" },
        { lang: "c", pistonLang: "c" },
      ];

      for (const { lang, pistonLang } of languages) {
        vi.clearAllMocks();

        vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(pistonLang);
        vi.mocked(mockPistonClient.execute).mockResolvedValue({
          language: pistonLang,
          version: "1.0",
          run: {
            stdout: "output",
            stderr: "",
            code: 0,
            signal: null,
            output: "output",
          },
        } as ExecutionResponse);

        vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
          testCaseId: "test-1",
          passed: true,
          actualOutput: "output",
          expectedOutput: "output",
          pointsEarned: 10,
          pointsAvailable: 10,
        } as TestResult);

        vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
          totalPoints: 10,
          earnedPoints: 10,
          percentage: 100,
          status: "passed",
        } as ScoreResult);

        await service.runCode({
          code: "code",
          language: lang,
          problemId: "problem-1",
        });

        expect(mockPistonClient.mapLanguage).toHaveBeenCalledWith(lang);
      }
    });
  });
});
