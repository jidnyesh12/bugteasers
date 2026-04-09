// Prompt templates for problem generation

import { SUPPORTED_EXECUTION_LANGUAGES } from '@/lib/execution/languages';
import type { SupportedLanguage } from '@/lib/execution/types';
import type { RetryHistoryEntry } from './types';

const SUPPORTED_SOLVE_LANGUAGES_TEXT = SUPPORTED_EXECUTION_LANGUAGES.join(', ');

export const SYSTEM_PROMPT = [
  'You are an expert coding problem creator for an educational platform.',
  'Your role is to generate high-quality, pedagogically sound coding problems that help students learn programming concepts.',
  '',
  'CRITICAL RULES:',
  '- You MUST generate problems about the topic requested by the user',
  '- You MUST follow the exact JSON structure specified in the prompt',
  '- You MUST wrap your response in a "problems" array',
  '- You MUST use the input_template DSL for ALL test cases',
  '',
  'Guidelines:',
  '- Problems should be clear, unambiguous, and well-structured',
  '- Include detailed explanations and examples',
  '- Generate progressive hints that guide without giving away the solution',
  '- Create comprehensive test cases (both sample and hidden)',
  '- Ensure test cases cover edge cases, boundary conditions, and typical scenarios',
  '- This platform uses CodeChef/Codeforces style solving: students write a full program that reads stdin and writes stdout',
  `- Supported solve languages are: ${SUPPORTED_SOLVE_LANGUAGES_TEXT}`,
  '- Write reference solutions using one of the supported languages with stdin/stdout (not function-only LeetCode style)',
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
  languages: readonly SupportedLanguage[] = SUPPORTED_EXECUTION_LANGUAGES
): string {
  const difficultyGuidelines = {
    easy: 'Suitable for beginners. Focus on basic concepts, simple logic, and straightforward implementations.',
    medium: 'Intermediate level. Requires understanding of data structures, algorithms, and problem-solving strategies.',
    hard: 'Advanced level. Complex algorithms, optimization techniques, or multiple concepts combined. May require dynamic programming, graph algorithms, or advanced data structures.'
  };

  const lines = [
    `CRITICAL: Generate ${numProblems} coding problem${numProblems > 1 ? 's' : ''} about "${topic}".`,
    `DO NOT generate problems about any other topic. The topic MUST be: ${topic}`,
    '',
    `**Topic**: ${topic}`,
    `**Difficulty**: ${difficulty}`,
    `**Difficulty Guidelines**: ${difficultyGuidelines[difficulty]}`,
    tags.length > 0 ? `**Tags**: ${tags.join(', ')}` : '',
    constraints ? `**Additional Constraints**: ${constraints}` : '',
    `**Supported Solve Languages**: ${languages.join(', ')}`,
    '',
    'CRITICAL: Your response MUST be a valid JSON object with this EXACT structure:',
    '{',
    '  "problems": [ ... array of problem objects ... ]',
    '}',
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
    '5. **Test Cases**:',
    '   All test cases MUST use the input_template DSL format.',
    '   When using input_template, you MUST set input_data to "" (empty string).',
    '   ',
    '   **Input Template DSL Structure**:',
    '   {',
    '     "version": 1,',
    '     "seed": "optional-seed-fragment",',
    '     "variables": {',
    '       "n": {"type":"int","min":1,"max":100000},',
    '       "arr": {"type":"int_array","length":{"ref":"n"},"min":1,"max":100000},',
    '       "queries": {"type":"const","value":[[1,5],[2,10,20]]},',
    '       "perm": {"type":"permutation","n":{"ref":"n"}},',
    '       "g": {"type":"graph","nodes":{"ref":"n"},"edges":200000,"connected":true,"weighted":false}',
    '     },',
    '     "output": [',
    '       {"type":"line","values":[{"ref":"n"}]},',
    '       {"type":"line","values":[{"ref":"arr"}]},',
    '       {"type":"lines","from":"queries"}',
    '     ]',
    '   }',
    '   ',
    '   **Supported Variable Types**:',
    '   - const: Fixed value (can be number, string, array, or 2D array)',
    '     Example: {"type":"const","value":5} or {"type":"const","value":[1,2,3]} or {"type":"const","value":[[1,2],[3,4]]}',
    '   - int: Random integer in range',
    '     Example: {"type":"int","min":1,"max":100}',
    '   - choice: Pick from list of options',
    '     Example: {"type":"choice","values":["A","B","C"]}',
    '   - string: Random string with charset',
    '     Example: {"type":"string","length":10,"charset":"lower"}',
    '   - int_array: Array of random integers',
    '     Example: {"type":"int_array","length":{"ref":"n"},"min":1,"max":100}',
    '     CRITICAL: limit lengths to max 10000 to prevent execution buffer overflow!',
    '   - matrix: 2D array of random integers (for random generation only)',
    '     Example: {"type":"matrix","rows":{"ref":"n"},"cols":{"ref":"m"},"min":0,"max":1}',
    '   - permutation: Random permutation of integers',
    '     Example: {"type":"permutation","n":{"ref":"n"},"start":1}',
    '   - pairs: Array of coordinate pairs',
    '     Example: {"type":"pairs","count":{"ref":"n"},"first":{"min":1,"max":100},"second":{"min":1,"max":100}}',
    '   - graph: Graph with nodes and edges',
    '     Example: {"type":"graph","nodes":{"ref":"n"},"edges":{"ref":"m"},"directed":false}',
    '   ',
    '   **IMPORTANT**: For fixed/constant arrays (like sample test queries), use type "const" with value field.',
    '   Do NOT use "matrix" type with "values" field - matrix is only for random generation with min/max.',
    '   ',
    '   **Test Case Requirements**:',
    '   - Generate 8-12 test cases total',
    '   - Mark 2-3 as sample cases (is_sample: true)',
    '   - Include edge cases, random cases, and stress tests',
    '   - Assign points: 1 (easy), 2 (medium), 3 (hard)',
    '   - Provide input_template with appropriate constraints',
    '',
    '6. **Solution Code**:',
    '   - REQUIRED LANGUAGE: Write the solution in C++ ONLY. Do not use any other language.',
    '   - Must parse input from stdin and print output to stdout',
    '   - Do NOT provide a function-only signature style solution',
    '   - CRITICAL: Your code is inside a JSON string. Escape backslashes as \\\\ and quotes as \\"',
    '   - DO NOT include ANY comments (no // lines, no /* */ blocks). Comments cause JSON escaping issues.',
    '   - Do not include #include line comments or any inline comments whatsoever',
    '   - FORBIDDEN: Do NOT use #include <bits/stdc++.h> — it causes compilation timeouts in our sandbox.',
    '   - You MUST use explicit, individual includes: <iostream>, <vector>, <algorithm>, <string>, <map>, <set>, <queue>, <stack>, <cmath>, <climits>, <numeric>, <functional>, <sstream>, <cstring>, <cstdio>, <cassert>, <deque>, <unordered_map>, <unordered_set>',
    '   - Use standard competitive programming C++ patterns (cin/cout)',
    '',
    '7. **Metadata**:',
    `   - Time limit: ${difficulty === 'easy' ? '1000-2000' : difficulty === 'medium' ? '2000-3000' : '3000-5000'}ms`,
    '   - Memory limit: 256MB',
    '   - Suggested tags based on concepts used',
    '',
    'REMINDERS:',
    '- \\n for newlines (standard JSON). Do NOT write \\\\n — that gives literal text "\\n".',
    '- \\\\le, \\\\log, \\\\text{} etc. for LaTeX commands (double backslash in JSON gives one literal backslash).',
    '- EVERY test case MUST have input_template with variables and output instructions',
    '',
    'CRITICAL - FINAL CHECK BEFORE RESPONDING:',
    `1. Is your problem about "${topic}"? If not, START OVER.`,
    '2. Is your response wrapped in { "problems": [...] }? If not, FIX IT.',
    '3. Does every test case have input_template? If not, ADD THEM.',
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
    '      "solution_code": "string (complete stdin/stdout program in one supported language)",',
    '      "test_cases": [',
    '        {',
    '          "input_template": {',
    '            "version": 1,',
    '            "seed": "optional-seed-fragment",',
    '           "variables": { "n": { "type": "int", "min": 1, "max": 100000 } },',
    '            "output": [{ "type": "line", "values": [{ "ref": "n" }] }]',
    '          },',
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

export function buildRetryContextSection(retryHistory: RetryHistoryEntry[]): string {
  if (retryHistory.length === 0) {
    return '';
  }

  const lines: string[] = [
    '╔══════════════════════════════════════════════════════════════╗',
    '║  ⚠️  RETRY ATTEMPT — PREVIOUS GENERATION FAILED            ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    `This is attempt ${retryHistory.length + 1}. Your previous ${retryHistory.length === 1 ? 'attempt' : `${retryHistory.length} attempts`} FAILED.`,
    'You MUST fix the issues listed below. Do NOT repeat the same mistakes.',
    '',
    '--- PREVIOUS ERRORS (FIX ALL OF THESE) ---',
    '',
  ];

  for (const entry of retryHistory) {
    const stageLabel = entry.stage === 'ai_generating' ? 'Generation/Parsing' : 'Validation/Execution';
    lines.push(`Attempt ${entry.attempt} — Failed at: ${stageLabel}`);
    lines.push(`Error: ${entry.error}`);
    lines.push('');
  }

  // Add specific fix instructions based on common error patterns
  const allErrors = retryHistory.map(e => e.error.toLowerCase()).join(' ');
  lines.push('--- SPECIFIC FIX INSTRUCTIONS ---');
  lines.push('');

  if (allErrors.includes('json') || allErrors.includes('parse') || allErrors.includes('format')) {
    lines.push('🔴 JSON FORMAT: Your response had JSON formatting issues.');
    lines.push('   - Ensure your ENTIRE response is a single valid JSON object: {"problems": [...]}');
    lines.push('   - Do NOT include markdown code fences (```json) around the response');
    lines.push('   - Escape all backslashes in strings: use \\\\ for LaTeX commands');
    lines.push('   - Escape all quotes in strings: use \\"');
    lines.push('   - Use \\n for newlines, not literal line breaks inside strings');
    lines.push('');
  }

  if (allErrors.includes('compile') || allErrors.includes('syntax') || allErrors.includes('runtime')) {
    lines.push('🔴 CODE ERRORS: Your solution code had compilation or runtime errors.');
    lines.push('   - REQUIRED LANGUAGE: Write the solution in C++ ONLY.');
    lines.push('   - Write a COMPLETE C++ program that reads from stdin and writes to stdout');
    lines.push('   - FORBIDDEN: Do NOT use #include <bits/stdc++.h> — it causes compilation timeouts.');
    lines.push('   - Use explicit includes: <iostream>, <vector>, <algorithm>, <string>, <map>, <set>, etc.');
    lines.push('   - DO NOT include ANY comments (no // lines, no /* */ blocks) — they cause JSON escaping issues');
    lines.push('   - Remember: code is inside a JSON string, escape \\\\ and " properly');
    lines.push('');
  }

  if (allErrors.includes('template') || allErrors.includes('input_template') || allErrors.includes('dsl')) {
    lines.push('🔴 TEMPLATE DSL: Your input_template was invalid.');
    lines.push('   - Every test case MUST have input_template with version, variables, and output');
    lines.push('   - Variables must be defined before they are referenced');
    lines.push('   - Use "const" type for fixed arrays, NOT "matrix" with "values"');
    lines.push('   - Valid types: const, int, choice, string, int_array, matrix, permutation, pairs, graph');
    lines.push('   - Output must reference defined variables via {"ref": "varName"}');
    lines.push('');
  }

  if (allErrors.includes('mismatch') || allErrors.includes('expected') || allErrors.includes('output')) {
    lines.push('🔴 OUTPUT MISMATCH: Your solution produced wrong output for test cases.');
    lines.push('   - Verify your algorithm is correct');
    lines.push('   - Make sure output format matches what the problem description specifies');
    lines.push('   - Check edge cases: empty inputs, single elements, maximum values');
    lines.push('');
  }

  if (allErrors.includes('validation') || allErrors.includes('missing')) {
    lines.push('🔴 VALIDATION: Required fields were missing or invalid.');
    lines.push('   - Every problem needs: title, description, difficulty, tags, constraints, examples, hints, solution_code, test_cases');
    lines.push('   - Every test case needs: input_template, is_sample (boolean), points (1-3)');
    lines.push('   - At least one test case must have is_sample: true');
    lines.push('   - Generate 8-12 test cases total');
    lines.push('');
  }

  lines.push('CRITICAL: Generate a COMPLETELY NEW and CORRECT response. Do NOT repeat previous mistakes.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Builds a targeted repair prompt when only the solution_code is broken.
 *
 * The problem structure (title, description, test case templates) has already
 * been validated and is correct — only the C++ solution has execution errors.
 * The AI is asked to return { "solution_code": "..." } only, NOT a full problem.
 * This minimises the surface area for new mistakes and is much faster.
 */
export function buildSolutionRepairPrompt(
  problem: {
    title: string;
    description: string;
    constraints: string;
  },
  retryHistory: RetryHistoryEntry[]
): string {
  const validationErrors = retryHistory
    .filter((e) => e.stage === 'validating')
    .map((e) => `Attempt ${e.attempt} error: ${e.error}`)
    .join('\n');

  return [
    '╔══════════════════════════════════════════════════════════════╗',
    '║  🔧  SOLUTION REPAIR — FIX C++ CODE ONLY                   ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    'A coding problem was generated successfully. The problem structure,',
    'test case templates, and examples are ALL CORRECT and must NOT change.',
    '',
    'ONLY the C++ solution_code failed execution. Your task: write a',
    'correct C++ solution for this problem.',
    '',
    '--- PROBLEM ---',
    `Title: ${problem.title}`,
    '',
    `Description:\n${problem.description}`,
    '',
    `Constraints:\n${problem.constraints}`,
    '',
    '--- EXECUTION ERRORS TO FIX ---',
    validationErrors,
    '',
    '--- STRICT RULES ---',
    '- Write the solution in C++ ONLY',
    '- FORBIDDEN: Do NOT use #include <bits/stdc++.h> — it causes compilation timeouts',
    '- Use explicit includes: <iostream>, <vector>, <algorithm>, <string>, <map>, <set>, <cmath>, etc.',
    '- Use int main() with cin/cout',
    '- DO NOT include ANY comments (no // lines, no /* */ blocks)',
    '- DO NOT include any string literals with special characters',
    '- The solution must read from stdin and write to stdout',
    '- The solution must be correct and efficient for the given constraints',
    '',
    'Return ONLY the following JSON (nothing else, no markdown fences):',
    '{ "solution_code": "... your C++ code here ..." }',
    '',
    'CRITICAL: The JSON must be valid. Escape all backslashes as \\\\\\\\ and quotes as \\\\".',
  ].join('\n');
}


/**
 * Builds a targeted repair prompt driven by the structured OracleValidationFailure
 * produced by the Two-Pass validation pipeline.
 *
 * Unlike the generic buildSolutionRepairPrompt, this variant includes the exact
 * failure data (stderr, expected vs actual stdout, input that caused the mismatch)
 * so the LLM can make a surgical fix.
 */
export function buildOracleRepairPrompt(
  problem: {
    title: string;
    description: string;
    constraints: string;
  },
  failure: {
    errorType: string;
    message: string;
    failedCode?: string;
    stderr?: string;
    expectedOutput?: string;
    actualOutput?: string;
    inputData?: string;
  },
  attemptNumber: number,
  maxAttempts: number
): string {
  const lines: string[] = [
    '╔══════════════════════════════════════════════════════════════╗',
    '║  🔧  ORACLE REPAIR — SELF-CORRECTION ATTEMPT               ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    `This is repair attempt ${attemptNumber} of ${maxAttempts}.`,
    'The problem structure (title, description, test case templates) is CORRECT.',
    'ONLY the C++ solution_code failed Oracle validation.',
    '',
    '--- PROBLEM CONTEXT ---',
    `Title: ${problem.title}`,
    '',
    `Description:`,
    problem.description,
    '',
    `Constraints:`,
    problem.constraints,
    '',
  ];

  // ── Error-specific sections ──
  lines.push('--- FAILURE DIAGNOSIS ---');
  lines.push(`Error Type: ${failure.errorType}`);
  lines.push(`Error Message: ${failure.message}`);
  lines.push('');

  if (failure.errorType === 'compile_error' && failure.stderr) {
    lines.push('--- COMPILER STDERR ---');
    lines.push(failure.stderr.substring(0, 2000));
    lines.push('');
    lines.push('FIX INSTRUCTIONS:');
    lines.push('- The code above did not compile. Read the stderr carefully.');
    lines.push('- Fix all compilation errors. Do NOT change the algorithm unless it is fundamentally broken.');
    lines.push('- FORBIDDEN: Do NOT use #include <bits/stdc++.h> — it causes compilation timeouts.');
    lines.push('- Use explicit includes: <iostream>, <vector>, <algorithm>, <string>, <map>, <set>, etc.');
    lines.push('');
  }

  if (failure.errorType === 'model_answer_error' && failure.stderr) {
    lines.push('--- RUNTIME STDERR ---');
    lines.push(failure.stderr.substring(0, 2000));
    lines.push('');
    lines.push('FIX INSTRUCTIONS:');
    lines.push('- The code compiled but crashed at runtime (segfault, TLE, or non-zero exit).');
    lines.push('- Check for: out-of-bounds access, integer overflow, infinite loops, division by zero.');
    lines.push('');
  }

  if (failure.errorType === 'logic_consistency_error') {
    lines.push('--- LOGIC MISMATCH ---');
    if (failure.inputData) {
      lines.push(`Input that caused the mismatch:`);
      lines.push(failure.inputData.substring(0, 1000));
      lines.push('');
    }
    if (failure.expectedOutput) {
      lines.push(`Expected output: "${failure.expectedOutput}"`);
    }
    if (failure.actualOutput) {
      lines.push(`Actual output:   "${failure.actualOutput}"`);
    }
    lines.push('');
    lines.push('FIX INSTRUCTIONS:');
    lines.push('- The code compiled and ran, but produced WRONG output for the above input.');
    lines.push('- Your algorithm is logically incorrect. Fix the algorithm itself.');
    lines.push('- Verify edge cases: empty inputs, single elements, maximum constraint values.');
    lines.push('');
  }

  if (failure.failedCode) {
    lines.push('--- FAILED C++ CODE (DO NOT REPEAT THIS) ---');
    lines.push(failure.failedCode.substring(0, 3000));
    lines.push('');
  }

  lines.push('--- STRICT RULES ---');
  lines.push('- Write the solution in C++ ONLY');
  lines.push('- FORBIDDEN: Do NOT use #include <bits/stdc++.h> — it causes compilation timeouts');
  lines.push('- Use explicit includes: <iostream>, <vector>, <algorithm>, <string>, <map>, <set>, <cmath>, etc.');
  lines.push('- Use int main() with cin/cout');
  lines.push('- DO NOT include ANY comments (no // lines, no /* */ blocks)');
  lines.push('- The solution must read from stdin and write to stdout');
  lines.push('- The solution must be correct and efficient for the given constraints');
  lines.push('');
  lines.push('Return ONLY the following JSON (nothing else, no markdown fences):');
  lines.push('{ "solution_code": "... your C++ code here ..." }');
  lines.push('');
  lines.push('CRITICAL: The JSON must be valid. Escape all backslashes as \\\\\\\\ and quotes as \\".');

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
