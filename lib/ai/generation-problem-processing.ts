import { createHash } from 'node:crypto';
import { PistonClientImpl } from '@/lib/execution/client';
import { TestCaseEvaluatorImpl } from '@/lib/execution/evaluator';
import type { SupportedLanguage } from '@/lib/execution/types';
import {
  hasUnresolvedPlaceholder,
  hashTemplateSpec,
  materializeTestCaseInputTemplate,
} from '@/lib/testcases/template-dsl';
import type { GeneratedProblem } from './types';

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

async function detectReferenceLanguage(
  solutionCode: string,
  candidateLanguages: readonly SupportedLanguage[],
  pistonClient: PistonClientImpl
): Promise<{ language: SupportedLanguage } | { error: string }> {
  const compileErrors: string[] = [];

  for (const language of candidateLanguages) {
    try {
      const response = await pistonClient.execute({
        language: pistonClient.mapLanguage(language),
        version: '*',
        files: [{ content: solutionCode }],
        stdin: '',
        compile_timeout: 10_000,
        run_timeout: 500,
      });

      if (!response.compile || response.compile.code === 0) {
        return { language };
      }

      compileErrors.push(`${language}: ${response.compile.stderr || 'Compilation failed'}`);
    } catch (error) {
      compileErrors.push(
        `${language}: ${error instanceof Error ? error.message : 'Unknown compile failure'}`
      );
    }
  }

  return {
    error: `Model solution failed to compile in all candidate languages (${candidateLanguages.join(', ')}). ${compileErrors.join(' | ')}`,
  };
}

export async function validateProblemsAgainstModel(
  problems: readonly GeneratedProblem[],
  languages: readonly SupportedLanguage[],
  seedMaterial: string
): Promise<ValidationOutcome> {
  const pistonClient = new PistonClientImpl();
  const evaluator = new TestCaseEvaluatorImpl();
  const validatedProblems: GeneratedProblem[] = [];

  for (let problemIndex = 0; problemIndex < problems.length; problemIndex += 1) {
    const problem = problems[problemIndex];
    const validatedProblem: GeneratedProblem = {
      ...problem,
      test_cases: [],
    };

    const referenceLanguage = await detectReferenceLanguage(
      problem.solution_code,
      languages,
      pistonClient
    );

    if ('error' in referenceLanguage) {
      return {
        ok: false,
        message: `Problem ${problemIndex + 1}: ${referenceLanguage.error}`,
      };
    }

    const runTimeout = Math.min(Math.max(problem.time_limit || 2000, 500), 10_000);
    const runMemoryLimit = Math.min(Math.max(problem.memory_limit || 256, 64), 1024) * 1024 * 1024;

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
          persistedInput = testCase.is_sample
            ? expandedInput
            : '';
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

      try {
        const response = await pistonClient.execute({
          language: pistonClient.mapLanguage(referenceLanguage.language),
          version: '*',
          files: [{ content: problem.solution_code }],
          stdin: expandedInput,
          compile_timeout: 10_000,
          run_timeout: runTimeout,
          run_memory_limit: runMemoryLimit,
        });

        if (response.compile && response.compile.code !== 0) {
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: compile error - ${response.compile.stderr || 'Compilation failed'}`,
          };
        }

        if (response.run.code !== 0) {
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: runtime error - ${response.run.stderr || 'Runtime error'}`,
          };
        }

        const rawActualOutput = response.run.stdout || response.run.output || '';
        const normalizedActual = evaluator.normalizeOutput(rawActualOutput);
        const expectedOutput =
          typeof testCase.expected_output === 'string' ? testCase.expected_output : '';
        const shouldAutoDeriveExpected =
          expectedOutput.trim().length === 0 || hasUnresolvedPlaceholder(expectedOutput);
        const normalizedExpected = shouldAutoDeriveExpected
          ? normalizedActual
          : evaluator.normalizeOutput(expectedOutput);

        if (!shouldAutoDeriveExpected && normalizedActual !== normalizedExpected) {
          return {
            ok: false,
            message:
              `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: model solution output mismatch. ` +
              `Expected "${normalizedExpected}" but received "${normalizedActual}".`,
          };
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
