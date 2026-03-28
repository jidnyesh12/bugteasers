import type { SupportedLanguage } from '@/lib/execution/types';

export function getDefaultStarterCode(language: SupportedLanguage): string {
  switch (language) {
    case 'python': return '# Write your solution here\n\ndef solve():\n    pass\n';
    case 'java': return '// Write your solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n';
    case 'cpp': return '// Write your solution here\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n';
    case 'c': return '// Write your solution here\n\n#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n';
    default: return '// Write your solution here\n';
  }
}

export function normalizeCode(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}
