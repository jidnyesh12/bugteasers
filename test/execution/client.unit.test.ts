// Unit tests for Piston API client

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PistonClientImpl } from '@/lib/execution/client';
import {
  UnsupportedLanguageError,
  InvalidResponseError,
  type ExecutionRequest,
  type ExecutionResponse,
} from '@/lib/execution/types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('PistonClient Unit Tests', () => {
  let client: PistonClientImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new PistonClientImpl({
      apiUrl: 'http://test.example.com',
      timeout: 30000,
      maxRetries: 3,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Language Mapping', () => {
    it('should map python to python', () => {
      expect(client.mapLanguage('python')).toBe('python');
    });

    it('should map java to java', () => {
      expect(client.mapLanguage('java')).toBe('java');
    });

    it('should map cpp to c++', () => {
      expect(client.mapLanguage('cpp')).toBe('c++');
    });

    it('should map c to c', () => {
      expect(client.mapLanguage('c')).toBe('c');
    });

    it('should throw UnsupportedLanguageError for ruby', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        client.mapLanguage('ruby');
      }).toThrow(UnsupportedLanguageError);
    });

    it('should throw UnsupportedLanguageError for go', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        client.mapLanguage('go');
      }).toThrow(UnsupportedLanguageError);
    });
  });

  describe('Response Validation', () => {
    it('should validate a complete valid response', () => {
      const validResponse: ExecutionResponse = {
        language: 'python',
        version: '3.10.0',
        run: {
          stdout: 'Hello, World!\n',
          stderr: '',
          code: 0,
          signal: null,
          output: 'Hello, World!\n',
        },
      };

      const validated = client.validateResponse(validResponse);
      expect(validated).toEqual(validResponse);
    });

    it('should validate response with compile object', () => {
      const validResponse: ExecutionResponse = {
        language: 'java',
        version: '17.0.0',
        compile: {
          stdout: '',
          stderr: '',
          code: 0,
          signal: null,
          output: '',
        },
        run: {
          stdout: 'Hello from Java\n',
          stderr: '',
          code: 0,
          signal: null,
          output: 'Hello from Java\n',
        },
      };

      const validated = client.validateResponse(validResponse);
      expect(validated).toEqual(validResponse);
      expect(validated.compile).toBeDefined();
    });

    it('should reject null response', () => {
      expect(() => {
        client.validateResponse(null);
      }).toThrow(InvalidResponseError);
    });

    it('should reject undefined response', () => {
      expect(() => {
        client.validateResponse(undefined);
      }).toThrow(InvalidResponseError);
    });

    it('should reject response without language', () => {
      expect(() => {
        client.validateResponse({
          version: '3.10.0',
          run: {
            stdout: '',
            stderr: '',
            code: 0,
            signal: null,
            output: '',
          },
        });
      }).toThrow(InvalidResponseError);
    });

    it('should reject response without version', () => {
      expect(() => {
        client.validateResponse({
          language: 'python',
          run: {
            stdout: '',
            stderr: '',
            code: 0,
            signal: null,
            output: '',
          },
        });
      }).toThrow(InvalidResponseError);
    });

    it('should reject response without run object', () => {
      expect(() => {
        client.validateResponse({
          language: 'python',
          version: '3.10.0',
        });
      }).toThrow(InvalidResponseError);
    });

    it('should reject response with empty language', () => {
      expect(() => {
        client.validateResponse({
          language: '',
          version: '3.10.0',
          run: {
            stdout: '',
            stderr: '',
            code: 0,
            signal: null,
            output: '',
          },
        });
      }).toThrow(InvalidResponseError);
    });

    it('should reject response with empty version', () => {
      expect(() => {
        client.validateResponse({
          language: 'python',
          version: '',
          run: {
            stdout: '',
            stderr: '',
            code: 0,
            signal: null,
            output: '',
          },
        });
      }).toThrow(InvalidResponseError);
    });

    it('should reject response with incomplete run object', () => {
      expect(() => {
        client.validateResponse({
          language: 'python',
          version: '3.10.0',
          run: {
            stdout: '',
            stderr: '',
            // missing code, signal, output
          },
        });
      }).toThrow(InvalidResponseError);
    });

    it('should reject response with invalid run.code type', () => {
      expect(() => {
        client.validateResponse({
          language: 'python',
          version: '3.10.0',
          run: {
            stdout: '',
            stderr: '',
            code: '0', // should be number
            signal: null,
            output: '',
          },
        });
      }).toThrow(InvalidResponseError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with non-zero exit code', () => {
      const response: ExecutionResponse = {
        language: 'python',
        version: '3.10.0',
        run: {
          stdout: '',
          stderr: 'SyntaxError: invalid syntax\n',
          code: 1,
          signal: null,
          output: 'SyntaxError: invalid syntax\n',
        },
      };

      const validated = client.validateResponse(response);
      expect(validated.run.code).toBe(1);
      expect(validated.run.stderr).toContain('SyntaxError');
    });

    it('should handle response with signal', () => {
      const response: ExecutionResponse = {
        language: 'python',
        version: '3.10.0',
        run: {
          stdout: '',
          stderr: '',
          code: 137,
          signal: 'SIGKILL',
          output: '',
        },
      };

      const validated = client.validateResponse(response);
      expect(validated.run.signal).toBe('SIGKILL');
    });

    it('should handle response with large output', () => {
      const largeOutput = 'x'.repeat(10000);
      const response: ExecutionResponse = {
        language: 'python',
        version: '3.10.0',
        run: {
          stdout: largeOutput,
          stderr: '',
          code: 0,
          signal: null,
          output: largeOutput,
        },
      };

      const validated = client.validateResponse(response);
      expect(validated.run.stdout.length).toBe(10000);
    });

    it('should handle compilation error response', () => {
      const response: ExecutionResponse = {
        language: 'java',
        version: '17.0.0',
        compile: {
          stdout: '',
          stderr: 'Main.java:1: error: semicolon expected\n',
          code: 1,
          signal: null,
          output: 'Main.java:1: error: semicolon expected\n',
        },
        run: {
          stdout: '',
          stderr: '',
          code: 0,
          signal: null,
          output: '',
        },
      };

      const validated = client.validateResponse(response);
      expect(validated.compile?.code).toBe(1);
      expect(validated.compile?.stderr).toContain('error');
    });
  });

  describe('Execute Response Normalization', () => {
    const baseRequest: ExecutionRequest = {
      language: 'python',
      version: '*',
      files: [{ content: 'print("ok")' }],
      stdin: '',
    };

    it('should backfill missing language/version from request metadata', async () => {
      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          run: {
            stdout: 'ok\n',
            stderr: '',
            code: 0,
            signal: null,
            output: 'ok\n',
          },
        }),
      });

      const result = await client.execute(baseRequest);

      expect(result.language).toBe('python');
      expect(result.version).toBe('*');
      expect(result.run.stdout).toBe('ok\n');
    });

    it('should preserve language/version returned by API response', async () => {
      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          language: 'python',
          version: '3.12.0',
          run: {
            stdout: 'ok\n',
            stderr: '',
            code: 0,
            signal: null,
            output: 'ok\n',
          },
        }),
      });

      const result = await client.execute(baseRequest);

      expect(result.language).toBe('python');
      expect(result.version).toBe('3.12.0');
    });

    it('should still reject responses with invalid run payloads', async () => {
      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          language: 'python',
          version: '3.10.0',
        }),
      });

      await expect(client.execute(baseRequest)).rejects.toThrow(InvalidResponseError);
    });
  });
});
