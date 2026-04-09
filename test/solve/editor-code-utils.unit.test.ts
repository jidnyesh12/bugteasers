import { describe, expect, it } from "vitest";
import {
  getDefaultStarterCode,
  normalizeCode,
} from "@/app/(dashboard)/dashboard/student/solve/[id]/utils/editor-code-utils";

describe("solve editor code utils", () => {
  it("returns language-specific starter templates for 4 supported languages", () => {
    const pythonStarter = getDefaultStarterCode("python");
    const javaStarter = getDefaultStarterCode("java");
    const cppStarter = getDefaultStarterCode("cpp");
    const cStarter = getDefaultStarterCode("c");

    expect(pythonStarter).toContain("def solve()");
    expect(javaStarter).toContain("public class Main");
    expect(cppStarter).toContain("#include <bits/stdc++.h>");
    expect(cStarter).toContain("#include <stdio.h>");
    expect(cStarter).toContain("int main(void)");
    expect(pythonStarter).toContain("# Write your solution here");
  });

  it("places starter comment at the student coding position", () => {
    const javaStarter = getDefaultStarterCode("java");
    const cppStarter = getDefaultStarterCode("cpp");
    const cStarter = getDefaultStarterCode("c");

    expect(javaStarter).toContain(
      "public static void main(String[] args) throws Exception {\n        // Write your solution here",
    );
    expect(cppStarter.indexOf("cin.tie(nullptr);")).toBeLessThan(
      cppStarter.indexOf("// Write your solution here"),
    );
    expect(cStarter).toContain(
      "int main(void) {\n    // Write your solution here",
    );

    expect(cStarter).not.toContain("function solution");
  });

  it("normalizes newline style and trims surrounding whitespace", () => {
    const normalized = normalizeCode(
      "\r\nint main(void) {\r\n  return 0;\r\n}\r\n",
    );

    expect(normalized).toBe("int main(void) {\n  return 0;\n}");
  });
});
