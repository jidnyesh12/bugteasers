import { afterEach, describe, expect, it, vi } from "vitest";

describe("Environment Configuration Validation", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("should throw when PISTON_API_URL is invalid", async () => {
    process.env.PISTON_API_URL = "not-a-url";

    await expect(import("@/lib/env")).rejects.toThrow(
      "Invalid environment variable PISTON_API_URL: must be a valid URL",
    );
  });
});
