import { describe, expect, it } from 'vitest';
import {
  mapRawProblemSubmission,
  normalizeSubmissionStatus,
  parseNullableNumber,
  summarizeTestResults,
} from '@/lib/submissions/mapper';

describe('submission mapper utilities', () => {
  it('parses nullable numeric values from number and string inputs', () => {
    expect(parseNullableNumber(42)).toBe(42);
    expect(parseNullableNumber('42.5')).toBe(42.5);
    expect(parseNullableNumber('')).toBeNull();
    expect(parseNullableNumber('not-a-number')).toBeNull();
    expect(parseNullableNumber(null)).toBeNull();
  });

  it('applies numeric bounds when provided', () => {
    expect(parseNullableNumber(50, { min: 0, max: 100 })).toBe(50);
    expect(parseNullableNumber(-1, { min: 0 })).toBeNull();
    expect(parseNullableNumber(101, { max: 100 })).toBeNull();
  });

  it('normalizes unknown statuses to error', () => {
    expect(normalizeSubmissionStatus('passed')).toBe('passed');
    expect(normalizeSubmissionStatus('partial')).toBe('partial');
    expect(normalizeSubmissionStatus('accepted')).toBe('error');
  });

  it('summarizes test results defensively', () => {
    expect(summarizeTestResults(null)).toEqual({ passedCount: 0, totalTestCount: 0 });
    expect(
      summarizeTestResults([{ passed: true }, { passed: false }, { foo: 'bar' }, null])
    ).toEqual({ passedCount: 1, totalTestCount: 4 });
  });

  it('maps a raw submission row into API response shape', () => {
    const mapped = mapRawProblemSubmission({
      id: 'submission-1',
      language: 'python',
      status: 'passed',
      score: '87.5',
      earned_points: '7',
      total_points: 8,
      submitted_at: '2026-03-29T12:00:00.000Z',
      code: 'print(1)',
      test_results: [{ passed: true }, { passed: false }],
    });

    expect(mapped).toEqual({
      id: 'submission-1',
      language: 'python',
      status: 'passed',
      score: 87.5,
      earnedPoints: 7,
      totalPoints: 8,
      passedCount: 1,
      totalTestCount: 2,
      submittedAt: '2026-03-29T12:00:00.000Z',
      code: 'print(1)',
    });
  });

  it('maps invalid numeric values to null via bounds checks', () => {
    const mapped = mapRawProblemSubmission({
      id: 'submission-2',
      language: 'python',
      status: 'failed',
      score: 101,
      earned_points: -5,
      total_points: -1,
      submitted_at: '2026-03-29T12:00:00.000Z',
      code: 'print(1)',
      test_results: [],
    });

    expect(mapped.score).toBeNull();
    expect(mapped.earnedPoints).toBeNull();
    expect(mapped.totalPoints).toBeNull();
  });

  it('normalizes known submission language aliases', () => {
    const mapped = mapRawProblemSubmission({
      id: 'submission-3',
      language: 'c++',
      status: 'passed',
      score: 100,
      earned_points: 10,
      total_points: 10,
      submitted_at: '2026-03-29T12:00:00.000Z',
      code: 'int main() { return 0; }',
      test_results: [],
    });

    expect(mapped.language).toBe('cpp');
  });
});
