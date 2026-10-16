export type ConcurrencyLimiter = <T>(task: () => Promise<T>) => Promise<T>;

export function createConcurrencyLimiter(limit: number): ConcurrencyLimiter {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Concurrency limit must be a positive integer, got ${limit}`);
  }

  let active = 0;
  const waiting: Array<() => void> = [];

  const startNext = () => {
    if (active >= limit) {
      return;
    }
    const start = waiting.shift();
    if (start) {
      active += 1;
      start();
    }
  };

  return <T>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      waiting.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            startNext();
          });
      });
      startNext();
    });
}
