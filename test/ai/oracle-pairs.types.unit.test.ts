/**
 * Unit Tests: Oracle Pair Types & Seeding
 *
 * Tests for:
 * - OraclePair type validation and creation
 * - GenerationSeed derivation and determinism
 * - Seed verification and tampering detection
 * - Constraint registry management
 *
 * Run with: npm test -- oracle-pairs.types.unit.test.ts
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  GenerationSeed,
  SeedDerivationBuilder,
  deriveSeedsForBatch,
  verifyBatchSeedConsistency,
  GENERATION_SEED_VERSION,
  GENERATION_SEED_LENGTH,
  createTestCase,
  createModelAnswer,
  createOraclePair,
  validateOraclePairStructure,
  ConstraintRegistry,
  ConstraintLevel,
  isOraclePair,
} from "../../lib/ai/oracle-pairs";
import type {
  OraclePair,
  TestCase,
  ModelAnswer,
  GenerationSeedInfo,
} from "../../lib/ai/oracle-pairs";

describe("GenerationSeed", () => {
  describe("Seed Derivation", () => {
    test("should create valid seed from components", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "test-master-seed-123",
        problemId: "problem-1",
        testCaseIndex: 0,
        version: GENERATION_SEED_VERSION,
      });

      expect(seed.getValue()).toHaveLength(GENERATION_SEED_LENGTH);
      expect(seed.getValue()).toMatch(/^[0-9a-f]{64}$/i);
    });

    test("should produce identical seeds for identical inputs (determinism)", () => {
      const inputs = {
        masterSeed: "master-seed-xyz",
        problemId: "problem-42",
        testCaseIndex: 5,
      };

      const seed1 = GenerationSeed.derive(inputs);
      const seed2 = GenerationSeed.derive(inputs);
      const seed3 = GenerationSeed.derive(inputs);

      expect(seed1.getValue()).toBe(seed2.getValue());
      expect(seed2.getValue()).toBe(seed3.getValue());
    });

    test("should produce different seeds for different problem IDs", () => {
      const baseSeed = {
        masterSeed: "master",
        testCaseIndex: 0,
        version: GENERATION_SEED_VERSION,
      };

      const seed1 = GenerationSeed.derive({
        ...baseSeed,
        problemId: "problem-1",
      });
      const seed2 = GenerationSeed.derive({
        ...baseSeed,
        problemId: "problem-2",
      });

      expect(seed1.getValue()).not.toBe(seed2.getValue());
    });

    test("should produce different seeds for different test case indices", () => {
      const baseSeed = {
        masterSeed: "master",
        problemId: "problem-1",
        version: GENERATION_SEED_VERSION,
      };

      const seed0 = GenerationSeed.derive({ ...baseSeed, testCaseIndex: 0 });
      const seed1 = GenerationSeed.derive({ ...baseSeed, testCaseIndex: 1 });
      const seed2 = GenerationSeed.derive({ ...baseSeed, testCaseIndex: 2 });

      expect(seed0.getValue()).not.toBe(seed1.getValue());
      expect(seed1.getValue()).not.toBe(seed2.getValue());
      expect(seed0.getValue()).not.toBe(seed2.getValue());
    });

    test("should throw on empty master seed", () => {
      expect(() => {
        GenerationSeed.derive({
          masterSeed: "",
          problemId: "problem-1",
          testCaseIndex: 0,
        });
      }).toThrow();
    });

    test("should throw on empty problem ID", () => {
      expect(() => {
        GenerationSeed.derive({
          masterSeed: "master",
          problemId: "",
          testCaseIndex: 0,
        });
      }).toThrow();
    });

    test("should throw on negative test case index", () => {
      expect(() => {
        GenerationSeed.derive({
          masterSeed: "master",
          problemId: "problem-1",
          testCaseIndex: -1,
        });
      }).toThrow();
    });
  });

  describe("Seed Serialization", () => {
    test("should serialize to JSON and deserialize back", () => {
      const original = GenerationSeed.derive({
        masterSeed: "master",
        problemId: "problem-1",
        testCaseIndex: 0,
      });

      const json = original.toJSON();
      const deserialized = GenerationSeed.fromJSON(json);

      expect(deserialized.getValue()).toBe(original.getValue());
      expect(deserialized.toJSON()).toEqual(json);
    });

    test("should provide full seed info", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "my-master",
        problemId: "my-problem",
        testCaseIndex: 7,
      });

      const info = seed.toInfo();

      expect(info.version).toBe(GENERATION_SEED_VERSION);
      expect(info.masterSeed).toBe("my-master");
      expect(info.problemId).toBe("my-problem");
      expect(info.testCaseIndex).toBe(7);
      expect(info.value).toHaveLength(64);
      expect(info.chain).toBeDefined();
    });
  });

  describe("Seed Verification", () => {
    test("should detect seed tampering (value change)", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "master",
        problemId: "problem-1",
        testCaseIndex: 0,
      });

      const info = seed.toInfo();
      const tampered = { ...info, value: "0".repeat(64) };

      expect(seed.verify(tampered)).toBe(false);
    });

    test("should detect seed tampering (problem ID change)", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "master",
        problemId: "problem-1",
        testCaseIndex: 0,
      });

      const info = seed.toInfo();
      const tampered = { ...info, problemId: "problem-2" };

      expect(seed.verify(tampered)).toBe(false);
    });

    test("should verify unmodified seed info", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "master",
        problemId: "problem-1",
        testCaseIndex: 5,
      });

      const info = seed.toInfo();

      expect(seed.verify(info)).toBe(true);
    });

    test("should handle null/undefined gracefully", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "master",
        problemId: "problem-1",
        testCaseIndex: 0,
      });

      expect(seed.verify(null as unknown as Partial<GenerationSeedInfo>)).toBe(
        false,
      );
      expect(
        seed.verify(undefined as unknown as Partial<GenerationSeedInfo>),
      ).toBe(false);
    });
  });

  describe("Seed Builder (Fluent API)", () => {
    test("should build seed with fluent API", () => {
      const seed = new SeedDerivationBuilder()
        .withMasterSeed("master")
        .withProblemId("problem-1")
        .withTestCaseIndex(0)
        .build();

      expect(seed.getValue()).toHaveLength(64);
    });

    test("should enforce required fields", () => {
      expect(() => {
        new SeedDerivationBuilder()
          .withProblemId("problem")
          .withTestCaseIndex(0)
          .build();
      }).toThrow("masterSeed is required");

      expect(() => {
        new SeedDerivationBuilder()
          .withMasterSeed("master")
          .withTestCaseIndex(0)
          .build();
      }).toThrow("problemId is required");

      expect(() => {
        new SeedDerivationBuilder()
          .withMasterSeed("master")
          .withProblemId("problem")
          .build();
      }).toThrow("testCaseIndex is required");
    });

    test("should validate version parameter", () => {
      expect(() => {
        new SeedDerivationBuilder()
          .withMasterSeed("master")
          .withProblemId("problem")
          .withTestCaseIndex(0)
          .withVersion(0) // Invalid: must be positive
          .build();
      }).toThrow();
    });
  });

  describe("Batch Seed Derivation", () => {
    test("should derive unique seeds for batch", () => {
      const seeds = deriveSeedsForBatch("master", "problem-1", 10);

      expect(seeds).toHaveLength(10);

      const values = new Set(seeds.map((s) => s.getValue()));
      expect(values.size).toBe(10); // All unique
    });

    test("should maintain batch consistency", () => {
      const seeds1 = deriveSeedsForBatch("master", "problem-1", 5);
      const seeds2 = deriveSeedsForBatch("master", "problem-1", 5);

      for (let i = 0; i < 5; i++) {
        expect(seeds1[i].getValue()).toBe(seeds2[i].getValue());
      }
    });

    test("should verify batch consistency", () => {
      const seeds = deriveSeedsForBatch("master", "problem-1", 5);
      const result = verifyBatchSeedConsistency(seeds);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect duplicate seeds", () => {
      const seed = GenerationSeed.derive({
        masterSeed: "master",
        problemId: "problem-1",
        testCaseIndex: 0,
      });

      const result = verifyBatchSeedConsistency([seed, seed]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("TestCase Factory", () => {
  test("should create valid test case", () => {
    const testCase = createTestCase(
      "5\n1 2 3 4 5\n",
      "15\n",
      "seed-123",
      "resolved-seed-123",
      { n: 5, arr: [1, 2, 3, 4, 5] },
    );

    expect(testCase.inputData).toBe("5\n1 2 3 4 5\n");
    expect(testCase.expectedOutput).toBe("15\n");
    expect(testCase.generationSeed).toBe("seed-123");
    expect(testCase.version).toBe(1);
  });

  test("should include template version if provided", () => {
    const testCase = createTestCase(
      "input",
      "output",
      "seed",
      "resolved",
      {},
      1, // templateVersion
    );

    expect(testCase.templateVersion).toBe(1);
  });
});

describe("ModelAnswer Factory", () => {
  test("should create valid model answer", () => {
    const answer = createModelAnswer(
      "function sum(arr) { return arr.reduce((a,b) => a+b); }",
      "javascript",
      "seed-123",
      "gpt-3.5-turbo",
    );

    expect(answer.code).toContain("sum(arr)");
    expect(answer.language).toBe("javascript");
    expect(answer.generationSeed).toBe("seed-123");
    expect(answer.modelName).toBe("gpt-3.5-turbo");
    expect(answer.version).toBe(1);
    expect(answer.auditTrail).toBeDefined();
    expect(answer.auditTrail!.originalSeed).toBe("seed-123");
  });

  test("should have audit trail", () => {
    const answer = createModelAnswer("code", "python", "seed", "claude-3-opus");

    expect(answer.auditTrail).toBeDefined();
    expect(answer.auditTrail!.timestamp).toBeDefined();
    expect(answer.auditTrail!.model).toBe("claude-3-opus");
    expect(answer.auditTrail!.retryCount).toBe(0);
  });
});

describe("OraclePair Factory", () => {
  let testCase: TestCase;
  let modelAnswer: ModelAnswer;

  beforeEach(() => {
    testCase = createTestCase(
      "input\n",
      "output\n",
      "seed-123",
      "resolved-123",
      { x: 1 },
    );

    modelAnswer = createModelAnswer("code", "python", "seed-123");
  });

  test("should create oracle pair with matching seeds", () => {
    const pair = createOraclePair(testCase, modelAnswer);

    expect(pair.version).toBe(1);
    expect(pair.generationSeed).toBe("seed-123");
    expect(pair.testCase).toBe(testCase);
    expect(pair.modelAnswer).toBe(modelAnswer);
    expect(pair.createdAt).toBeDefined();
  });

  test("should reject oracle pair with mismatched seeds", () => {
    const wrongAnswer = createModelAnswer("code", "python", "seed-456");

    expect(() => createOraclePair(testCase, wrongAnswer)).toThrow(
      "Seed mismatch",
    );
  });

  test("should attach metadata to oracle pair", () => {
    const pair = createOraclePair(testCase, modelAnswer, {
      problemId: "problem-123",
      problemName: "Sum Array",
      difficulty: "easy",
      tags: ["array", "math"],
    });

    expect(pair.metadata).toBeDefined();
    expect(pair.metadata!.problemId).toBe("problem-123");
    expect(pair.metadata!.problemName).toBe("Sum Array");
    expect(pair.metadata!.difficulty).toBe("easy");
    expect(pair.metadata!.tags).toEqual(["array", "math"]);
  });
});

describe("OraclePair Type Guards", () => {
  let validPair: OraclePair;

  beforeEach(() => {
    const testCase = createTestCase(
      "input\n",
      "output\n",
      "seed",
      "resolved",
      {},
    );
    const modelAnswer = createModelAnswer("code", "python", "seed");
    validPair = createOraclePair(testCase, modelAnswer);
  });

  test("should identify valid oracle pair", () => {
    expect(isOraclePair(validPair)).toBe(true);
    expect(validateOraclePairStructure(validPair)).toBe(true);
  });

  test("should reject invalid objects", () => {
    expect(isOraclePair(null)).toBe(false);
    expect(isOraclePair({})).toBe(false);
    expect(isOraclePair({ version: 1 })).toBe(false);
    expect(isOraclePair("not an object")).toBe(false);
  });

  test("should reject partial oracle pairs", () => {
    const incomplete = {
      version: 1,
      generationSeed: "seed",
      testCase: { inputData: "x" },
      // Missing modelAnswer
      createdAt: new Date().toISOString(),
    };

    expect(isOraclePair(incomplete)).toBe(false);
  });

  test("should reject wrong version", () => {
    const wrongVersion = { ...validPair, version: 999 };
    expect(isOraclePair(wrongVersion)).toBe(false);
  });
});

describe("ConstraintRegistry", () => {
  beforeEach(() => {
    ConstraintRegistry.reset();
  });

  test("should be singleton", () => {
    const registry1 = ConstraintRegistry.getInstance();
    const registry2 = ConstraintRegistry.getInstance();

    expect(registry1).toBe(registry2);
  });

  test("should initialize with default constraints", () => {
    const registry = ConstraintRegistry.getInstance();

    expect(registry.getAll().length).toBeGreaterThan(0);
    expect(registry.getHardConstraints().length).toBeGreaterThan(0);
    expect(registry.getSoftConstraints().length).toBeGreaterThan(0);
  });

  test("should retrieve hard constraints", () => {
    const registry = ConstraintRegistry.getInstance();
    const hardConstraints = registry.getHardConstraints();

    expect(hardConstraints.every((c) => c.level === ConstraintLevel.HARD)).toBe(
      true,
    );
  });

  test("should retrieve soft constraints", () => {
    const registry = ConstraintRegistry.getInstance();
    const softConstraints = registry.getSoftConstraints();

    expect(softConstraints.every((c) => c.level === ConstraintLevel.SOFT)).toBe(
      true,
    );
  });

  test("should retrieve constraints by name", () => {
    const registry = ConstraintRegistry.getInstance();
    const constraint = registry.getByName("array_length_bounded");

    expect(constraint).toBeDefined();
    expect(constraint!.name).toBe("array_length_bounded");
    expect(constraint!.level).toBe(ConstraintLevel.HARD);
  });

  test("should retrieve constraints by category", () => {
    const registry = ConstraintRegistry.getInstance();
    const boundsConstraints = registry.getByCategory("bounds");

    expect(boundsConstraints.length).toBeGreaterThan(0);
    expect(boundsConstraints.every((c) => c.category === "bounds")).toBe(true);
  });

  test("should reject duplicate constraint names", () => {
    const registry = ConstraintRegistry.getInstance();

    expect(() => {
      registry.addConstraint({
        version: 1,
        level: ConstraintLevel.HARD,
        name: "array_length_bounded", // Already exists
        description: "Duplicate",
        category: "bounds",
        check: () => true,
      });
    }).toThrow();
  });

  test("should provide statistics", () => {
    const registry = ConstraintRegistry.getInstance();
    const stats = registry.getStats();

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.byLevel).toBeDefined();
    expect(stats.byCategory).toBeDefined();
    expect(Object.keys(stats.byLevel).length).toBeGreaterThan(0);
  });
});

describe("Seed Chain Tracking", () => {
  test("should track seed transformations", () => {
    const original = GenerationSeed.derive({
      masterSeed: "master",
      problemId: "problem-1",
      testCaseIndex: 0,
    });

    const modified = original.withChainEntry("materialization_complete");
    const modified2 = modified.withChainEntry("constraint_check_passed");

    expect(original.getChain().length).toBe(1);
    expect(modified.getChain().length).toBe(2);
    expect(modified2.getChain().length).toBe(3);
    expect(modified2.getChain()[1]).toBe("materialization_complete");
    expect(modified2.getChain()[2]).toBe("constraint_check_passed");
  });

  test("should not mutate original seed chain", () => {
    const seed1 = GenerationSeed.derive({
      masterSeed: "master",
      problemId: "problem-1",
      testCaseIndex: 0,
    });

    const seed2 = seed1.withChainEntry("operation-1");
    const seed3 = seed1.withChainEntry("operation-2");

    expect(seed1.getChain().length).toBe(1);
    expect(seed2.getChain().length).toBe(2);
    expect(seed3.getChain().length).toBe(2);
    expect(seed2.getChain()[1]).toBe("operation-1");
    expect(seed3.getChain()[1]).toBe("operation-2");
  });
});
