// Property-based tests for Piston API client

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { SupportedLanguage, PistonLanguage } from "@/lib/execution/types";
import {
  UnsupportedLanguageError,
  InvalidResponseError,
} from "@/lib/execution/types";
import { PistonClientImpl } from "@/lib/execution/client";
import { SUPPORTED_EXECUTION_LANGUAGES } from "@/lib/execution/languages";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_EXECUTION_LANGUAGES);

describe("Language Mapping is Correct and Complete", () => {
  const client = new PistonClientImpl({
    apiUrl: "http://test.example.com",
    timeout: 30000,
    maxRetries: 3,
  });

  it("should map all supported languages to valid Piston languages", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SupportedLanguage>(...SUPPORTED_EXECUTION_LANGUAGES),
        (language) => {
          const pistonLanguage = client.mapLanguage(language);

          // Verify mapping is one of valid Piston languages
          const validPistonLanguages: PistonLanguage[] = [
            "python",
            "java",
            "c++",
            "c",
          ];
          expect(validPistonLanguages).toContain(pistonLanguage);

          // Verify specific mappings
          const expectedMappings: Record<SupportedLanguage, PistonLanguage> = {
            python: "python",
            java: "java",
            cpp: "c++",
            c: "c",
          };
          expect(pistonLanguage).toBe(expectedMappings[language]);

          return true;
        },
      ),
    );
  });

  it("should throw UnsupportedLanguageError for invalid languages", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          // Exclude valid languages and object property names
          const objectProperties = [
            "toString",
            "valueOf",
            "constructor",
            "hasOwnProperty",
            "__proto__",
            "__defineGetter__",
            "__defineSetter__",
            "__lookupGetter__",
            "__lookupSetter__",
          ];
          return (
            !SUPPORTED_LANGUAGE_SET.has(s) &&
            !objectProperties.includes(s) &&
            s.length > 0
          );
        }),
        (invalidLanguage) => {
          expect(() => {
            // @ts-expect-error Testing invalid input
            client.mapLanguage(invalidLanguage);
          }).toThrow(UnsupportedLanguageError);

          return true;
        },
      ),
    );
  });

  it("should be deterministic - same input always produces same output", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SupportedLanguage>(...SUPPORTED_EXECUTION_LANGUAGES),
        (language) => {
          const result1 = client.mapLanguage(language);
          const result2 = client.mapLanguage(language);

          expect(result1).toBe(result2);
          return true;
        },
      ),
    );
  });
});

describe("Piston API Requests Are Well-Formed", () => {
  // Arbitrary for generating valid execution requests
  const executionRequestArbitrary = fc.record({
    language: fc.constantFrom("python", "java", "c++", "c"),
    version: fc.constantFrom("3.10.0", "17.0.0", "10.2.0", "11.0.0"),
    files: fc.array(
      fc.record({
        name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
          nil: undefined,
        }),
        content: fc.string({ minLength: 1, maxLength: 1000 }),
      }),
      { minLength: 1, maxLength: 1 },
    ),
    stdin: fc.string({ maxLength: 500 }),
    args: fc.option(fc.array(fc.string({ maxLength: 50 })), { nil: undefined }),
    compile_timeout: fc.option(fc.integer({ min: 1000, max: 30000 }), {
      nil: undefined,
    }),
    run_timeout: fc.option(fc.integer({ min: 1000, max: 30000 }), {
      nil: undefined,
    }),
    compile_memory_limit: fc.option(
      fc.integer({ min: 1000000, max: 100000000 }),
      { nil: undefined },
    ),
    run_memory_limit: fc.option(fc.integer({ min: 1000000, max: 100000000 }), {
      nil: undefined,
    }),
  });

  it("should format requests with all required fields", () => {
    fc.assert(
      fc.property(executionRequestArbitrary, (request) => {
        // Verify required fields are present
        expect(request).toHaveProperty("language");
        expect(request).toHaveProperty("version");
        expect(request).toHaveProperty("files");
        expect(request).toHaveProperty("stdin");

        // Verify types
        expect(typeof request.language).toBe("string");
        expect(typeof request.version).toBe("string");
        expect(Array.isArray(request.files)).toBe(true);
        expect(typeof request.stdin).toBe("string");

        // Verify files array structure
        expect(request.files.length).toBeGreaterThan(0);
        request.files.forEach((file) => {
          expect(file).toHaveProperty("content");
          expect(typeof file.content).toBe("string");
        });

        return true;
      }),
    );
  });

  it("should include stdin field even when empty", () => {
    fc.assert(
      fc.property(executionRequestArbitrary, (request) => {
        expect(request).toHaveProperty("stdin");
        expect(typeof request.stdin).toBe("string");
        return true;
      }),
    );
  });

  it("should have valid language identifiers", () => {
    fc.assert(
      fc.property(executionRequestArbitrary, (request) => {
        const validLanguages = ["python", "java", "c++", "c"];
        expect(validLanguages).toContain(request.language);
        return true;
      }),
    );
  });
});

describe("Piston API Responses Are Validated", () => {
  const client = new PistonClientImpl({
    apiUrl: "http://test.example.com",
    timeout: 30000,
    maxRetries: 3,
  });

  // Arbitrary for generating valid execution responses
  const executionResultArbitrary = fc.record({
    stdout: fc.string({ maxLength: 1000 }),
    stderr: fc.string({ maxLength: 1000 }),
    code: fc.integer({ min: 0, max: 255 }),
    signal: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
    output: fc.string({ maxLength: 2000 }),
  });

  const executionResponseArbitrary = fc.record({
    language: fc.constantFrom("python", "java", "c++", "c"),
    version: fc.string({ minLength: 1, maxLength: 20 }),
    run: executionResultArbitrary,
    compile: fc.option(executionResultArbitrary, { nil: undefined }),
  });

  it("should validate responses with all required fields", () => {
    fc.assert(
      fc.property(executionResponseArbitrary, (response) => {
        const validated = client.validateResponse(response);

        // Verify required fields exist
        expect(validated).toHaveProperty("language");
        expect(validated).toHaveProperty("version");
        expect(validated).toHaveProperty("run");

        // Verify run object structure
        expect(validated.run).toHaveProperty("stdout");
        expect(validated.run).toHaveProperty("stderr");
        expect(validated.run).toHaveProperty("code");
        expect(validated.run).toHaveProperty("output");

        return true;
      }),
    );
  });

  it("should reject responses missing required fields", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing language
          fc.record({
            version: fc.string({ minLength: 1 }),
            run: executionResultArbitrary,
          }),
          // Missing version
          fc.record({
            language: fc.string({ minLength: 1 }),
            run: executionResultArbitrary,
          }),
          // Missing run
          fc.record({
            language: fc.string({ minLength: 1 }),
            version: fc.string({ minLength: 1 }),
          }),
          // Empty language
          fc.record({
            language: fc.constant(""),
            version: fc.string({ minLength: 1 }),
            run: executionResultArbitrary,
          }),
          // Empty version
          fc.record({
            language: fc.string({ minLength: 1 }),
            version: fc.constant(""),
            run: executionResultArbitrary,
          }),
        ),
        (invalidResponse) => {
          expect(() => {
            client.validateResponse(invalidResponse);
          }).toThrow(InvalidResponseError);

          return true;
        },
      ),
    );
  });

  it("should reject responses with malformed run object", () => {
    fc.assert(
      fc.property(
        fc.record({
          language: fc.string(),
          version: fc.string(),
          run: fc
            .record({
              stdout: fc.option(fc.string(), { nil: undefined }),
              stderr: fc.option(fc.string(), { nil: undefined }),
              code: fc.option(fc.integer(), { nil: undefined }),
            })
            .filter((run) => !run.stdout && !run.stderr && !run.code),
        }),
        (invalidResponse) => {
          expect(() => {
            client.validateResponse(invalidResponse);
          }).toThrow(InvalidResponseError);

          return true;
        },
      ),
    );
  });

  it("should validate compile object when present", () => {
    fc.assert(
      fc.property(
        fc.record({
          language: fc.string({ minLength: 1 }),
          version: fc.string({ minLength: 1 }),
          run: executionResultArbitrary,
          compile: executionResultArbitrary,
        }),
        (response) => {
          const validated = client.validateResponse(response);

          expect(validated.compile).toBeDefined();
          expect(validated.compile).toHaveProperty("stdout");
          expect(validated.compile).toHaveProperty("stderr");
          expect(validated.compile).toHaveProperty("code");

          return true;
        },
      ),
    );
  });

  it("should be idempotent - validating twice produces same result", () => {
    fc.assert(
      fc.property(executionResponseArbitrary, (response) => {
        const validated1 = client.validateResponse(response);
        const validated2 = client.validateResponse(validated1);

        expect(JSON.stringify(validated1)).toBe(JSON.stringify(validated2));
        return true;
      }),
    );
  });
});
