// Code execution API configuration constants

import {
  PISTON_API_URL,
  PISTON_MAX_RETRIES,
  PISTON_TIMEOUT_MS,
} from "@/lib/env";

export { PISTON_API_URL };
export const DEFAULT_EXECUTION_TIMEOUT = PISTON_TIMEOUT_MS;
export const DEFAULT_MAX_RETRIES = PISTON_MAX_RETRIES;
export const RETRY_BASE_DELAY = 1000;
