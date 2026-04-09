import { describe, expect, it } from "vitest";
import { detectSupportedLanguageFromCode } from "@/lib/execution/language-detection";

describe("detectSupportedLanguageFromCode", () => {
  it("detects python code", () => {
    const code =
      'def solve():\n    print("ok")\n\nif __name__ == "__main__":\n    solve()\n';
    expect(detectSupportedLanguageFromCode(code)).toBe("python");
  });

  it("detects java code", () => {
    const code =
      'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("ok");\n  }\n}\n';
    expect(detectSupportedLanguageFromCode(code)).toBe("java");
  });

  it("detects c code", () => {
    const code =
      '#include <stdio.h>\nint main(void) {\n  printf("ok\\n");\n  return 0;\n}\n';
    expect(detectSupportedLanguageFromCode(code)).toBe("c");
  });

  it("detects cpp code", () => {
    const code =
      '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n  cout << "ok";\n  return 0;\n}\n';
    expect(detectSupportedLanguageFromCode(code)).toBe("cpp");
  });

  it("falls back to cpp for unknown snippets", () => {
    expect(detectSupportedLanguageFromCode("some random pseudo code")).toBe(
      "cpp",
    );
  });
});
