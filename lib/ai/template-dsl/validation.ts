import { buildVariableEvaluationOrder } from './dependency';
import { TemplateDslError } from './errors';
import {
  assertValidConstValue,
  isScalar,
  isTemplateNumericRef,
} from './guards';
import {
  TEMPLATE_DSL_VERSION,
  type CharsetName,
  type SortDirection,
  type TestCaseInputTemplate,
  type TestCaseTemplateOutputInstruction,
  type TestCaseTemplateVariable,
} from './types';

const SUPPORTED_VARIABLE_TYPES: ReadonlySet<TestCaseTemplateVariable['type']> = new Set([
  'const',
  'int',
  'choice',
  'string',
  'int_array',
  'matrix',
  'permutation',
  'pairs',
  'graph',
]);

const SUPPORTED_SORT_DIRECTIONS: ReadonlySet<SortDirection> = new Set(['asc', 'desc']);
const SUPPORTED_CHARSETS: ReadonlySet<CharsetName> = new Set([
  'lower',
  'upper',
  'alpha',
  'alnum',
  'digits',
]);

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TemplateDslError(`${label} must be an object`);
  }

  return value as Record<string, unknown>;
}

function assertNumericRef(value: unknown, label: string): void {
  if (!isTemplateNumericRef(value)) {
    throw new TemplateDslError(`${label} must be an integer or { ref: string }`);
  }
}

function assertOptionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new TemplateDslError(`${label} must be a boolean when provided`);
  }
}

function assertVariableSpec(name: string, rawSpec: unknown): void {
  const specRecord = asRecord(rawSpec, `Variable "${name}"`);
  const variableType = specRecord.type;

  if (typeof variableType !== 'string' || !SUPPORTED_VARIABLE_TYPES.has(variableType as TestCaseTemplateVariable['type'])) {
    throw new TemplateDslError(`Unsupported template variable type: ${String(variableType)}`);
  }

  switch (variableType) {
    case 'const': {
      if (!Object.prototype.hasOwnProperty.call(specRecord, 'value')) {
        throw new TemplateDslError(`Variable "${name}" of type const must define value`);
      }
      assertValidConstValue(specRecord.value);
      return;
    }

    case 'int': {
      assertNumericRef(specRecord.min, `variables.${name}.min`);
      assertNumericRef(specRecord.max, `variables.${name}.max`);
      return;
    }

    case 'choice': {
      if (!Array.isArray(specRecord.values) || specRecord.values.length === 0 || !specRecord.values.every(isScalar)) {
        throw new TemplateDslError(`variables.${name}.values must be a non-empty array of strings or numbers`);
      }

      if (specRecord.weights !== undefined) {
        if (!Array.isArray(specRecord.weights) || specRecord.weights.length !== specRecord.values.length) {
          throw new TemplateDslError(`variables.${name}.weights length must match values length`);
        }

        for (let index = 0; index < specRecord.weights.length; index += 1) {
          const weight = specRecord.weights[index];
          if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
            throw new TemplateDslError(`variables.${name}.weights[${index}] must be a positive finite number`);
          }
        }
      }
      return;
    }

    case 'string': {
      assertNumericRef(specRecord.length, `variables.${name}.length`);

      if (specRecord.alphabet !== undefined) {
        if (typeof specRecord.alphabet !== 'string' || specRecord.alphabet.length === 0) {
          throw new TemplateDslError(`variables.${name}.alphabet must be a non-empty string when provided`);
        }
      }

      if (specRecord.charset !== undefined) {
        if (typeof specRecord.charset !== 'string' || !SUPPORTED_CHARSETS.has(specRecord.charset as CharsetName)) {
          throw new TemplateDslError(
            `variables.${name}.charset must be one of: ${[...SUPPORTED_CHARSETS].join(', ')}`
          );
        }
      }
      return;
    }

    case 'int_array': {
      assertNumericRef(specRecord.length, `variables.${name}.length`);
      assertNumericRef(specRecord.min, `variables.${name}.min`);
      assertNumericRef(specRecord.max, `variables.${name}.max`);
      assertOptionalBoolean(specRecord.unique, `variables.${name}.unique`);

      if (specRecord.sorted !== undefined) {
        if (typeof specRecord.sorted !== 'string' || !SUPPORTED_SORT_DIRECTIONS.has(specRecord.sorted as SortDirection)) {
          throw new TemplateDslError(
            `variables.${name}.sorted must be one of: ${[...SUPPORTED_SORT_DIRECTIONS].join(', ')}`
          );
        }
      }
      return;
    }

    case 'matrix': {
      assertNumericRef(specRecord.rows, `variables.${name}.rows`);
      assertNumericRef(specRecord.cols, `variables.${name}.cols`);
      assertNumericRef(specRecord.min, `variables.${name}.min`);
      assertNumericRef(specRecord.max, `variables.${name}.max`);
      return;
    }

    case 'permutation': {
      assertNumericRef(specRecord.n, `variables.${name}.n`);

      if (specRecord.start !== undefined && (!Number.isInteger(specRecord.start) || !Number.isFinite(specRecord.start as number))) {
        throw new TemplateDslError(`variables.${name}.start must be an integer when provided`);
      }
      return;
    }

    case 'pairs': {
      assertNumericRef(specRecord.count, `variables.${name}.count`);
      assertOptionalBoolean(specRecord.unique, `variables.${name}.unique`);

      const first = asRecord(specRecord.first, `variables.${name}.first`);
      const second = asRecord(specRecord.second, `variables.${name}.second`);

      assertNumericRef(first.min, `variables.${name}.first.min`);
      assertNumericRef(first.max, `variables.${name}.first.max`);
      assertNumericRef(second.min, `variables.${name}.second.min`);
      assertNumericRef(second.max, `variables.${name}.second.max`);
      return;
    }

    case 'graph': {
      assertNumericRef(specRecord.nodes, `variables.${name}.nodes`);
      assertNumericRef(specRecord.edges, `variables.${name}.edges`);

      assertOptionalBoolean(specRecord.directed, `variables.${name}.directed`);
      assertOptionalBoolean(specRecord.connected, `variables.${name}.connected`);
      assertOptionalBoolean(specRecord.allowSelfLoops, `variables.${name}.allowSelfLoops`);
      assertOptionalBoolean(specRecord.allowMultiEdges, `variables.${name}.allowMultiEdges`);
      assertOptionalBoolean(specRecord.oneIndexed, `variables.${name}.oneIndexed`);
      assertOptionalBoolean(specRecord.weighted, `variables.${name}.weighted`);

      if (specRecord.minWeight !== undefined) {
        assertNumericRef(specRecord.minWeight, `variables.${name}.minWeight`);
      }

      if (specRecord.maxWeight !== undefined) {
        assertNumericRef(specRecord.maxWeight, `variables.${name}.maxWeight`);
      }
      return;
    }

    default: {
      throw new TemplateDslError(`Unsupported template variable type: ${String(variableType)}`);
    }
  }
}

function validateOutputReferences(
  output: readonly TestCaseTemplateOutputInstruction[],
  availableVariables: ReadonlySet<string>
): void {
  for (let index = 0; index < output.length; index += 1) {
    const instruction = output[index];
    if (instruction.type === 'lines') {
      if (!availableVariables.has(instruction.from)) {
        throw new TemplateDslError(
          `output[${index}].from references unknown variable "${instruction.from}"`
        );
      }
      continue;
    }

    if (instruction.type === 'line') {
      for (let valueIndex = 0; valueIndex < instruction.values.length; valueIndex += 1) {
        const value = instruction.values[valueIndex];
        if ('ref' in value && !availableVariables.has(value.ref)) {
          throw new TemplateDslError(
            `output[${index}].values[${valueIndex}] references unknown variable "${value.ref}"`
          );
        }
      }
    }
  }
}

function validateOutputInstructionShape(instruction: unknown, index: number): void {
  const record = asRecord(instruction, `output[${index}]`);

  if (record.type !== 'line' && record.type !== 'lines' && record.type !== 'raw') {
    throw new TemplateDslError(`output[${index}].type must be one of: line, lines, raw`);
  }

  if (record.type === 'line') {
    if (!Array.isArray(record.values) || record.values.length === 0) {
      throw new TemplateDslError(`output[${index}].values must be a non-empty array`);
    }

    for (let valueIndex = 0; valueIndex < record.values.length; valueIndex += 1) {
      const value = record.values[valueIndex];
      
      // Check if value is an object
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        console.error(`[DSL-VALIDATION] output[${index}].values[${valueIndex}] is not an object! Type:`, typeof value, 'Value:', value);
        throw new TemplateDslError(`output[${index}].values[${valueIndex}] must be an object`);
      }
      
      const valueRecord = value as Record<string, unknown>;
      const hasRef = Object.prototype.hasOwnProperty.call(valueRecord, 'ref');
      const hasLiteral = Object.prototype.hasOwnProperty.call(valueRecord, 'literal');

      if (hasRef === hasLiteral) {
        throw new TemplateDslError(
          `output[${index}].values[${valueIndex}] must include exactly one of "ref" or "literal"`
        );
      }

      if (hasRef) {
        if (typeof valueRecord.ref !== 'string' || (valueRecord.ref as string).trim().length === 0) {
          throw new TemplateDslError(`output[${index}].values[${valueIndex}].ref must be a non-empty string`);
        }

        if (valueRecord.join !== undefined && typeof valueRecord.join !== 'string') {
          throw new TemplateDslError(`output[${index}].values[${valueIndex}].join must be a string when provided`);
        }
      }

      if (hasLiteral && !isScalar(valueRecord.literal)) {
        throw new TemplateDslError(`output[${index}].values[${valueIndex}].literal must be a string or number`);
      }
    }

    if (record.separator !== undefined && typeof record.separator !== 'string') {
      throw new TemplateDslError(`output[${index}].separator must be a string when provided`);
    }

    return;
  }

  if (record.type === 'lines') {
    if (typeof record.from !== 'string' || record.from.trim().length === 0) {
      throw new TemplateDslError(`output[${index}].from must be a non-empty string`);
    }

    if (record.separator !== undefined && typeof record.separator !== 'string') {
      throw new TemplateDslError(`output[${index}].separator must be a string when provided`);
    }

    return;
  }

  if (typeof record.value !== 'string') {
    throw new TemplateDslError(`output[${index}].value must be a string for raw instructions`);
  }
}

export function validateTestCaseInputTemplate(template: unknown): asserts template is TestCaseInputTemplate {
  if (!template || typeof template !== 'object' || Array.isArray(template)) {
    throw new TemplateDslError('input_template must be a JSON object');
  }

  const candidate = template as Record<string, unknown>;

  if (
    candidate.version !== undefined &&
    (!Number.isInteger(candidate.version) || candidate.version !== TEMPLATE_DSL_VERSION)
  ) {
    throw new TemplateDslError(
      `input_template.version must be ${TEMPLATE_DSL_VERSION} when provided`
    );
  }

  if (candidate.seed !== undefined && typeof candidate.seed !== 'string') {
    throw new TemplateDslError('input_template.seed must be a string when provided');
  }

  const variables = candidate.variables;
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
    throw new TemplateDslError('input_template.variables must be an object');
  }

  if (Object.keys(variables).length === 0) {
    throw new TemplateDslError('input_template.variables must define at least one variable');
  }

  for (const [name, rawSpec] of Object.entries(variables)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new TemplateDslError(`Invalid variable name "${name}"`);
    }

    assertVariableSpec(name, rawSpec);
  }

  const output = candidate.output;
  if (!Array.isArray(output) || output.length === 0) {
    throw new TemplateDslError('input_template.output must be a non-empty array');
  }

  for (let index = 0; index < output.length; index += 1) {
    validateOutputInstructionShape(output[index], index);
  }

  const typedTemplate = candidate as unknown as TestCaseInputTemplate;
  buildVariableEvaluationOrder(typedTemplate);
  validateOutputReferences(
    typedTemplate.output,
    new Set(Object.keys(typedTemplate.variables))
  );
}
