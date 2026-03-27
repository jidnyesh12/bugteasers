import { describe, expect, it } from 'vitest';
import {
  SlidingWindowRateLimiter,
  checkExecutionRateLimit,
  resetExecutionRateLimiterForTests,
} from '@/lib/execution/rate-limiter';

describe('Rate Limiter Unit Tests', () => {
  it('should enforce 10 requests per minute for run mode', () => {
    resetExecutionRateLimiterForTests();
    const userId = 'student-run';
    const now = 1_000_000;

    for (let i = 0; i < 10; i++) {
      const decision = checkExecutionRateLimit({ userId, mode: 'run', now: now + i });
      expect(decision.allowed).toBe(true);
    }

    const blocked = checkExecutionRateLimit({ userId, mode: 'run', now: now + 11 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should enforce 5 requests per minute for submit mode', () => {
    resetExecutionRateLimiterForTests();
    const userId = 'student-submit';
    const now = 2_000_000;

    for (let i = 0; i < 5; i++) {
      const decision = checkExecutionRateLimit({ userId, mode: 'submit', now: now + i });
      expect(decision.allowed).toBe(true);
    }

    const blocked = checkExecutionRateLimit({ userId, mode: 'submit', now: now + 6 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should release requests after sliding window elapses', () => {
    const limiter = new SlidingWindowRateLimiter();
    const key = 'k';

    const first = limiter.check(key, { maxRequests: 2, windowMs: 60_000 }, 10_000);
    const second = limiter.check(key, { maxRequests: 2, windowMs: 60_000 }, 10_500);
    const blocked = limiter.check(key, { maxRequests: 2, windowMs: 60_000 }, 11_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(blocked.allowed).toBe(false);

    const allowedAfterWindow = limiter.check(key, { maxRequests: 2, windowMs: 60_000 }, 70_100);
    expect(allowedAfterWindow.allowed).toBe(true);
  });
});
