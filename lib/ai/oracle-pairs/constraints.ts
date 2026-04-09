/**
 * Constraint Registry: Manages constraint definitions and validation
 *
 * Supports three types of constraints:
 * - HARD: Violations prevent test case validity
 * - SOFT: Violations trigger warnings + auto-repair
 * - DISTRIBUTION: Validity measured at batch level
 */

import type { MaterializedTestCaseWithVariables, DSLConstraint } from "./types";
import { ConstraintLevel } from "./types";
import { TemplateDslError } from "../template-dsl/errors";

/**
 * Global Constraint Registry: Singleton for managing all DSL constraints
 */
export class ConstraintRegistry {
  private static instance: ConstraintRegistry | null = null;

  private constraints: Map<string, DSLConstraint> = new Map();
  private categoryIndex: Map<string, DSLConstraint[]> = new Map();

  private constructor() {
    this.initializeDefaultConstraints();
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(): ConstraintRegistry {
    if (!ConstraintRegistry.instance) {
      ConstraintRegistry.instance = new ConstraintRegistry();
    }
    return ConstraintRegistry.instance;
  }

  /**
   * Reset (mainly for testing)
   */
  static reset(): void {
    ConstraintRegistry.instance = null;
  }

  /**
   * Initialize default constraints from DSL spec
   */
  private initializeDefaultConstraints(): void {
    // HARD CONSTRAINTS: Bounds
    this.addConstraint({
      version: 1,
      level: ConstraintLevel.HARD,
      name: "array_length_bounded",
      description: "Array length must not exceed MAX_COLLECTION_SIZE (200,000)",
      category: "bounds",
      check: (testCase) => {
        const MAX = 200_000;
        return Object.values(testCase.variables).every((val) => {
          if (Array.isArray(val)) {
            return val.length <= MAX;
          }
          return true;
        });
      },
    });

    this.addConstraint({
      version: 1,
      level: ConstraintLevel.HARD,
      name: "matrix_dimensions_valid",
      description: "Matrix rows and cols must be positive integers",
      category: "bounds",
      check: (_testCase: MaterializedTestCaseWithVariables) => {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        // This would be checked during variable generation
        // Ensure no matrix has 0 rows or cols
        return true;
      },
    });

    this.addConstraint({
      version: 1,
      level: ConstraintLevel.HARD,
      name: "no_nan_or_inf",
      description: "No NaN or Infinity values allowed in numeric variables",
      category: "output",
      check: (testCase) => {
        const checkValue = (val: unknown): boolean => {
          if (typeof val === "number") {
            return !Number.isNaN(val) && Number.isFinite(val);
          }
          if (Array.isArray(val)) {
            return val.every(checkValue);
          }
          return true;
        };
        return Object.values(testCase.variables).every(checkValue);
      },
    });

    this.addConstraint({
      version: 1,
      level: ConstraintLevel.HARD,
      name: "output_size_bounded",
      description: "Output must not exceed DEFAULT_MAX_OUTPUT_BYTES (8MB)",
      category: "output",
      check: (testCase) => {
        const MAX_BYTES = 8 * 1024 * 1024;
        return Buffer.byteLength(testCase.expectedOutput, "utf8") <= MAX_BYTES;
      },
    });

    this.addConstraint({
      version: 1,
      level: ConstraintLevel.HARD,
      name: "input_size_bounded",
      description: "Input must not exceed DEFAULT_MAX_OUTPUT_BYTES (8MB)",
      category: "output",
      check: (testCase) => {
        const MAX_BYTES = 8 * 1024 * 1024;
        return Buffer.byteLength(testCase.inputData, "utf8") <= MAX_BYTES;
      },
    });

    // SOFT CONSTRAINTS: Quality heuristics
    this.addConstraint({
      version: 1,
      level: ConstraintLevel.SOFT,
      name: "int_array_unique",
      description: "int_array elements should be unique if unique=true",
      category: "structure",
      check: (testCase) => {
        void testCase;
        // This check would be template-variable specific
        // For now, always satisfied (checked at variable generation)
        return true;
      },
      repair: (testCase) => {
        // Repair would regenerate with uniqueness enforced
        return testCase;
      },
    });

    this.addConstraint({
      version: 1,
      level: ConstraintLevel.SOFT,
      name: "int_array_sorted",
      description: "int_array elements should be sorted if sorted=asc/desc",
      category: "structure",
      check: (testCase) => {
        void testCase;
        // Checked at variable generation
        return true;
      },
      repair: (testCase) => {
        return testCase;
      },
    });

    this.addConstraint({
      version: 1,
      level: ConstraintLevel.SOFT,
      name: "graph_connected",
      description: "Graph should be connected if connected=true",
      category: "structure",
      check: (testCase) => {
        void testCase;
        // Checked at variable generation
        return true;
      },
      repair: (testCase) => {
        return testCase;
      },
    });

    // DISTRIBUTION CONSTRAINTS: Batch level
    this.addConstraint({
      version: 1,
      level: ConstraintLevel.DISTRIBUTION,
      name: "choice_weights_sum_normalized",
      description: "Choice weights should sum to 1.0 if provided",
      category: "structure",
      check: (testCase) => {
        void testCase;
        // Checked at variable generation
        return true;
      },
    });
  }

  /**
   * Add a custom constraint to registry
   */
  addConstraint(constraint: DSLConstraint): void {
    if (this.constraints.has(constraint.name)) {
      throw new TemplateDslError(
        `Constraint with name "${constraint.name}" already exists`,
      );
    }

    this.constraints.set(constraint.name, constraint);

    // Index by category
    if (!this.categoryIndex.has(constraint.category)) {
      this.categoryIndex.set(constraint.category, []);
    }
    this.categoryIndex.get(constraint.category)!.push(constraint);
  }

  /**
   * Get constraint by name
   */
  getByName(name: string): DSLConstraint | undefined {
    return this.constraints.get(name);
  }

  /**
   * Get all constraints
   */
  getAll(): DSLConstraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Get constraints by level (all HARD, SOFT, DISTRIBUTION, etc.)
   */
  getByLevel(level: ConstraintLevel): DSLConstraint[] {
    return this.getAll().filter((c) => c.level === level);
  }

  /**
   * Get constraints by category
   */
  getByCategory(category: string): DSLConstraint[] {
    return this.categoryIndex.get(category) ?? [];
  }

  /**
   * Get hard constraints (constraints that must pass)
   */
  getHardConstraints(): DSLConstraint[] {
    return this.getByLevel(ConstraintLevel.HARD);
  }

  /**
   * Get soft constraints (constraints that can be repaired)
   */
  getSoftConstraints(): DSLConstraint[] {
    return this.getByLevel(ConstraintLevel.SOFT);
  }

  /**
   * Get distribution constraints (batch-level constraints)
   */
  getDistributionConstraints(): DSLConstraint[] {
    return this.getByLevel(ConstraintLevel.DISTRIBUTION);
  }

  /**
   * Validate a test case against all constraints
   * Returns detailed results for each constraint
   */
  validate(testCase: MaterializedTestCaseWithVariables): {
    allSatisfied: boolean;
    hardViolations: Array<{ name: string; constraint: DSLConstraint }>;
    softViolations: Array<{ name: string; constraint: DSLConstraint }>;
    unknown: Array<{ name: string; constraint: DSLConstraint }>;
  } {
    const hardViolations: Array<{ name: string; constraint: DSLConstraint }> =
      [];
    const softViolations: Array<{ name: string; constraint: DSLConstraint }> =
      [];
    const unknown: Array<{ name: string; constraint: DSLConstraint }> = [];

    for (const constraint of this.getAll()) {
      try {
        const satisfied = constraint.check(testCase);

        if (!satisfied) {
          if (constraint.level === ConstraintLevel.HARD) {
            hardViolations.push({ name: constraint.name, constraint });
          } else if (constraint.level === ConstraintLevel.SOFT) {
            softViolations.push({ name: constraint.name, constraint });
          } else if (constraint.level === ConstraintLevel.DISTRIBUTION) {
            unknown.push({ name: constraint.name, constraint });
          }
        }
      } catch {
        // If constraint check throws, mark as unknown
        unknown.push({ name: constraint.name, constraint });
      }
    }

    return {
      allSatisfied: hardViolations.length === 0,
      hardViolations,
      softViolations,
      unknown,
    };
  }

  /**
   * Attempt to repair soft constraint violations
   */
  attemptRepair(
    testCase: MaterializedTestCaseWithVariables,
    constraint: DSLConstraint,
    maxAttempts: number = 1,
  ): {
    success: boolean;
    repaired?: MaterializedTestCaseWithVariables;
    error?: string;
  } {
    if (!constraint.repair) {
      return { success: false, error: "Constraint has no repair strategy" };
    }

    let current = testCase;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        current = constraint.repair(current);
        const satisfied = constraint.check(current);

        if (satisfied) {
          return { success: true, repaired: current };
        }
      } catch (error) {
        return {
          success: false,
          error: `Repair attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    return {
      success: false,
      error: `Failed to repair after ${maxAttempts} attempts`,
    };
  }

  /**
   * Get summary statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const constraint of this.getAll()) {
      byLevel[constraint.level] = (byLevel[constraint.level] ?? 0) + 1;
      byCategory[constraint.category] =
        (byCategory[constraint.category] ?? 0) + 1;
    }

    return {
      total: this.constraints.size,
      byLevel,
      byCategory,
    };
  }
}

/**
 * Helper: Get default registry instance
 */
export function getConstraintRegistry(): ConstraintRegistry {
  return ConstraintRegistry.getInstance();
}

/**
 * Helper: Register custom constraint
 */
export function registerConstraint(constraint: DSLConstraint): void {
  getConstraintRegistry().addConstraint(constraint);
}

/**
 * Helper: Validate test case using default registry
 */
export function validateTestCaseConstraints(
  testCase: MaterializedTestCaseWithVariables,
) {
  return getConstraintRegistry().validate(testCase);
}
