// Test environment setup
// Sets required environment variables for tests

import { beforeEach } from "vitest";
import { resetExecutionRateLimiterForTests } from "@/lib/execution/rate-limiter";

// Set required environment variables for tests
process.env.PISTON_API_URL = "http://test.example.com";

beforeEach(() => {
  resetExecutionRateLimiterForTests();
});
