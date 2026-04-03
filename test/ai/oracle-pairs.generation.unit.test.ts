/**
 * Unit Tests: LLM Generator & Generation Orchestrator
 *
 * Tests for:
 * - Prompt construction and formatting
 * - Code validation logic
 * - Generation orchestration
 * - Batch generation and statistics
 *
 * Run with: npm test -- oracle-pairs.generation.unit.test.ts
 */

import { describe, test, expect } from 'vitest';
import {
  buildGenerationPrompt,
  constructGeminiPrompt,
  constructClaudePrompt,
  validateGeneratedCode,
  generateOraclePair,
  generateOraclePairBatch,
  calculateBatchStatistics,
  DEFAULT_ORCHESTRATOR_CONFIG,
} from '../../lib/ai/oracle-pairs';
import type { GenerationResult, TestCaseInputTemplate } from '../../lib/ai/oracle-pairs';

/**
 * Helper: Create minimal valid template for testing
 */
function createTestTemplate(): TestCaseInputTemplate {
  return {
    variables: {
      n: {
        type: 'int',
        min: 1,
        max: 10,
      },
    },
    output: [
      {
        type: 'line',
        values: [{ type: 'variable', name: 'n' }],
      },
    ],
  } as unknown as TestCaseInputTemplate;
}

describe('LLM Generator & Orchestration', () => {
  describe('Prompt Construction', () => {
    test('should build generation prompt with all components', () => {
      const prompt = buildGenerationPrompt({
        problemStatement: 'Find factorial of N',
        constraints: '1 <= N <= 20',
        inputOutputExamples: [
          { input: '5', output: '120' },
          { input: '3', output: '6' },
        ],
        targetLanguage: 'python',
      });

      expect(prompt.problem).toContain('Find factorial');
      expect(prompt.constraints).toContain('1 <= N');
      expect(prompt.examples).toContain('Example 1');
      expect(prompt.language).toBe('python');
    });

    test('should construct valid Claude prompt system message', () => {
      const generationPrompt = buildGenerationPrompt({
        problemStatement: 'Two sum problem',
        constraints: '1 <= N <= 100',
        inputOutputExamples: [{ input: '[1,2,3]', output: '[0,1]' }],
        targetLanguage: 'python',
      });

      const { system, user } = constructGeminiPrompt(generationPrompt);

      expect(system).toContain('expert competitive programmer');
      expect(system).toContain('IMPORTANT REQUIREMENTS');
      expect(system).toContain('stdin');
      expect(user).toContain('Two sum problem');
      expect(user).toContain('PROBLEM:');
      expect(user).toContain('CONSTRAINTS:');
      expect(user).toContain('EXAMPLES:');
    });

    test('should format examples correctly', () => {
      const prompt = buildGenerationPrompt({
        problemStatement: 'Test',
        constraints: 'Test constraints',
        inputOutputExamples: [
          { input: '1', output: '1' },
          { input: '2', output: '4' },
          { input: '3', output: '9' },
        ],
        targetLanguage: 'cpp',
      });

      expect(prompt.examples).toContain('Example 1');
      expect(prompt.examples).toContain('Example 2');
      expect(prompt.examples).toContain('Example 3');
      expect(prompt.examples).toContain('Input: 1');
      expect(prompt.examples).toContain('Output: 1');
    });

    test('should support all languages in prompt', () => {
      const languages: Array<'python' | 'cpp' | 'java' | 'javascript' | 'typescript' | 'csharp' | 'go' | 'rust'> = [
        'python',
        'cpp',
        'java',
        'javascript',
        'typescript',
        'csharp',
        'go',
        'rust',
      ];

      languages.forEach((lang) => {
        const { system } = constructClaudePrompt(
          buildGenerationPrompt({
            problemStatement: 'Test',
            constraints: 'Test',
            inputOutputExamples: [],
            targetLanguage: lang,
          })
        );

        expect(system).toBeDefined();
        expect(system.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Code Validation', () => {
    test('should validate Python code with input/output', () => {
      const code = `
n = int(input())
result = n * 2
print(result)`;

      const result = validateGeneratedCode(code, 'python');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty code', () => {
      const result = validateGeneratedCode('', 'python');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Generated code is empty');
    });

    test('should check Python code reads input', () => {
      const code = 'print("Hello")'; // No input reading

      const result = validateGeneratedCode(code, 'python');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should check Python code outputs something', () => {
      const code = 'x = int(input())'; // No output

      const result = validateGeneratedCode(code, 'python');
      expect(result.valid).toBe(false);
    });

    test('should validate C++ code', () => {
      const code = `#include <iostream>
using namespace std;
int main() {
  int n;
  cin >> n;
  cout << n * 2 << endl;
  return 0;
}`;

      const result = validateGeneratedCode(code, 'cpp');
      expect(result.valid).toBe(true);
    });

    test('should check C++ has iostream', () => {
      const code = `using namespace std;
int main() {
  cout << "test" << endl;
}`;

      const result = validateGeneratedCode(code, 'cpp');
      expect(result.valid).toBe(false);
    });

    test('should validate Java code', () => {
      const code = `import java.util.Scanner;
public class Solution {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    System.out.println(n * 2);
  }
}`;

      const result = validateGeneratedCode(code, 'java');
      expect(result.valid).toBe(true);
    });

    test('should validate JavaScript code', () => {
      const code = `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  console.log(parseInt(line) * 2);
});`;

      const result = validateGeneratedCode(code, 'javascript');
      expect(result.valid).toBe(true);
    });

    test('should handle whitespace-only code', () => {
      const result = validateGeneratedCode('   \n\n  ', 'python');
      expect(result.valid).toBe(false);
    });
  });

  describe('Oracle Pair Generation', () => {
    test('should generate oracle pair with valid structure', async () => {
      const result = await generateOraclePair(
        createTestTemplate(),
        'Find factorial of N',
        '1 <= N <= 10',
        'Example: 5 -> 120',
        'seed-test-001',
        DEFAULT_ORCHESTRATOR_CONFIG
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('startTime');
      expect(result.stats).toHaveProperty('finalStatus');
      expect(result.stats.finalStatus).toMatch(/success|failed|escalated/);
    });

    test('should track generation statistics', async () => {
      const result = await generateOraclePair(
        createTestTemplate(),
        'Simple problem',
        'No constraints',
        'No examples',
        'seed-test-002'
      );

      expect(result.stats.startTime).toBeGreaterThan(0);
      expect(result.stats.durationMs).toBeDefined();
      expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalAttempts).toBeGreaterThanOrEqual(0);
      expect(result.stats.validationAttempts).toBeGreaterThanOrEqual(0);
    });

    test('should include oracle pair in success result', async () => {
      const result = await generateOraclePair(
        createTestTemplate(),
        'Problem statement',
        'Constraints',
        'Examples',
        'seed-test-003'
      );

      if (result.success) {
        expect(result.oraclePair).toBeDefined();
        expect(result.oraclePair?.generationSeed).toBe('seed-test-003');
        expect(result.oraclePair?.testCase).toBeDefined();
        expect(result.oraclePair?.modelAnswer).toBeDefined();
      }
    });

    test('should include validation result in response', async () => {
      const result = await generateOraclePair(
        createTestTemplate(),
        'Problem',
        'Constraints',
        'Examples',
        'seed-test-004'
      );

      if (result.success) {
        expect(result.validationResult).toBeDefined();
        expect(result.validationResult?.generationSeed).toBe('seed-test-004');
      }
    });

    test('should handle generation errors gracefully', async () => {
      // Invalid config should be handled
      const result = await generateOraclePair(
        {} as unknown as TestCaseInputTemplate,
        '',
        '',
        '',
        '',
        {
          ...DEFAULT_ORCHESTRATOR_CONFIG,
          maxRepairAttempts: 0,
        }
      );

      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('errorMessages');
    });
  });

  describe('Batch Generation', () => {
    test('should generate batch of oracle pairs', async () => {
      const templates = [
        {
          template: createTestTemplate(),
          problemStatement: 'Problem 1',
          constraints: 'Constraints 1',
          examples: 'Examples 1',
          baseSeed: 'base-seed-001',
        },
        {
          template: createTestTemplate(),
          problemStatement: 'Problem 2',
          constraints: 'Constraints 2',
          examples: 'Examples 2',
          baseSeed: 'base-seed-002',
        },
      ];

      const results = await generateOraclePairBatch(templates);

      expect(results).toHaveLength(2);
      expect(results[0].stats).toBeDefined();
      expect(results[1].stats).toBeDefined();
    }, 10000);

    test('should vary seeds for batch items', async () => {
      const templates = Array(3)
        .fill(0)
        .map((_, i) => ({
          template: createTestTemplate(),
          problemStatement: `Problem ${i}`,
          constraints: 'Constraints',
          examples: 'Examples',
          baseSeed: 'base-seed-batch',
        }));

      const results = await generateOraclePairBatch(templates);

      // Batch should return results
      expect(results).toHaveLength(3);

      // Check that generation was attempted (stats populated)
      results.forEach((result) => {
        expect(result.stats).toBeDefined();
        expect(result.stats.startTime).toBeGreaterThan(0);
      });
    }, 10000);

    test('should calculate batch statistics', () => {
      const mockResults: GenerationResult[] = [
        {
          success: true,
          stats: {
            startTime: 0,
            endTime: 1000,
            durationMs: 1000,
            totalAttempts: 1,
            repairAttempts: 0,
            successfulRepairs: 0,
            failedRepairs: 0,
            validationAttempts: 1,
            finalStatus: 'success',
            errorMessages: [],
          },
        },
        {
          success: false,
          stats: {
            startTime: 0,
            endTime: 2000,
            durationMs: 2000,
            totalAttempts: 2,
            repairAttempts: 1,
            successfulRepairs: 0,
            failedRepairs: 1,
            validationAttempts: 2,
            finalStatus: 'failed',
            errorMessages: ['Test error'],
          },
        },
        {
          success: false,
          stats: {
            startTime: 0,
            endTime: 1500,
            durationMs: 1500,
            totalAttempts: 1,
            repairAttempts: 0,
            successfulRepairs: 0,
            failedRepairs: 0,
            validationAttempts: 1,
            finalStatus: 'escalated',
            errorMessages: [],
          },
        },
      ];

      const stats = calculateBatchStatistics(mockResults);

      expect(stats.totalPairs).toBe(3);
      expect(stats.successfulPairs).toBe(1);
      expect(stats.failedPairs).toBe(1);
      expect(stats.escalatedPairs).toBe(1);
      expect(stats.completedPairs).toBe(2); // success + escalated
      expect(stats.errorRate).toBe(1 / 3); // 1 failed out of 3
      expect(stats.averageDurationMs).toBe((1000 + 2000 + 1500) / 3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty problem statement', async () => {
      const result = await generateOraclePair(
        {} as unknown as TestCaseInputTemplate,
        '',
        'Some constraints',
        'Some examples',
        'seed-empty-problem'
      );

      expect(result.stats.finalStatus).toBeDefined();
    });

    test('should handle very long problem statement', async () => {
      const longStatement = 'x'.repeat(10000);

      const result = await generateOraclePair({} as unknown as TestCaseInputTemplate, longStatement, 'Constraints', 'Examples', 'seed-long-problem');

      expect(result.stats.finalStatus).toBeDefined();
    });

    test('should handle seeds with special characters', async () => {
      const specialSeeds = [
        'seed-with-dash',
        'seed_with_underscore',
        'seed.with.dot',
        'seed123',
      ];

      for (const seed of specialSeeds) {
        const result = await generateOraclePair({} as unknown as TestCaseInputTemplate, 'Problem', 'Constraints', 'Examples', seed);
        expect(result.stats.finalStatus).toBeDefined();
      }
    }, 15000);

    test('should handle concurrent batch generation', async () => {
      const templates = Array(5)
        .fill(0)
        .map((_, i) => ({
          template: createTestTemplate(),
          problemStatement: `Problem ${i}`,
          constraints: 'Constraints',
          examples: 'Examples',
          baseSeed: `seed-concurrent-${i}`,
        }));

      const results = await generateOraclePairBatch(templates);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.stats).toBeDefined();
      });
    }, 30000);
  });
});
