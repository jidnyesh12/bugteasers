import { describe, expect, it } from 'vitest';
import {
  normalizeProblemTestCasesForSave,
  SaveProblemValidationError,
} from '@/lib/problems/save-testcases';

describe('save-testcases helper', () => {
  it('normalizes plain resolved testcases and computes input hash', () => {
    const result = normalizeProblemTestCasesForSave({
      userId: 'instructor-1',
      problemTitle: 'Two Sum',
      testCases: [
        {
          input_data: '4\n2 7 11 15\n9\n',
          expected_output: '0 1\n',
          is_sample: true,
          points: 1,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].input_data).toBe('4\n2 7 11 15\n9\n');
    expect(result[0].expected_output).toBe('0 1\n');
    expect(result[0].input_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('materializes template tests and stores compact hidden cases', () => {
    const result = normalizeProblemTestCasesForSave({
      userId: 'instructor-1',
      problemTitle: 'Stress',
      testCases: [
        {
          input_data: '',
          input_template: {
            version: 1,
            variables: {
              n: { type: 'const', value: 3 },
              arr: { type: 'int_array', length: { ref: 'n' }, min: 1, max: 1 },
            },
            output: [
              { type: 'line', values: [{ ref: 'n' }] },
              { type: 'line', values: [{ ref: 'arr' }] },
            ],
          },
          expected_output: '3\n',
          is_sample: false,
          points: 2,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].generation_seed).toMatch(/^[a-f0-9]{64}$/);
    expect(result[0].input_data).toBe('');
    expect(result[0].input_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('throws validation error when expected output is unresolved', () => {
    expect(() =>
      normalizeProblemTestCasesForSave({
        userId: 'instructor-1',
        problemTitle: 'Invalid',
        testCases: [
          {
            input_data: '1\n',
            expected_output: '__AUTO_EXPECTED_OUTPUT__',
            is_sample: true,
            points: 1,
          },
        ],
      })
    ).toThrow(SaveProblemValidationError);
  });
});
