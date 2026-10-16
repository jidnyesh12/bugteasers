import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PistonClientImpl,
  PistonInfrastructureError,
} from "@/lib/execution/client";
import type { ExecutionRequest } from "@/lib/execution/types";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const request: ExecutionRequest = {
  language: "python",
  version: "*",
  files: [{ content: "print(1)" }],
  stdin: "",
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify(body),
  };
}

const okBody = {
  language: "python",
  version: "3.12.0",
  run: { stdout: "1\n", stderr: "", code: 0, signal: null, output: "1\n" },
};

describe("PistonClientImpl resilience", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(global, "setTimeout").mockImplementation(((
      handler: TimerHandler,
      timeout?: number,
    ) => {
      if (typeof timeout === "number" && timeout >= 1000 && typeof handler === "function") {
        handler();
      }
      return 0 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the API key as a bearer token when configured", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, okBody));
    const client = new PistonClientImpl({
      apiUrl: "http://piston.test",
      apiKey: "secret-key",
      timeout: 1000,
      maxRetries: 0,
    });

    await client.execute(request);

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret-key",
    );
  });

  it("sends no authorization header without an API key", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, okBody));
    const client = new PistonClientImpl({
      apiUrl: "http://piston.test",
      apiKey: "",
      timeout: 1000,
      maxRetries: 0,
    });

    await client.execute(request);

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.headers as Record<string, string>).not.toHaveProperty(
      "Authorization",
    );
  });

  it("does not retry a request Piston rejects as invalid", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(400, {
        message: "run_timeout cannot exceed the configured limit of 3000",
      }),
    );
    const client = new PistonClientImpl({
      apiUrl: "http://piston.test",
      timeout: 1000,
      maxRetries: 3,
    });

    await expect(client.execute(request)).rejects.toBeInstanceOf(
      PistonInfrastructureError,
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries a temporarily unavailable sandbox", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(503, { message: "unavailable" }))
      .mockResolvedValueOnce(jsonResponse(200, okBody));
    const client = new PistonClientImpl({
      apiUrl: "http://piston.test",
      timeout: 1000,
      maxRetries: 3,
    });

    const response = await client.execute(request);

    expect(response.run.stdout).toBe("1\n");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("reports an unreachable sandbox as an infrastructure error", async () => {
    mockFetch.mockRejectedValue(new TypeError("fetch failed"));
    const client = new PistonClientImpl({
      apiUrl: "http://piston.test",
      timeout: 1000,
      maxRetries: 2,
    });

    await expect(client.execute(request)).rejects.toBeInstanceOf(
      PistonInfrastructureError,
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
