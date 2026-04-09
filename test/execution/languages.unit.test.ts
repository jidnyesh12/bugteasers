import { describe, expect, it } from "vitest";
import {
  normalizeSupportedLanguage,
  SUPPORTED_EXECUTION_LANGUAGES,
} from "@/lib/execution/languages";

describe("execution language utilities", () => {
  it("returns supported languages as-is", () => {
    for (const language of SUPPORTED_EXECUTION_LANGUAGES) {
      expect(normalizeSupportedLanguage(language)).toBe(language);
    }
  });

  it("normalizes known aliases", () => {
    expect(normalizeSupportedLanguage("c++")).toBe("cpp");
    expect(normalizeSupportedLanguage(" C++ ")).toBe("cpp");
  });

  it("returns null for unsupported values", () => {
    expect(normalizeSupportedLanguage("ruby")).toBeNull();
    expect(normalizeSupportedLanguage("")).toBeNull();
    expect(normalizeSupportedLanguage("   ")).toBeNull();
  });
});
