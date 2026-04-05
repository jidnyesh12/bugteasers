import { createHash } from 'node:crypto';
import { TestCaseEvaluatorImpl } from '@/lib/execution/evaluator';
import {
  hasUnresolvedPlaceholder,
  hashTemplateSpec,
  materializeTestCaseInputTemplate,
} from '@/lib/ai/template-dsl';
import {
  createTestCase,
  createModelAnswer,
  createOraclePair,
} from '@/lib/ai/oracle-pairs';
import { validateOraclePair, DEFAULT_VALIDATOR_CONFIG } from '@/lib/ai/oracle-pairs/validator';
import type { GeneratedProblem } from './types';

// Model answer validation always runs in C++.
const MODEL_ANSWER_LANGUAGE = 'cpp' as const;

export interface ValidationOutcome {
  ok: boolean;
  message?: string;
  problems?: GeneratedProblem[];
}

export function annotateGeneratedProblems(
  problems: GeneratedProblem[],
  model: string,
  seed: string
): GeneratedProblem[] {
  const generatedAt = new Date().toISOString();

  return problems.map((problem) => ({
    ...problem,
    test_cases: problem.test_cases.map((testCase, index) => {
      const caseSeed =
        testCase.generation_seed && testCase.generation_seed.trim().length > 0
          ? testCase.generation_seed
          : `${seed}:problem-${problem.title}:case-${index + 1}`;

      const templateHash = testCase.input_template
        ? hashTemplateSpec(testCase.input_template)
        : null;

      const inputHash =
        templateHash ??
        createHash('sha256')
          .update(typeof testCase.input_data === 'string' ? testCase.input_data : '')
          .digest('hex');

      return {
        ...testCase,
        generated_at: generatedAt,
        generation_model: model,
        generation_seed: caseSeed,
        is_generated: true,
        input_hash: inputHash,
      };
    }),
  }));
}

/**
 * Strip single-line and multi-line comments from C++ source code.
 */
function stripCppComments(code: string): string {
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/\/\/.*/g, '');
  return result;
}

export async function validateProblemsAgainstModel(
  problems: readonly GeneratedProblem[],
  seedMaterial: string
): Promise<ValidationOutcome> {
  const evaluator = new TestCaseEvaluatorImpl();
  const validatedProblems: GeneratedProblem[] = [];

  for (let problemIndex = 0; problemIndex < problems.length; problemIndex += 1) {
    const problem = problems[problemIndex];
    const validatedProblem: GeneratedProblem = {
      ...problem,
      test_cases: [],
    };

    const referenceLanguage = MODEL_ANSWER_LANGUAGE;
    const solutionCode = stripCppComments(problem.solution_code);
    const runTimeout = Math.min(Math.max(problem.time_limit || 2000, 500), 10_000);

    for (let testCaseIndex = 0; testCaseIndex < problem.test_cases.length; testCaseIndex += 1) {
      const testCase = problem.test_cases[testCaseIndex];
      const fallbackSeed =
        testCase.generation_seed && testCase.generation_seed.trim().length > 0
          ? testCase.generation_seed
          : `${seedMaterial}:problem-${problemIndex + 1}:case-${testCaseIndex + 1}`;

      let expandedInput =
        typeof testCase.input_data === 'string' ? testCase.input_data : '';
      let persistedInput = expandedInput;
      let inputHash =
        typeof testCase.input_hash === 'string' && testCase.input_hash.trim().length > 0
          ? testCase.input_hash
          : createHash('sha256').update(expandedInput).digest('hex');

      if (testCase.input_template) {
        try {
          const materialized = materializeTestCaseInputTemplate(testCase.input_template, {
            seedMaterial: fallbackSeed,
          });

          expandedInput = materialized.inputData;
          inputHash = hashTemplateSpec(testCase.input_template);
          // Always persist materialized input so the preview page can display it.
          persistedInput = expandedInput;
        } catch (error) {
          return {
            ok: false,
            message:
              `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: ` +
              `template materialization failed - ${error instanceof Error ? error.message : 'Unknown template error'}`,
          };
        }
      }

      if (expandedInput.trim().length === 0) {
        return {
          ok: false,
          message:
            `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: ` +
            'input_data is empty after template materialization.',
        };
      }

      const expectedOutput =
        typeof testCase.expected_output === 'string' ? testCase.expected_output : '';
      const shouldAutoDeriveExpected =
        expectedOutput.trim().length === 0 || hasUnresolvedPlaceholder(expectedOutput);

      try {
        // Build oracle pair: test case input + model answer code
        const oraclePair = createOraclePair(
          createTestCase(
            expandedInput,
            shouldAutoDeriveExpected ? '' : expectedOutput,
            fallbackSeed,
            fallbackSeed,
            {},
            1
          ),
          createModelAnswer(solutionCode, referenceLanguage, fallbackSeed, 'gemini-3-flash')
        );

        // Validate via oracle pair — this now actually executes code via Piston
        const validationResult = await validateOraclePair(oraclePair, {
          ...DEFAULT_VALIDATOR_CONFIG,
          timeout: runTimeout,
          maxDifferentialOracles: 1,
          confidenceThreshold: 0.8,
        });

        // Check execution status from the oracle result
        if (validationResult.modelAnswerStatus === 'runtime_error') {
          const errMsg = validationResult.diagnostics?.executionErrors?.[0] || 'Runtime error';
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: runtime error - ${errMsg}`,
          };
        }

        if (validationResult.modelAnswerStatus === 'timeout') {
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: execution timed out`,
          };
        }

        if (validationResult.modelAnswerStatus === 'syntax_error') {
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: compile error`,
          };
        }

        // Use the actual output from execution
        const normalizedActual = evaluator.normalizeOutput(validationResult.actualOutput || '');

        // If expected output was provided, compare
        if (!shouldAutoDeriveExpected) {
          const normalizedExpected = evaluator.normalizeOutput(expectedOutput);
          if (normalizedActual !== normalizedExpected) {
            return {
              ok: false,
              message:
                `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: model solution output mismatch. ` +
                `Expected "${normalizedExpected}" but received "${normalizedActual}".`,
            };
          }
        }

        validatedProblem.test_cases.push({
          ...testCase,
          input_data: persistedInput,
          expected_output: shouldAutoDeriveExpected ? normalizedActual : expectedOutput,
          generation_seed: fallbackSeed,
          input_hash: inputHash,
        });
      } catch (error) {
        return {
          ok: false,
          message:
            `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: execution failed - ` +
            `${error instanceof Error ? error.message : 'Unknown execution failure'}`,
        };
      }
    }

    validatedProblems.push(validatedProblem);
  }

  return {
    ok: true,
    problems: validatedProblems,
  };
}
