// Property-based tests for execution service

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import type {
  PistonClient,
  TestCaseEvaluator,
  ExecutionResponse,
  TestResult,
  ScoreResult,
  SupportedLanguage,
} from "@/lib/execution/types";

describe("Run Mode Never Creates Database Records", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "test-1",
              input_data: "input",
              expected_output: "output",
              is_sample: true,
              points: 10,
            },
          ],
          error: null,
        }),
      }),
    });
    mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });
    mockSupabase = { from: mockFrom } as unknown as Partial<SupabaseClient>;

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
  });

  it("should never create database records regardless of inputs", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<SupportedLanguage>("python", "java", "cpp", "c"),
        fc.uuid(),
        fc.uuid(),
        async (code, language, userId, problemId) => {
          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: mockEvaluator,
            supabase: mockSupabase as SupabaseClient,
          });

          vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(
            language === "cpp" ? "c++" : language,
          );
          vi.mocked(mockPistonClient.execute).mockResolvedValue({
            language,
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

          await service.runCode({ code, language, problemId });

          // Critical: insert should NEVER be called in run mode
          expect(mockInsert).not.toHaveBeenCalled();

          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Run Mode Fetches Only Sample Test Cases", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;
  let mockEqCalls: Array<[string, unknown]>;
  let mockSecondEq: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEqCalls = [];

    mockSecondEq = vi.fn().mockImplementation((key: string, value: unknown) => {
      mockEqCalls.push([key, value]);
      return Promise.resolve({
        data: [
          {
            id: "test-1",
            input_data: "input",
            expected_output: "output",
            is_sample: true,
            points: 10,
          },
        ],
        error: null,
      });
    });

    mockEq = vi.fn().mockImplementation((key: string, value: unknown) => {
      mockEqCalls.push([key, value]);
      return { eq: mockSecondEq };
    });

    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    mockSupabase = { from: mockFrom } as unknown as Partial<SupabaseClient>;

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
  });

  it("should only fetch test cases where is_sample is true", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<SupportedLanguage>("python", "java", "cpp", "c"),
        fc.uuid(),
        fc.uuid(),
        async (code, language, userId, problemId) => {
          mockEqCalls = [];

          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: mockEvaluator,
            supabase: mockSupabase as SupabaseClient,
          });

          vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(
            language === "cpp" ? "c++" : language,
          );
          vi.mocked(mockPistonClient.execute).mockResolvedValue({
            language,
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

          await service.runCode({ code, language, problemId });

          // Property: runCode MUST filter by is_sample = true
          const hasSampleFilter = mockEqCalls.some(
            ([key, value]) => key === "is_sample" && value === true,
          );
          expect(hasSampleFilter).toBe(true);

          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Submit Mode Fetches All Test Cases", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;
  let mockEqCalls: Array<[string, unknown]>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEqCalls = [];

    mockEq = vi.fn().mockImplementation((key: string, value: unknown) => {
      mockEqCalls.push([key, value]);
      return Promise.resolve({
        data: [
          {
            id: "test-1",
            input_data: "input",
            expected_output: "output",
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
    });

    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "submission-id" }, error: null }),
      }),
    });
    mockFrom = vi.fn((table: string) => {
      if (table === "test_cases") {
        return { select: mockSelect };
      }
      return { insert: mockInsert };
    });
    mockSupabase = { from: mockFrom } as unknown as Partial<SupabaseClient>;

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
  });

  it("should fetch all test cases regardless of is_sample value", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<SupportedLanguage>("python", "java", "cpp", "c"),
        fc.uuid(),
        fc.uuid(),
        async (code, language, userId, problemId) => {
          mockEqCalls = [];

          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: mockEvaluator,
            supabase: mockSupabase as SupabaseClient,
          });

          vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(
            language === "cpp" ? "c++" : language,
          );
          vi.mocked(mockPistonClient.execute).mockResolvedValue({
            language,
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
            totalPoints: 25,
            earnedPoints: 25,
            percentage: 100,
            status: "passed",
          } as ScoreResult);

          await service.submitCode({ code, language, problemId }, userId);

          // Property: submitCode MUST NOT filter by is_sample
          const hasSampleFilter = mockEqCalls.some(
            ([key]) => key === "is_sample",
          );
          expect(hasSampleFilter).toBe(false);

          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Submit Mode Creates Submission Records", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "submission-id" }, error: null }),
      }),
    });
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "test-1",
            input_data: "input",
            expected_output: "output",
            is_sample: true,
            points: 10,
          },
        ],
        error: null,
      }),
    });
    mockFrom = vi.fn((table: string) => {
      if (table === "test_cases") {
        return { select: mockSelect };
      }
      return { insert: mockInsert };
    });
    mockSupabase = { from: mockFrom } as unknown as Partial<SupabaseClient>;

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
  });

  it("should always create submission record when execution succeeds", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<SupportedLanguage>("python", "java", "cpp", "c"),
        fc.uuid(),
        fc.uuid(),
        async (code, language, userId, problemId) => {
          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: mockEvaluator,
            supabase: mockSupabase as SupabaseClient,
          });

          vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(
            language === "cpp" ? "c++" : language,
          );
          vi.mocked(mockPistonClient.execute).mockResolvedValue({
            language,
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

          await service.submitCode({ code, language, problemId }, userId);

          // Critical: insert MUST be called in submit mode
          expect(mockInsert).toHaveBeenCalled();
          expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
              student_id: userId,
              problem_id: problemId,
              code,
              language,
              status: "passed",
            }),
          );

          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Compilation Errors Propagate to All Test Cases", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "submission-id" }, error: null }),
      }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
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
          {
            id: "test-3",
            input_data: "input3",
            expected_output: "output3",
            is_sample: false,
            points: 20,
          },
        ],
        error: null,
      }),
    });
    const mockFrom = vi.fn((table: string) => {
      if (table === "test_cases") {
        return { select: mockSelect };
      }
      return { insert: mockInsert };
    });
    mockSupabase = { from: mockFrom } as unknown as Partial<SupabaseClient>;

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
  });

  it("should mark all test cases as failed when compilation error occurs", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<SupportedLanguage>("python", "java", "cpp", "c"),
        fc.uuid(),
        fc.uuid(),
        async (code, language, userId, problemId) => {
          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: mockEvaluator,
            supabase: mockSupabase as SupabaseClient,
          });

          vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(
            language === "cpp" ? "c++" : language,
          );
          vi.mocked(mockPistonClient.execute).mockResolvedValue({
            language,
            version: "1.0",
            compile: {
              stdout: "",
              stderr: "SyntaxError: invalid syntax",
              code: 1,
              signal: null,
              output: "SyntaxError: invalid syntax",
            },
            run: { stdout: "", stderr: "", code: 0, signal: null, output: "" },
          } as ExecutionResponse);

          // Evaluator should mark all tests as failed
          vi.mocked(mockEvaluator.evaluateTestCase).mockReturnValue({
            testCaseId: "test-1",
            passed: false,
            actualOutput: "",
            expectedOutput: "output",
            pointsEarned: 0,
            pointsAvailable: 10,
            error: "SyntaxError: invalid syntax",
          } as TestResult);

          vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
            totalPoints: 45,
            earnedPoints: 0,
            percentage: 0,
            status: "failed",
          } as ScoreResult);

          const result = await service.submitCode(
            { code, language, problemId },
            userId,
          );

          // All test cases should be evaluated (even though compilation failed)
          expect(result.results).toHaveLength(3);
          expect(result.score.earnedPoints).toBe(0);
          expect(result.score.status).toBe("failed");

          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Runtime Errors Do Not Stop Execution", () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockPistonClient: PistonClient;
  let mockEvaluator: TestCaseEvaluator;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "submission-id" }, error: null }),
      }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
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
          {
            id: "test-3",
            input_data: "input3",
            expected_output: "output3",
            is_sample: false,
            points: 20,
          },
        ],
        error: null,
      }),
    });
    const mockFrom = vi.fn((table: string) => {
      if (table === "test_cases") {
        return { select: mockSelect };
      }
      return { insert: mockInsert };
    });
    mockSupabase = { from: mockFrom } as unknown as Partial<SupabaseClient>;

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
  });

  it("should continue executing remaining test cases after runtime error", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<SupportedLanguage>("python", "java", "cpp", "c"),
        fc.uuid(),
        fc.uuid(),
        async (code, language, userId, problemId) => {
          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: mockEvaluator,
            supabase: mockSupabase as SupabaseClient,
          });

          vi.mocked(mockPistonClient.mapLanguage).mockReturnValue(
            language === "cpp" ? "c++" : language,
          );

          // First execution: runtime error
          // Second execution: success
          // Third execution: success
          vi.mocked(mockPistonClient.execute)
            .mockResolvedValueOnce({
              language,
              version: "1.0",
              run: {
                stdout: "",
                stderr: "RuntimeError",
                code: 1,
                signal: null,
                output: "RuntimeError",
              },
            } as ExecutionResponse)
            .mockResolvedValueOnce({
              language,
              version: "1.0",
              run: {
                stdout: "output2",
                stderr: "",
                code: 0,
                signal: null,
                output: "output2",
              },
            } as ExecutionResponse)
            .mockResolvedValueOnce({
              language,
              version: "1.0",
              run: {
                stdout: "output3",
                stderr: "",
                code: 0,
                signal: null,
                output: "output3",
              },
            } as ExecutionResponse);

          vi.mocked(mockEvaluator.evaluateTestCase)
            .mockReturnValueOnce({
              testCaseId: "test-1",
              passed: false,
              actualOutput: "",
              expectedOutput: "output1",
              pointsEarned: 0,
              pointsAvailable: 10,
              error: "RuntimeError",
            } as TestResult)
            .mockReturnValueOnce({
              testCaseId: "test-2",
              passed: true,
              actualOutput: "output2",
              expectedOutput: "output2",
              pointsEarned: 15,
              pointsAvailable: 15,
            } as TestResult)
            .mockReturnValueOnce({
              testCaseId: "test-3",
              passed: true,
              actualOutput: "output3",
              expectedOutput: "output3",
              pointsEarned: 20,
              pointsAvailable: 20,
            } as TestResult);

          vi.mocked(mockEvaluator.calculateScore).mockReturnValue({
            totalPoints: 45,
            earnedPoints: 35,
            percentage: 77.78,
            status: "partial",
          } as ScoreResult);

          const result = await service.submitCode(
            { code, language, problemId },
            userId,
          );

          // All 3 test cases should be executed despite first one failing
          expect(result.results).toHaveLength(3);
          expect(result.score.status).toBe("partial");
          expect(result.score.earnedPoints).toBe(35);

          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});
