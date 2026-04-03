import { createHash } from 'node:crypto';
import { buildVariableEvaluationOrder } from './dependency';
import { TemplateDslError } from './errors';
import { renderLinesInstruction, renderOutputValue } from './output-render';
import { DeterministicRandom } from './random';
import {
  DEFAULT_MAX_OUTPUT_BYTES,
  type MaterializeTemplateOptions,
  type MaterializedTemplateInput,
  type TemplateGeneratedValue,
  type TestCaseTemplateVariable,
  type TestCaseInputTemplate,
} from './types';
import { validateTestCaseInputTemplate } from './validation';
import { generateVariableValue } from './variable-generation';

export function materializeTestCaseInputTemplate(
  template: TestCaseInputTemplate,
  options: MaterializeTemplateOptions
): MaterializedTemplateInput {
  validateTestCaseInputTemplate(template);

  if (typeof options.seedMaterial !== 'string' || options.seedMaterial.trim().length === 0) {
    throw new TemplateDslError('seedMaterial must be a non-empty string');
  }

  const resolvedSeed = createHash('sha256')
    .update(`${options.seedMaterial}::${template.seed ?? ''}`)
    .digest('hex');

  const random = new DeterministicRandom(resolvedSeed);
  const context: Record<string, TemplateGeneratedValue> = {};
  const evaluationOrder = buildVariableEvaluationOrder(template);

  for (const name of evaluationOrder) {
    const rawSpec = template.variables[name];
    const spec = rawSpec as TestCaseTemplateVariable;
    context[name] = generateVariableValue(spec, context, random);
  }

  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  let accumulatedInput = '';
  let accumulatedBytes = 0;

  const appendLine = (line: string): void => {
    const normalizedLine = String(line);
    const separatorBytes = accumulatedInput.length === 0 ? 0 : 1;
    accumulatedBytes += separatorBytes + Buffer.byteLength(normalizedLine, 'utf8');
    if (accumulatedBytes > maxOutputBytes) {
      throw new TemplateDslError(
        `Materialized template input exceeded size limit: ${accumulatedBytes} bytes (limit ${maxOutputBytes})`
      );
    }

    accumulatedInput =
      accumulatedInput.length === 0
        ? normalizedLine
        : `${accumulatedInput}\n${normalizedLine}`;
  };

  for (const instruction of template.output) {
    if (instruction.type === 'line') {
      const separator = instruction.separator ?? ' ';
      const rendered = instruction.values.map((value) => renderOutputValue(value, context));
      appendLine(rendered.join(separator));
      continue;
    }

    if (instruction.type === 'lines') {
      for (const line of renderLinesInstruction(instruction, context)) {
        appendLine(line);
      }
      continue;
    }

    const normalized = instruction.value.replace(/\r\n/g, '\n');
    for (const line of normalized.split('\n')) {
      appendLine(line);
    }
  }

  return {
    inputData: accumulatedInput,
    resolvedSeed,
    variables: context,
  };
}
