import { beforeEach, describe, expect, it, vi } from "vitest";
import { createExecutionLogger } from "@/lib/execution/logging";

describe("Execution Logger Unit Tests", () => {
  const mockInfo = vi
    .spyOn(console, "info")
    .mockImplementation(() => undefined);
  const mockWarn = vi
    .spyOn(console, "warn")
    .mockImplementation(() => undefined);
  const mockError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log execution request context at info level", () => {
    const logger = createExecutionLogger();

    logger.logExecutionStarted({
      mode: "run",
      userId: "user-1",
      problemId: "problem-1",
      language: "python",
    });

    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining("execution.started"),
      expect.objectContaining({
        mode: "run",
        userId: "user-1",
        problemId: "problem-1",
        language: "python",
      }),
    );
  });

  it("should sanitize sensitive fields from error context", () => {
    const logger = createExecutionLogger();

    logger.logExecutionFailed(
      {
        mode: "submit",
        userId: "user-1",
        problemId: "problem-1",
        language: "python",
        code: "print(secret)",
        pistonApiUrl: "https://secret-piston.internal",
        token: "private-token",
      },
      new Error("boom"),
    );

    expect(mockError).toHaveBeenCalledTimes(1);

    const loggedPayload = mockError.mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(loggedPayload).not.toHaveProperty("code");
    expect(loggedPayload).not.toHaveProperty("token");
    expect(loggedPayload).not.toHaveProperty("pistonApiUrl");
  });

  it("should log completion summary at info level", () => {
    const logger = createExecutionLogger();

    logger.logExecutionCompleted({
      mode: "submit",
      userId: "user-1",
      problemId: "problem-1",
      language: "python",
      durationMs: 428,
      status: "partial",
    });

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining("execution.completed"),
      expect.objectContaining({
        mode: "submit",
        durationMs: 428,
        status: "partial",
      }),
    );
  });

  it("should support warning logs for recoverable conditions", () => {
    const logger = createExecutionLogger();

    logger.logExecutionWarning("Network jitter detected", {
      mode: "run",
      problemId: "problem-1",
      userId: "user-1",
      language: "python",
    });

    expect(mockWarn).toHaveBeenCalledTimes(1);
  });
});
