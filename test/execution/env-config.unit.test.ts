import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Environment Configuration Validation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('should load default timeout and retries when optional values are not set', async () => {
    process.env.PISTON_API_URL = 'http://test.example.com';
    delete process.env.PISTON_TIMEOUT_MS;
    delete process.env.PISTON_MAX_RETRIES;

    const env = await import('@/lib/env');

    expect(env.PISTON_TIMEOUT_MS).toBe(30000);
    expect(env.PISTON_MAX_RETRIES).toBe(3);
  });

  it('should throw when PISTON_TIMEOUT_MS is invalid', async () => {
    process.env.PISTON_API_URL = 'http://test.example.com';
    process.env.PISTON_TIMEOUT_MS = '-1';
    process.env.PISTON_MAX_RETRIES = '3';

    await expect(import('@/lib/env')).rejects.toThrow(
      'Invalid environment variable PISTON_TIMEOUT_MS: must be a positive integer'
    );
  });

  it('should throw when PISTON_API_URL is invalid', async () => {
    process.env.PISTON_API_URL = 'not-a-url';
    process.env.PISTON_TIMEOUT_MS = '30000';
    process.env.PISTON_MAX_RETRIES = '3';

    await expect(import('@/lib/env')).rejects.toThrow(
      'Invalid environment variable PISTON_API_URL: must be a valid URL'
    );
  });
});
