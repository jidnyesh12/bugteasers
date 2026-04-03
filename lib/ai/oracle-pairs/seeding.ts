/**
 * Seeding System: Deterministic seed derivation and tracking for oracle pairs
 *
 * Purpose: Single generation_seed controls both test case materialization
 * and model answer generation, enabling perfect reproducibility.
 *
 * Seed Format: HMAC-SHA256(masterSeed || delimiter || problemId || delimiter || testCaseIndex)
 * This ensures different test cases get different seeds while remaining deterministic.
 */

import { createHmac } from 'node:crypto';
import { TemplateDslError } from '../template-dsl/errors';

export const GENERATION_SEED_VERSION = 1;
export const GENERATION_SEED_LENGTH = 64; // SHA256 hex = 64 chars

/**
 * Parsed Generation Seed with tracking information
 */
export interface GenerationSeedInfo {
  version: number;
  value: string; // Hex-encoded 256-bit seed
  masterSeed: string;
  problemId: string;
  testCaseIndex: number;
  timestamp: string; // ISO 8601
  chain: string[]; // Seed transformations for audit trail
}

/**
 * Generation Seed Class: Manages seed creation, derivation, and tracking
 */
export class GenerationSeed {
  private value: string;
  private version: number;
  private masterSeed: string;
  private problemId: string;
  private testCaseIndex: number;
  private timestamp: string;
  private chain: string[]; // Track seed transformations

  /**
   * Create a GenerationSeed from components
   */
  constructor(
    value: string,
    masterSeed: string,
    problemId: string,
    testCaseIndex: number,
    version: number = GENERATION_SEED_VERSION,
    timestamp?: string
  ) {
    if (!this.isValidSeedValue(value)) {
      throw new TemplateDslError(`Invalid seed value: must be 64 hex characters, got ${value}`);
    }
    if (testCaseIndex < 0) {
      throw new TemplateDslError(`testCaseIndex must be non-negative, got ${testCaseIndex}`);
    }

    this.value = value;
    this.version = version;
    this.masterSeed = masterSeed;
    this.problemId = problemId;
    this.testCaseIndex = testCaseIndex;
    this.timestamp = timestamp || new Date().toISOString();
    this.chain = [value]; // Initialize with starting seed
  }

  /**
   * Derive a seed from components using HMAC-SHA256
   * Deterministic: same inputs always produce same seed
   */
  static derive(options: {
    masterSeed: string;
    problemId: string;
    testCaseIndex: number;
    version?: number;
  }): GenerationSeed {
    const { masterSeed, problemId, testCaseIndex, version = GENERATION_SEED_VERSION } = options;

    if (!masterSeed || masterSeed.trim().length === 0) {
      throw new TemplateDslError('masterSeed must be non-empty');
    }
    if (!problemId || problemId.trim().length === 0) {
      throw new TemplateDslError('problemId must be non-empty');
    }

    // Create HMAC: HMAC(masterSeed, problemId||delimiter||testCaseIndex)
    const delimiter = '|';
    const input = `${problemId}${delimiter}${testCaseIndex}`;

    const hmac = createHmac('sha256', masterSeed);
    hmac.update(input);
    const derivedSeed = hmac.digest('hex');

    return new GenerationSeed(derivedSeed, masterSeed, problemId, testCaseIndex, version);
  }

  /**
   * Create from an existing seed value (for deserialization)
   */
  static fromValue(
    value: string,
    masterSeed: string,
    problemId: string,
    testCaseIndex: number,
    version: number = GENERATION_SEED_VERSION
  ): GenerationSeed {
    return new GenerationSeed(value, masterSeed, problemId, testCaseIndex, version);
  }

  /**
   * Validate that a seed value is properly formatted
   */
  private isValidSeedValue(value: string): boolean {
    // Must be exactly 64 hex characters (SHA256 hash)
    if (typeof value !== 'string') return false;
    if (value.length !== GENERATION_SEED_LENGTH) return false;
    // Check all characters are hex
    return /^[0-9a-f]{64}$/i.test(value);
  }

  /**
   * Get the raw seed value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get seed as it should be used for materialization
   */
  getMaterializationSeed(): string {
    return this.value;
  }

  /**
   * Get seed as it should be used for model answer generation
   */
  getModelAnswerSeed(): string {
    return this.value;
  }

  /**
   * Get full seed information for serialization
   */
  toInfo(): GenerationSeedInfo {
    return {
      version: this.version,
      value: this.value,
      masterSeed: this.masterSeed,
      problemId: this.problemId,
      testCaseIndex: this.testCaseIndex,
      timestamp: this.timestamp,
      chain: [...this.chain],
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON(): Omit<GenerationSeedInfo, 'chain'> {
    return {
      version: this.version,
      value: this.value,
      masterSeed: this.masterSeed,
      problemId: this.problemId,
      testCaseIndex: this.testCaseIndex,
      timestamp: this.timestamp,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: Omit<GenerationSeedInfo, 'chain'>): GenerationSeed {
    return new GenerationSeed(
      json.value,
      json.masterSeed,
      json.problemId,
      json.testCaseIndex,
      json.version,
      json.timestamp
    );
  }

  /**
   * Record a transformation in the seed chain (for diagnostics)
   * Returns a new seed with the updated chain
   */
  withChainEntry(entry: string): GenerationSeed {
    const seed = new GenerationSeed(
      this.value,
      this.masterSeed,
      this.problemId,
      this.testCaseIndex,
      this.version
    );
    seed.chain = [...this.chain, entry];
    return seed;
  }

  /**
   * Get the full seed chain for audit trail
   */
  getChain(): string[] {
    return [...this.chain];
  }

  /**
   * Verify that a seed hasn't been tampered with
   * (Check that provided value matches expected value)
   */
  verify(other: Partial<GenerationSeedInfo>): boolean {
    if (!other) return false;
    if (other.value !== this.value) return false;
    if (other.problemId !== this.problemId) return false;
    if (other.testCaseIndex !== this.testCaseIndex) return false;
    if (other.version !== this.version) return false;
    return true;
  }

  /**
   * Get human-readable representation
   */
  toString(): string {
    return `GenerationSeed(v${this.version}, problem=${this.problemId}, index=${this.testCaseIndex}, seed=${this.value.substring(0, 8)}...)`;
  }
}

/**
 * Seed Derivation Builder: Fluent API for deriving seeds with validation
 */
export class SeedDerivationBuilder {
  private masterSeed: string | null = null;
  private problemId: string | null = null;
  private testCaseIndex: number | null = null;
  private version: number = GENERATION_SEED_VERSION;

  withMasterSeed(seed: string): this {
    if (!seed || seed.trim().length === 0) {
      throw new TemplateDslError('masterSeed cannot be empty');
    }
    this.masterSeed = seed;
    return this;
  }

  withProblemId(id: string): this {
    if (!id || id.trim().length === 0) {
      throw new TemplateDslError('problemId cannot be empty');
    }
    this.problemId = id;
    return this;
  }

  withTestCaseIndex(index: number): this {
    if (index < 0 || !Number.isInteger(index)) {
      throw new TemplateDslError('testCaseIndex must be non-negative integer');
    }
    this.testCaseIndex = index;
    return this;
  }

  withVersion(v: number): this {
    if (v < 1 || !Number.isInteger(v)) {
      throw new TemplateDslError('version must be positive integer');
    }
    this.version = v;
    return this;
  }

  /**
   * Build the seed - validates all required fields
   */
  build(): GenerationSeed {
    if (this.masterSeed === null) {
      throw new TemplateDslError('masterSeed is required');
    }
    if (this.problemId === null) {
      throw new TemplateDslError('problemId is required');
    }
    if (this.testCaseIndex === null) {
      throw new TemplateDslError('testCaseIndex is required');
    }

    return GenerationSeed.derive({
      masterSeed: this.masterSeed,
      problemId: this.problemId,
      testCaseIndex: this.testCaseIndex,
      version: this.version,
    });
  }
}

/**
 * Helper: Derive seeds for a batch of test cases
 */
export function deriveSeedsForBatch(
  masterSeed: string,
  problemId: string,
  batchSize: number,
  version: number = GENERATION_SEED_VERSION
): GenerationSeed[] {
  const seeds: GenerationSeed[] = [];
  for (let i = 0; i < batchSize; i++) {
    seeds.push(
      GenerationSeed.derive({
        masterSeed,
        problemId,
        testCaseIndex: i,
        version,
      })
    );
  }
  return seeds;
}

/**
 * Helper: Verify seed consistency across a batch
 * Ensures seeds are unique and properly derived
 */
export function verifyBatchSeedConsistency(seeds: GenerationSeed[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const seed of seeds) {
    const value = seed.getValue();

    // Check for duplicates
    if (seen.has(value)) {
      errors.push(`Duplicate seed value found: ${value}`);
    }
    seen.add(value);

    // Check seed format
    if (value.length !== GENERATION_SEED_LENGTH) {
      errors.push(`Invalid seed length in seed ${seed.toString()}: ${value.length}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
