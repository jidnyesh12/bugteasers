interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

interface SlidingWindowOptions {
  windowMs: number;
  maxRequests: number;
}

export class SlidingWindowRateLimiter {
  private readonly events = new Map<string, number[]>();

  check(
    key: string,
    options: SlidingWindowOptions,
    now: number = Date.now(),
  ): RateLimitDecision {
    const windowStart = now - options.windowMs;
    const previous = this.events.get(key) ?? [];
    const active = previous.filter((timestamp) => timestamp > windowStart);

    if (active.length >= options.maxRequests) {
      const earliest = active[0] ?? now;
      const retryAfterMs = Math.max(earliest + options.windowMs - now, 0);
      const retryAfterSeconds = Math.max(Math.ceil(retryAfterMs / 1000), 1);

      this.events.set(key, active);

      return {
        allowed: false,
        retryAfterSeconds,
        remaining: 0,
      };
    }

    active.push(now);
    this.events.set(key, active);

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(options.maxRequests - active.length, 0),
    };
  }

  reset(): void {
    this.events.clear();
  }
}

const limiter = new SlidingWindowRateLimiter();

export function checkExecutionRateLimit(params: {
  userId: string;
  mode: "run" | "submit";
  now?: number;
}): RateLimitDecision {
  const { userId, mode, now } = params;

  const options: SlidingWindowOptions =
    mode === "run"
      ? { maxRequests: 10, windowMs: 60_000 }
      : { maxRequests: 5, windowMs: 60_000 };

  return limiter.check(`execution:${mode}:${userId}`, options, now);
}

export function resetExecutionRateLimiterForTests(): void {
  limiter.reset();
}
