import type { SupportedLanguage } from "@/lib/execution/types";

export function getDefaultStarterCode(language: SupportedLanguage): string {
  switch (language) {
    case "python":
      return 'def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n';
    case "java":
      return "import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        // Write your solution here\n    }\n}\n";
    case "cpp":
      return "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n\n    return 0;\n}\n";
    case "c":
      return "#include <stdio.h>\n\nint main(void) {\n    // Write your solution here\n\n    return 0;\n}\n";
    default:
      return "// Write your solution here\n";
  }
}

export function normalizeCode(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}
