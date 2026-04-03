import { describe, expect, it } from 'vitest';
import {
  hasUnresolvedPlaceholder,
  materializeTestCaseInputTemplate,
  validateTestCaseInputTemplate,
} from '@/lib/ai/template-dsl';

describe('test case template DSL', () => {
  it('materializes deterministically for the same seed material', () => {
    const template = {
      version: 1,
      variables: {
        n: { type: 'const', value: 20 },
        arr: { type: 'int_array', length: { ref: 'n' }, min: 1, max: 1000 },
      },
      output: [
        { type: 'line', values: [{ ref: 'n' }] },
        { type: 'line', values: [{ ref: 'arr' }] },
      ],
    } as const;

    const first = materializeTestCaseInputTemplate(template, {
      seedMaterial: 'problem-1:case-1',
    });
    const second = materializeTestCaseInputTemplate(template, {
      seedMaterial: 'problem-1:case-1',
    });

    expect(first.inputData).toBe(second.inputData);
    expect(first.resolvedSeed).toBe(second.resolvedSeed);
  });

  it('renders graph edges as multiline output', () => {
    const template = {
      version: 1,
      variables: {
        n: { type: 'const', value: 6 },
        m: { type: 'const', value: 5 },
        edges: {
          type: 'graph',
          nodes: { ref: 'n' },
          edges: { ref: 'm' },
          connected: true,
          directed: false,
          weighted: false,
        },
      },
      output: [
        {
          type: 'line',
          values: [{ ref: 'n' }, { ref: 'm' }],
        },
        {
          type: 'lines',
          from: 'edges',
        },
      ],
    } as const;

    const result = materializeTestCaseInputTemplate(template, {
      seedMaterial: 'graph-case',
    });

    const lines = result.inputData.split('\n');
    expect(lines[0]).toBe('6 5');
    expect(lines).toHaveLength(6);
  });

  it('detects unresolved placeholder markers', () => {
    expect(hasUnresolvedPlaceholder('__AUTO_EXPECTED_OUTPUT__')).toBe(true);
    expect(hasUnresolvedPlaceholder('[PLACEHOLDER:expected]')).toBe(true);
    expect(hasUnresolvedPlaceholder('42')).toBe(false);
  });

  it('rejects invalid template version', () => {
    expect(() => {
      validateTestCaseInputTemplate({
        version: 99,
        variables: {
          n: { type: 'const', value: 1 },
        },
        output: [
          { type: 'line', values: [{ ref: 'n' }] },
        ],
      });
    }).toThrow(/version/i);
  });

  it('rejects circular variable dependencies', () => {
    expect(() => {
      validateTestCaseInputTemplate({
        version: 1,
        variables: {
          a: { type: 'int', min: { ref: 'b' }, max: 10 },
          b: { type: 'int', min: 1, max: { ref: 'a' } },
        },
        output: [{ type: 'line', values: [{ ref: 'a' }] }],
      });
    }).toThrow(/circular/i);
  });

  it('materializes correctly even when variable declarations are out of order', () => {
    const template = {
      version: 1,
      variables: {
        arr: { type: 'int_array', length: { ref: 'n' }, min: 1, max: 1 },
        n: { type: 'const', value: 4 },
      },
      output: [
        { type: 'line', values: [{ ref: 'n' }] },
        { type: 'line', values: [{ ref: 'arr' }] },
      ],
    } as const;

    const result = materializeTestCaseInputTemplate(template, {
      seedMaterial: 'out-of-order',
    });

    expect(result.inputData).toBe('4\n1 1 1 1');
  });

  it('rejects output references to unknown variables', () => {
    expect(() => {
      validateTestCaseInputTemplate({
        version: 1,
        variables: {
          n: { type: 'const', value: 3 },
        },
        output: [{ type: 'line', values: [{ ref: 'missingVar' }] }],
      });
    }).toThrow(/unknown variable/i);
  });

  it('rejects int variables missing required numeric bounds', () => {
    expect(() => {
      validateTestCaseInputTemplate({
        version: 1,
        variables: {
          n: { type: 'int', min: 1 },
        },
        output: [{ type: 'line', values: [{ ref: 'n' }] }],
      });
    }).toThrow(/max/i);
  });

  it('rejects output values containing both ref and literal', () => {
    expect(() => {
      validateTestCaseInputTemplate({
        version: 1,
        variables: {
          n: { type: 'const', value: 3 },
        },
        output: [
          {
            type: 'line',
            values: [{ ref: 'n', literal: 3 }],
          },
        ],
      });
    }).toThrow(/exactly one/i);
  });
});
