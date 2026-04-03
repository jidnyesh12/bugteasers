import { createHash } from 'node:crypto';
import type { TestCaseInputTemplate } from '@/lib/ai/template-dsl';
import {
  hasUnresolvedPlaceholder,
  hashTemplateSpec,
  materializeTestCaseInputTemplate,
  validateTestCaseInputTemplate,
} from '@/lib/ai/template-dsl';

export type SaveGeneratedTestCase = {
  input_data: string;
  input_template?: TestCaseInputTemplate;
  expected_output: string;
  is_sample?: boolean;
  points?: number;
  generated_at?: string;
  generation_model?: string;
  generation_seed?: string;
  is_generated?: boolean;
  input_hash?: string;
};

export class SaveProblemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveProblemValidationError';
  }
}

export function normalizeProblemTestCasesForSave(params: {
  testCases: unknown;
  problemTitle?: string;
  userId: string;
}): SaveGeneratedTestCase[] {
  const { testCases, problemTitle, userId } = params;

  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new SaveProblemValidationError('Each problem must include at least one valid test case');
  }

  const normalized: SaveGeneratedTestCase[] = [];

  for (let caseIndex = 0; caseIndex < testCases.length; caseIndex += 1) {
    const rawTestCase = testCases[caseIndex];

    if (!rawTestCase || typeof rawTestCase !== 'object' || Array.isArray(rawTestCase)) {
      throw new SaveProblemValidationError(`Problem test case ${caseIndex + 1} is malformed`);
    }

    const testCase = rawTestCase as SaveGeneratedTestCase;

    const hasTemplate = testCase.input_template !== undefined && testCase.input_template !== null;
    const rawInput = typeof testCase.input_data === 'string' ? testCase.input_data : '';
    const rawExpectedOutput =
      typeof testCase.expected_output === 'string' ? testCase.expected_output : '';

    if (rawExpectedOutput.trim().length === 0 || hasUnresolvedPlaceholder(rawExpectedOutput)) {
      throw new SaveProblemValidationError(
        `Problem test case ${caseIndex + 1} must include a resolved expected_output before saving.`
      );
    }

    if (!hasTemplate) {
      if (rawInput.trim().length === 0 || hasUnresolvedPlaceholder(rawInput)) {
        throw new SaveProblemValidationError(
          `Problem test case ${caseIndex + 1} has unresolved or invalid input_data.`
        );
      }

      normalized.push({
        ...testCase,
        input_data: rawInput,
        input_template: undefined,
        expected_output: rawExpectedOutput,
        input_hash: testCase.input_hash ?? createHash('sha256').update(rawInput).digest('hex'),
      });

      continue;
    }

    try {
      validateTestCaseInputTemplate(testCase.input_template);
    } catch (error) {
      throw new SaveProblemValidationError(
        `Problem test case ${caseIndex + 1} has invalid input_template: ${
          error instanceof Error ? error.message : 'Unknown template error'
        }`
      );
    }

    const seedMaterial =
      typeof testCase.generation_seed === 'string' && testCase.generation_seed.trim().length > 0
        ? testCase.generation_seed
        : createHash('sha256')
            .update(`${userId}:${problemTitle ?? 'problem'}:case-${caseIndex + 1}`)
            .digest('hex');

    let materializedInput: string;
    try {
      const materialized = materializeTestCaseInputTemplate(testCase.input_template, {
        seedMaterial,
      });
      materializedInput = materialized.inputData;
    } catch (error) {
      throw new SaveProblemValidationError(
        `Problem test case ${caseIndex + 1} template materialization failed: ${
          error instanceof Error ? error.message : 'Unknown template error'
        }`
      );
    }

    const persistedInput =
      rawInput.trim().length > 0 && !hasUnresolvedPlaceholder(rawInput)
        ? rawInput
        : testCase.is_sample
          ? materializedInput
          : '';

    normalized.push({
      ...testCase,
      input_data: persistedInput,
      input_template: testCase.input_template,
      expected_output: rawExpectedOutput,
      generation_seed: seedMaterial,
      input_hash: testCase.input_hash ?? hashTemplateSpec(testCase.input_template),
    });
  }

  return normalized;
}
