// Code Execution API Client
// Handles HTTP communication with Piston API, manages request/response formatting,
// and implements retry logic with exponential backoff.

import type {
  PistonClient,
  PistonClientConfig,
  ExecutionRequest,
  ExecutionResponse,
  Runtime,
  SupportedLanguage,
  PistonLanguage,
} from "./types";
import {
  UnsupportedLanguageError,
  InvalidResponseError,
  ExecutionTimeoutError,
} from "./types";
import {
  PISTON_API_URL,
  DEFAULT_EXECUTION_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  RETRY_BASE_DELAY,
} from "./constants";

/**
 * Thrown when the Piston API returns an infrastructure-level failure
 * (non-200 status, HTML error page, unparseable response body).
 *
 * This is NOT a code error — the C++ solution was never executed.
 * The Repair Loop must NOT attempt to fix the user's code for this.
 */
export class PistonInfrastructureError extends Error {
  readonly statusCode: number;
  readonly rawBody: string;

  constructor(statusCode: number, rawBody: string) {
    const preview = rawBody.substring(0, 200);
    super(
      `Piston API infrastructure error (HTTP ${statusCode}): ${preview}${
        rawBody.length > 200 ? "..." : ""
      }`,
    );
    this.name = "PistonInfrastructureError";
    this.statusCode = statusCode;
    this.rawBody = rawBody;
  }
}

// Default configuration for Piston client
const DEFAULT_CONFIG: PistonClientConfig = {
  apiUrl: PISTON_API_URL,
  timeout: DEFAULT_EXECUTION_TIMEOUT,
  maxRetries: DEFAULT_MAX_RETRIES,
};

// Piston API client implementation using native fetch
export class PistonClientImpl implements PistonClient {
  private readonly config: PistonClientConfig;

  constructor(config?: Partial<PistonClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Execute code via Piston API with retry logic
  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const url = `${this.config.apiUrl}/api/v2/execute`;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout,
        );

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // ── SAFETY: Read raw text BEFORE parsing ──────────────
        // Piston can return HTML error pages (503/502) when the
        // deployment is restarting. Calling response.json()
        // directly would throw a confusing SyntaxError that gets
        // misclassified as a model_answer_error.
        const rawText = await response.text();

        // Gate 1: HTTP status must be 2xx
        if (!response.ok) {
          console.error(
            `[PISTON] Infrastructure failure — HTTP ${response.status} ${response.statusText}`,
            rawText.substring(0, 500),
          );
          throw new PistonInfrastructureError(response.status, rawText);
        }

        // Gate 2: Body must be parseable JSON
        let data: unknown;
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error(
            "[PISTON] Response body is not valid JSON.",
            "Content-Type:",
            response.headers.get("content-type"),
            "Body preview:",
            rawText.substring(0, 300),
          );
          throw new PistonInfrastructureError(response.status, rawText);
        }

        const normalizedData = this.withRequestMetadata(data, request);

        // Validate and return response (even for compilation errors)
        return this.validateResponse(normalizedData);
      } catch (error) {
        const isLastAttempt = attempt === this.config.maxRetries;

        // Handle timeout
        if (error instanceof Error && error.name === "AbortError") {
          if (isLastAttempt) {
            throw new ExecutionTimeoutError(this.config.timeout);
          }

          // Retry with exponential backoff
          const delay = Math.pow(2, attempt) * RETRY_BASE_DELAY;
          console.warn(
            `Retrying Piston API request after timeout (attempt ${attempt + 1}/${this.config.maxRetries})`,
            { url, delay },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Infrastructure errors from Piston (50x, HTML responses) — retry with backoff
        if (error instanceof PistonInfrastructureError) {
          if (isLastAttempt) {
            throw error; // Bubble up as-is — the orchestrator must NOT treat this as a code error
          }

          const delay = Math.pow(2, attempt) * RETRY_BASE_DELAY;
          console.warn(
            `[PISTON] Retrying after infrastructure error HTTP ${error.statusCode} ` +
              `(attempt ${attempt + 1}/${this.config.maxRetries})`,
            { url, delay },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Handle network errors - retry
        if (error instanceof TypeError && error.message.includes("fetch")) {
          if (isLastAttempt) {
            throw new Error(`Network error: ${error.message}`, {
              cause: error,
            });
          }

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * RETRY_BASE_DELAY;
          console.warn(
            `Retrying Piston API request (attempt ${attempt + 1}/${this.config.maxRetries})`,
            { url, error: error.message, delay },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Other errors - don't retry
        throw error;
      }
    }

    throw new Error("Max retries exceeded");
  }

  // Fetch available language runtimes from Piston
  async getRuntimes(): Promise<Runtime[]> {
    const url = `${this.config.apiUrl}/api/v2/runtimes`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new InvalidResponseError("Runtimes response is not an array");
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ExecutionTimeoutError(this.config.timeout);
      }

      throw new Error(
        `Failed to fetch runtimes: ${error instanceof Error ? error.message : "Unknown error"}`,
        { cause: error },
      );
    }
  }

  // Map system language identifier to Piston language identifier
  mapLanguage(language: SupportedLanguage): PistonLanguage {
    const languageMap: Record<SupportedLanguage, PistonLanguage> = {
      python: "python",
      java: "java",
      cpp: "c++",
      c: "c",
    };

    const pistonLanguage = languageMap[language];

    if (!pistonLanguage) {
      throw new UnsupportedLanguageError(language);
    }

    return pistonLanguage;
  }

  // Validate Piston API response structure
  validateResponse(response: unknown): ExecutionResponse {
    if (!response || typeof response !== "object") {
      throw new InvalidResponseError("Response is not an object", response);
    }

    const resp = response as Record<string, unknown>;

    // Validate required top-level fields
    if (typeof resp.language !== "string" || resp.language.length === 0) {
      throw new InvalidResponseError(
        "Response missing required field: language",
        response,
      );
    }

    if (typeof resp.version !== "string" || resp.version.length === 0) {
      throw new InvalidResponseError(
        "Response missing required field: version",
        response,
      );
    }

    if (!resp.run || typeof resp.run !== "object") {
      throw new InvalidResponseError(
        "Response missing required field: run",
        response,
      );
    }

    // Validate run object
    this.validateExecutionResult(resp.run as Record<string, unknown>, "run");

    // Validate compile object if present
    if (resp.compile !== undefined) {
      if (typeof resp.compile !== "object" || resp.compile === null) {
        throw new InvalidResponseError(
          "Response compile field must be an object",
          response,
        );
      }
      this.validateExecutionResult(
        resp.compile as Record<string, unknown>,
        "compile",
      );
    }

    // Type assertion is safe here because we've validated all required fields
    return resp as unknown as ExecutionResponse;
  }

  // Normalize response metadata and ensure run object exists with proper structure
  private withRequestMetadata(
    response: unknown,
    request: Pick<ExecutionRequest, "language" | "version">,
  ): unknown {
    if (!response || typeof response !== "object") {
      return response;
    }

    const normalized = { ...(response as Record<string, unknown>) };

    // Normalize language and version
    if (
      typeof normalized.language !== "string" ||
      normalized.language.length === 0
    ) {
      normalized.language = request.language;
    }

    if (
      typeof normalized.version !== "string" ||
      normalized.version.length === 0
    ) {
      normalized.version = request.version;
    }

    // Ensure run object exists with proper structure
    if (!normalized.run || typeof normalized.run !== "object") {
      // Create run object from available data
      normalized.run = {
        stdout: normalized.stdout || "",
        stderr: normalized.stderr || "",
        code: typeof normalized.code === "number" ? normalized.code : 1,
        signal: normalized.signal || null,
        output: normalized.output || normalized.stdout || "",
      };
    }

    return normalized;
  }

  // Validate execution result object structure
  private validateExecutionResult(
    result: Record<string, unknown>,
    fieldName: string,
  ): void {
    const requiredFields = ["stdout", "stderr", "code", "output"];

    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new InvalidResponseError(
          `Response ${fieldName} object missing required field: ${field}`,
        );
      }
    }

    if (typeof result.stdout !== "string") {
      throw new InvalidResponseError(
        `Response ${fieldName}.stdout must be a string`,
      );
    }

    if (typeof result.stderr !== "string") {
      throw new InvalidResponseError(
        `Response ${fieldName}.stderr must be a string`,
      );
    }

    if (typeof result.code !== "number" && result.code !== null) {
      throw new InvalidResponseError(
        `Response ${fieldName}.code must be a number or null`,
      );
    }

    // Normalize null code to 1 (non-zero exit) so callers don't need to handle null
    if (result.code === null) {
      result.code = 1;
    }

    if (result.signal !== null && typeof result.signal !== "string") {
      throw new InvalidResponseError(
        `Response ${fieldName}.signal must be a string or null`,
      );
    }

    if (typeof result.output !== "string") {
      throw new InvalidResponseError(
        `Response ${fieldName}.output must be a string`,
      );
    }
  }
}

// Create a Piston client instance with default configuration
export function createPistonClient(
  config?: Partial<PistonClientConfig>,
): PistonClient {
  return new PistonClientImpl(config);
}
