import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { PistonClientImpl } from '@/lib/execution/client';
import type { ExecutionRequest } from '@/lib/execution/types';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Execution Client Error Handling Properties', () => {
  const request: ExecutionRequest = {
    language: 'python',
    version: '*',
    files: [{ content: 'print(1)' }],
    stdin: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Property 14: network errors trigger retry logic', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async transientFailures => {
        mockFetch.mockReset();

        const client = new PistonClientImpl({
          apiUrl: 'http://test.example.com',
          timeout: 1,
          maxRetries: 3,
        });

        const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation(((handler: TimerHandler, timeout?: number) => {
          // Execute retry backoff timers immediately, but do not trigger AbortController timeout.
          if (typeof timeout === 'number' && timeout >= 1000 && typeof handler === 'function') {
            handler();
          }
          return 0 as unknown as NodeJS.Timeout;
        }) as unknown as typeof setTimeout);

        for (let i = 0; i < transientFailures; i++) {
          mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({
            language: 'python',
            version: '3.10.0',
            run: {
              stdout: 'ok',
              stderr: '',
              code: 0,
              signal: null,
              output: 'ok',
            },
          }),
        });

        const result = await client.execute(request);

        expect(result.run.code).toBe(0);
        expect(mockFetch).toHaveBeenCalledTimes(transientFailures + 1);

        setTimeoutSpy.mockRestore();
      }),
      { numRuns: 20 }
    );
  });

  it('Property 15: compilation errors do not trigger retries', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 200 }), async compileError => {
        mockFetch.mockReset();

        const client = new PistonClientImpl({
          apiUrl: 'http://test.example.com',
          timeout: 30000,
          maxRetries: 3,
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({
            language: 'python',
            version: '3.10.0',
            compile: {
              stdout: '',
              stderr: compileError,
              code: 1,
              signal: null,
              output: compileError,
            },
            run: {
              stdout: '',
              stderr: '',
              code: 0,
              signal: null,
              output: '',
            },
          }),
        });

        const result = await client.execute(request);

        expect(result.compile?.code).toBe(1);
        expect(result.compile?.stderr).toBe(compileError);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 20 }
    );
  });
});
