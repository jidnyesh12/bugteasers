// Test environment setup
// Sets required environment variables for tests

import { beforeEach } from 'vitest';
import { resetExecutionRateLimiterForTests } from '@/lib/execution/rate-limiter';

// Set required environment variables for tests
process.env.PISTON_API_URL = 'http://test.example.com';
process.env.PISTON_TIMEOUT_MS = '30000';
process.env.PISTON_MAX_RETRIES = '3';

beforeEach(() => {
	resetExecutionRateLimiterForTests();
});
