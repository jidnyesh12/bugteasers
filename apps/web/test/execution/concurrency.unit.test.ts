import { describe, expect, it } from "vitest";
import { createConcurrencyLimiter } from "@/lib/execution/concurrency";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createConcurrencyLimiter", () => {
  it("never runs more tasks than the limit at once", async () => {
    const limit = createConcurrencyLimiter(2);
    let active = 0;
    let peak = 0;

    const task = async (value: number) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return value;
    };

    const results = await Promise.all(
      [1, 2, 3, 4, 5, 6].map((value) => limit(() => task(value))),
    );

    expect(results).toEqual([1, 2, 3, 4, 5, 6]);
    expect(peak).toBe(2);
  });

  it("starts queued tasks in submission order", async () => {
    const limit = createConcurrencyLimiter(1);
    const started: number[] = [];
    const gates = [deferred<void>(), deferred<void>(), deferred<void>()];

    const runs = gates.map((gate, index) =>
      limit(async () => {
        started.push(index);
        await gate.promise;
      }),
    );

    gates[0].resolve();
    gates[1].resolve();
    gates[2].resolve();
    await Promise.all(runs);

    expect(started).toEqual([0, 1, 2]);
  });

  it("keeps going after a task fails", async () => {
    const limit = createConcurrencyLimiter(1);

    const failing = limit(() => Promise.reject(new Error("boom")));
    const following = limit(() => Promise.resolve("ok"));

    await expect(failing).rejects.toThrow("boom");
    await expect(following).resolves.toBe("ok");
  });

  it("rejects a limit below one", () => {
    expect(() => createConcurrencyLimiter(0)).toThrow();
    expect(() => createConcurrencyLimiter(1.5)).toThrow();
  });
});
