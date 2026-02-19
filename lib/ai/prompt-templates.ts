// Prompt templates for problem generation

export const SYSTEM_PROMPT = [
  'You are an expert coding problem creator for an educational platform.',
  'Your role is to generate high-quality, pedagogically sound coding problems that help students learn programming concepts.',
  '',
  'Guidelines:',
  '- Problems should be clear, unambiguous, and well-structured',
  '- Include detailed explanations and examples',
  '- Generate progressive hints that guide without giving away the solution',
  '- Create comprehensive test cases (both sample and hidden)',
  '- Ensure test cases cover edge cases, boundary conditions, and typical scenarios',
  '- Provide starter code that gives students a clear starting point',
  '- Write reference solutions that are clean and well-commented',
  '- Use markdown formatting for descriptions',
  '- IMPORTANT: Use LaTeX formatting for all mathematical expressions, variables, and complexities. Wrap them in single dollar signs $. Example: $n$, $10^5$, $O(n^2)$, $nums[i]$.',
  '',
  'CRITICAL — JSON ESCAPING RULES:',
  'Your output is a JSON object. In JSON strings, a single backslash (\\) is the escape character.',
  '',
  'Standard JSON escapes (use as-is, single backslash):',
  '  \\n = newline,  \\t = tab,  \\\\ = literal backslash,  \\" = quote',
  '',
  'LaTeX commands REQUIRE a literal backslash in the final string.',
  'To produce a literal backslash in JSON, you must write TWO backslashes (\\\\).',
  'So to write LaTeX \\le in a JSON string, you write: \\\\le',
  '',
  'Examples:',
  '  CORRECT: "$2 \\\\le n \\\\le 10^5$"    ← JSON parses this to: $2 \\le n \\le 10^5$  ✓',
  '  WRONG:   "$2 \\le n \\le 10^5$"       ← \\l is not a valid JSON escape, PARSE ERROR!',
  '',
  '  CORRECT: "$O(n \\\\log n)$"           ← JSON parses to: $O(n \\log n)$  ✓',
  '  WRONG:   "$O(n \\\\\\\\log n)$"       ← Too many backslashes! Renders as a line break + "log n"',
  '',
  'Common LaTeX commands (write with \\\\ in JSON):',
  '  \\\\le  \\\\ge  \\\\leq  \\\\geq  \\\\times  \\\\cdot  \\\\log  \\\\sum',
  '  \\\\text{}  \\\\oplus  \\\\ll  \\\\gg  \\\\implies  \\\\ldots  \\\\neq',
  '  \\\\lfloor  \\\\rfloor  \\\\lceil  \\\\rceil  \\\\pmod{}  \\\\infty',
  '',
  'DOLLAR SIGNS: $ does NOT need escaping in JSON. Write $n$ directly.',
  '',
  'NEWLINES: Use \\n for line breaks in descriptions (standard JSON escape).',
  'Do NOT write literal \\\\n — that produces the text "\\n" instead of an actual line break.',
].join('\n');

export function buildProblemGenerationPrompt(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  tags: string[] = [],
  constraints?: string,
  numProblems: number = 1,
  languages: string[] = ['python', 'javascript']
): string {
  const difficultyGuidelines = {
    easy: 'Suitable for beginners. Focus on basic concepts, simple logic, and straightforward implementations.',
    medium: 'Intermediate level. Requires understanding of data structures, algorithms, and problem-solving strategies.',
    hard: 'Advanced level. Complex algorithms, optimization techniques, or multiple concepts combined. May require dynamic programming, graph algorithms, or advanced data structures.'
  };

  const lines = [
    `Generate ${numProblems} coding problem${numProblems > 1 ? 's' : ''} with the following specifications:`,
    '',
    `**Topic**: ${topic}`,
    `**Difficulty**: ${difficulty}`,
    `**Difficulty Guidelines**: ${difficultyGuidelines[difficulty]}`,
    tags.length > 0 ? `**Tags**: ${tags.join(', ')}` : '',
    constraints ? `**Additional Constraints**: ${constraints}` : '',
    `**Programming Languages**: ${languages.join(', ')}`,
    '',
    'For each problem, provide:',
    '',
    '1. **Title**: Concise and descriptive (3-6 words)',
    '',
    '2. **Description**:',
    '   - Clear problem statement in markdown format',
    '   - Use \\n in JSON for line breaks between paragraphs (standard JSON escape)',
    '   - Input/output format specifications',
    '   - Constraints section with LaTeX (remember: \\\\le not \\le in JSON)',
    '   - Use LaTeX for ALL math, numbers, variables, and complexities.',
    '   - **IMPORTANT**: Do NOT include an "Examples" section in the description. Examples must ONLY be in the "examples" array.',
    '',
    '3. **Examples** (human-readable format for display):',
    '   - Provide 2-3 sample input/output pairs',
    '   - Use human-readable format: e.g. "nums = [1, 5, 2, 4, 3], K = 1"',
    '   - Include explanations for each example (LaTeX enabled)',
    '',
    '4. **Hints**:',
    '   - Generate 3-4 progressive hints',
    '   - Start with conceptual guidance, progress to more specific algorithmic hints',
    '   - Never give away the complete solution',
    '',
    '5. **Test Cases** (STRICT competitive-programming stdin/stdout format):',
    '   CRITICAL: test case input_data and expected_output must use RAW stdin/stdout format.',
    '   - NO variable names, NO brackets, NO "nums = ..." format',
    '   - Just raw numbers, space-separated on each line',
    '   - First line typically contains dimensions/counts, followed by actual data',
    '   ',
    '   Example for array problem with nums=[1,5,2,4,3] and K=1:',
    '     CORRECT input_data: "5 1\\n1 5 2 4 3"   (n and K on first line, array on second)',
    '     WRONG input_data:   "nums = [1, 5, 2, 4, 3], K = 1"',
    '     CORRECT expected_output: "9"',
    '     WRONG expected_output: "Output: 9"',
    '   ',
    '   - Generate 8-12 test cases total',
    '   - Mark 2-3 as sample cases (visible to students)',
    '   - Include edge cases and boundary conditions',
    '   - Assign points based on difficulty (1-3 points per case)',
    '',
    '6. **Starter Code**:',
    `   - Provide function signatures for: ${languages.join(', ')}`,
    '   - Include parameter names and return type hints',
    '   - Add brief docstring/comment explaining expected behavior',
    '',
    '7. **Solution Code**:',
    '   - Provide a complete, well-commented reference solution in Python',
    '   - Use clean, readable code with proper variable names',
    '',
    '8. **Metadata**:',
    `   - Time limit: ${difficulty === 'easy' ? '1000-2000' : difficulty === 'medium' ? '2000-3000' : '3000-5000'}ms`,
    '   - Memory limit: 256MB',
    '   - Suggested tags based on concepts used',
    '',
    'REMINDERS:',
    '- \\n for newlines (standard JSON). Do NOT write \\\\n — that gives literal text "\\n".',
    '- \\\\le, \\\\log, \\\\text{} etc. for LaTeX commands (double backslash in JSON gives one literal backslash).',
    '- Test case input_data/expected_output: RAW stdin/stdout only (no variable names, no brackets)!',
    '',
    'Return the response as a valid JSON object matching this structure:',
    '{',
    '  "problems": [',
    '    {',
    '      "title": "string",',
    `      "description": "string (markdown with LaTeX, use \\n for newlines)",`,
    `      "difficulty": "${difficulty}",`,
    '      "tags": ["array of strings"],',
    '      "constraints": "string (LaTeX enabled)",',
    '      "examples": [',
    '        {',
    '          "input": "string (human-readable, e.g. nums = [1,2,3], target = 5)",',
    '          "output": "string (human-readable)",',
    '          "explanation": "string (LaTeX enabled)"',
    '        }',
    '      ],',
    '      "hints": ["array of strings (LaTeX enabled)"],',
    '      "time_limit": "number",',
    '      "memory_limit": 256,',
    '      "starter_code": {',
    `        ${languages.map(lang => `"${lang}": "string"`).join(',\n        ')}`,
    '      },',
    '      "solution_code": "string",',
    '      "test_cases": [',
    '        {',
    `          "input_data": "string (RAW stdin: e.g. \\"5 1\\n1 5 2 4 3\\")",`,
    `          "expected_output": "string (RAW stdout: e.g. \\"9\\")",`,
    '          "is_sample": "boolean",',
    '          "points": "number (1-3)"',
    '        }',
    '      ]',
    '    }',
    '  ]',
    '}',
  ];

  return lines.join('\n');
}

export const EXAMPLE_PROBLEM = `
Example of a well-structured problem:

**Title**: Two Sum

**Description**:
Given an array of integers $nums$ and an integer $target$, return indices of the two numbers such that they add up to $target$.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Input Format**:
- First line: integer $n$ (length of array)
- Second line: $n$ space-separated integers
- Third line: integer $target$

**Output Format**:
- Two space-separated integers representing the indices (0-indexed)

**Constraints**:
- $2 \\le n \\le 10^4$
- $-10^9 \\le nums[i] \\le 10^9$

**Test Case (stdin)**:
input_data: "4\\n2 7 11 15\\n9"
expected_output: "0 1"
`;
