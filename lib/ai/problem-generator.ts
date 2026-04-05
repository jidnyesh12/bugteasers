// AI Problem Generator using Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProblemGenerationRequest,
  ProblemGenerationResponse,
  GeneratedProblem,
  RetryHistoryEntry,
} from './types';
import { SYSTEM_PROMPT, buildProblemGenerationPrompt, buildRetryContextSection, buildSolutionRepairPrompt } from './prompt-templates';
import { GEMINI_API_KEY } from '@/lib/env';
import { SUPPORTED_EXECUTION_LANGUAGES } from '@/lib/execution/languages';
import {
  hasUnresolvedPlaceholder,
  validateTestCaseInputTemplate,
} from '@/lib/ai/template-dsl';

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateProblems(
  request: ProblemGenerationRequest
): Promise<ProblemGenerationResponse> {
  try {
    console.log('[GENERATION] Starting problem generation with request:', JSON.stringify(request, null, 2));
    
    // Use Gemini 3 Flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
    });

    // Build the prompt
    const languages = request.languages && request.languages.length > 0
      ? request.languages
      : SUPPORTED_EXECUTION_LANGUAGES;

    const userPrompt = buildProblemGenerationPrompt(
      request.topic,
      request.difficulty,
      request.tags,
      request.constraints,
      request.numProblems || 1,
      languages
    );

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
    console.log('[GENERATION] Prompt built, sending to AI...');

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    
    console.log('[GENERATION] AI response received, length:', text.length);
    console.log('[GENERATION] Raw AI response (first 1000 chars):', text.substring(0, 1000));

    // Parse JSON response
    const parsedResponse = parseGeneratedProblems(text);
    console.log('[GENERATION] JSON parsed successfully, problems count:', parsedResponse.problems.length);

    // Normalize test cases - add required fields that AI doesn't need to provide
    console.log('[GENERATION] Normalizing test cases...');
    for (const problem of parsedResponse.problems) {
      for (const testCase of problem.test_cases) {
        // Ensure input_data is empty when using template
        if (testCase.input_template) {
          testCase.input_data = '';
          testCase.expected_output = '__AUTO_EXPECTED_OUTPUT__';
        }
      }
    }

    // Validate the response
    console.log('[GENERATION] Starting validation...');
    validateGeneratedProblems(parsedResponse.problems);
    console.log('[GENERATION] Validation passed!');

    return {
      problems: parsedResponse.problems,
      metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
      },
    };
  } catch (error) {
    console.error('[GENERATION] Error generating problems:', error);
    throw new Error(
      `Failed to generate problems: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function generateProblemsWithRetryContext(
  request: ProblemGenerationRequest,
  retryHistory: RetryHistoryEntry[]
): Promise<ProblemGenerationResponse> {
  try {
    console.log(`[GENERATION/RETRY] Starting retry generation (attempt ${retryHistory.length + 1}) with request:`, JSON.stringify(request, null, 2));
    console.log('[GENERATION/RETRY] Previous errors:', retryHistory.map(e => `${e.stage}: ${e.error}`).join(' | '));

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });

    const languages = request.languages && request.languages.length > 0
      ? request.languages
      : SUPPORTED_EXECUTION_LANGUAGES;

    const userPrompt = buildProblemGenerationPrompt(
      request.topic,
      request.difficulty,
      request.tags,
      request.constraints,
      request.numProblems || 1,
      languages
    );

    const retryContext = buildRetryContextSection(retryHistory);

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${retryContext}\n\n${userPrompt}`;
    console.log('[GENERATION/RETRY] Retry prompt built with error context, sending to AI...');

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    console.log('[GENERATION/RETRY] AI response received, length:', text.length);
    console.log('[GENERATION/RETRY] Raw AI response (first 1000 chars):', text.substring(0, 1000));

    const parsedResponse = parseGeneratedProblems(text);
    console.log('[GENERATION/RETRY] JSON parsed successfully, problems count:', parsedResponse.problems.length);

    console.log('[GENERATION/RETRY] Normalizing test cases...');
    for (const problem of parsedResponse.problems) {
      for (const testCase of problem.test_cases) {
        if (testCase.input_template) {
          testCase.input_data = '';
          testCase.expected_output = '__AUTO_EXPECTED_OUTPUT__';
        }
      }
    }

    console.log('[GENERATION/RETRY] Starting validation...');
    validateGeneratedProblems(parsedResponse.problems);
    console.log('[GENERATION/RETRY] Validation passed!');

    return {
      problems: parsedResponse.problems,
      metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
      },
    };
  } catch (error) {
    console.error('[GENERATION/RETRY] Error in retry generation:', error);
    throw new Error(
      `Failed to generate problems (retry): ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Repairs only the solution_code of the failing problem.
 *
 * Called when validation fails (compile/runtime error) but the problem structure
 * (templates, examples, descriptions) is known-good. Instead of regenerating
 * everything, we send a targeted prompt asking for { "solution_code": "..." } only
 * and merge it back into the existing problems array.
 *
 * @param existingProblems - The problems that passed structural validation
 * @param failingProblemIndex - 0-based index of the problem whose solution failed
 * @param retryHistory - Full retry history (used to surface previous errors to the AI)
 */
export async function repairProblemSolutionCode(
  existingProblems: GeneratedProblem[],
  failingProblemIndex: number,
  retryHistory: RetryHistoryEntry[]
): Promise<ProblemGenerationResponse> {
  const problemToRepair = existingProblems[failingProblemIndex];
  if (!problemToRepair) {
    throw new Error(
      `repairProblemSolutionCode: no problem at index ${failingProblemIndex} (total: ${existingProblems.length})`
    );
  }

  console.log(
    `[REPAIR] Repairing solution_code for problem ${failingProblemIndex + 1}: "${problemToRepair.title}"`
  );
  console.log('[REPAIR] Validation errors to fix:', retryHistory.map((e) => e.error).join(' | '));

  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });

  const repairPrompt = buildSolutionRepairPrompt(
    {
      title: problemToRepair.title,
      description: problemToRepair.description,
      constraints: problemToRepair.constraints,
    },
    retryHistory
  );

  // Prepend system prompt for JSON-escaping context
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${repairPrompt}`;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();

  console.log('[REPAIR] AI response length:', text.length);
  console.log('[REPAIR] Raw response (first 500 chars):', text.substring(0, 500));

  // Parse { "solution_code": "..." } — much simpler than full problem JSON
  const parsed = parseSolutionRepairResponse(text);

  console.log('[REPAIR] Parsed solution_code length:', parsed.solution_code.length);

  // Merge repaired solution back — only solution_code changes
  const repairedProblems: GeneratedProblem[] = existingProblems.map((p, i) =>
    i === failingProblemIndex ? { ...p, solution_code: parsed.solution_code } : p
  );

  return {
    problems: repairedProblems,
    metadata: {
      generated_at: new Date().toISOString(),
      model: 'gemini-2.5-flash',
    },
  };
}

function parseSolutionRepairResponse(text: string): { solution_code: string } {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```\s*$/g, '');
  cleaned = cleaned.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[REPAIR] Failed to parse solution repair JSON. Raw text:', text.substring(0, 300));
    throw new Error(
      `Solution repair returned invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('solution_code' in parsed) ||
    typeof (parsed as Record<string, unknown>).solution_code !== 'string' ||
    ((parsed as Record<string, unknown>).solution_code as string).trim().length === 0
  ) {
    throw new Error('Solution repair response missing valid "solution_code" field');
  }

  return { solution_code: ((parsed as Record<string, unknown>).solution_code as string) };
}



function parseGeneratedProblems(text: string): { problems: GeneratedProblem[] } {
  try {
    // Remove markdown code blocks if present - more robust approach
    let cleanedText = text.trim();
    
    // Remove opening code block markers (including ```json at start)
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/^```\s*/, '');
    
    // Remove closing code block markers
    cleanedText = cleanedText.replace(/\s*```\s*$/g, '');
    
    // Trim again after removing markers
    cleanedText = cleanedText.trim();

    // Check if response starts with { instead of {"problems"
    // This handles cases where AI forgets to wrap in problems array
    if (cleanedText.startsWith('{') && !cleanedText.includes('"problems"')) {
      console.warn('[PARSING] AI response missing "problems" wrapper - attempting to fix');
      // Check if it looks like a single problem object
      if (cleanedText.includes('"title"') && cleanedText.includes('"description"')) {
        console.warn('[PARSING] Detected single problem object, wrapping in problems array');
        cleanedText = `{"problems":[${cleanedText}]}`;
      }
    }

    const parsed = JSON.parse(cleanedText);
    
    // Validate structure
    if (!parsed || !parsed.problems || !Array.isArray(parsed.problems)) {
      throw new Error('Response missing "problems" array');
    }
    
    return parsed;
  } catch (error) {
    console.error('[PARSING] Failed to parse AI response. First 500 chars:', text.substring(0, 500));
    console.error('[PARSING] Parse error:', error);
    throw new Error(`AI returned invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateGeneratedProblems(problems: GeneratedProblem[]): void {
  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error('No problems generated');
  }

  console.log('[VALIDATION] Validating', problems.length, 'problem(s)');

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    console.log(`[VALIDATION] Problem ${i + 1}: "${problem.title}"`);
    
    // Validate required fields
    if (!problem.title || typeof problem.title !== 'string') {
      throw new Error('Problem missing valid title');
    }
    if (!problem.description || typeof problem.description !== 'string') {
      throw new Error('Problem missing valid description');
    }
    if (!['easy', 'medium', 'hard'].includes(problem.difficulty)) {
      throw new Error('Problem has invalid difficulty level');
    }
    if (!Array.isArray(problem.test_cases) || problem.test_cases.length === 0) {
      throw new Error('Problem missing test cases');
    }
    if (!Array.isArray(problem.hints) || problem.hints.length === 0) {
      throw new Error('Problem missing hints');
    }
    if (!problem.solution_code || typeof problem.solution_code !== 'string') {
      throw new Error('Problem missing valid solution code');
    }

    console.log(`[VALIDATION] Problem ${i + 1}: Basic fields OK, validating ${problem.test_cases.length} test cases...`);

    // Validate test cases
    const sampleCases = problem.test_cases.filter((tc) => tc.is_sample);
    if (sampleCases.length === 0) {
      throw new Error('Problem must have at least one sample test case');
    }

    for (let j = 0; j < problem.test_cases.length; j++) {
      const testCase = problem.test_cases[j];
      console.log(`[VALIDATION] Test case ${j + 1}/${problem.test_cases.length} (sample: ${testCase.is_sample})`);
      
      const hasTemplate = testCase.input_template !== undefined && testCase.input_template !== null;
      const inputData = typeof testCase.input_data === 'string' ? testCase.input_data : '';
      const expectedOutput =
        typeof testCase.expected_output === 'string' ? testCase.expected_output : '';

      // All test cases must use DSL
      if (!hasTemplate) {
        console.error(`[VALIDATION] Test case ${j + 1} missing input_template!`);
        throw new Error(
          `All test cases must use input_template DSL format. ` +
          `This test case (is_sample: ${testCase.is_sample}) is missing input_template.`
        );
      }

      console.log(`[VALIDATION] Test case ${j + 1} input_template:`, JSON.stringify(testCase.input_template, null, 2));

      // Validate template
      try {
        validateTestCaseInputTemplate(testCase.input_template);
        console.log(`[VALIDATION] Test case ${j + 1} template validation passed`);
      } catch (error) {
        console.error(`[VALIDATION] Test case ${j + 1} template validation FAILED:`, error);
        console.error(`[VALIDATION] Failed template:`, JSON.stringify(testCase.input_template, null, 2));
        throw new Error(
          `Test case has invalid input_template: ${error instanceof Error ? error.message : 'Unknown template error'}`
        );
      }

      if (!hasTemplate && inputData.trim().length === 0) {
        throw new Error('Test case missing input_data and input_template');
      }

      if (!hasTemplate && hasUnresolvedPlaceholder(inputData)) {
        throw new Error('Test case input_data contains unresolved placeholders');
      }

      if (!hasTemplate && expectedOutput.trim().length === 0) {
        throw new Error('Test case missing expected output');
      }

      if (!hasTemplate && hasUnresolvedPlaceholder(expectedOutput)) {
        throw new Error('Test case expected_output contains unresolved placeholders');
      }

      if (typeof testCase.is_sample !== 'boolean') {
        throw new Error('Test case missing is_sample flag');
      }
      if (typeof testCase.points !== 'number' || testCase.points < 1) {
        throw new Error('Test case has invalid points value');
      }
    }
  }
}

// Helper function to regenerate specific parts of a problem
export async function regenerateProblemSection(
  problem: GeneratedProblem,
  section: 'hints' | 'test_cases' | 'description'
): Promise<Partial<GeneratedProblem>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompts = {
    hints: `Given this coding problem, generate 3-4 progressive hints that guide students without giving away the solution.
    - Use LaTeX for math expressions (wrap in $).
    - CRITICAL: Escape bitwise operators (e.g., use '\\&' for AND, '\\ll' for shifts). Do NOT use unescaped '&'.:

Title: ${problem.title}
Description: ${problem.description}

Return only a JSON object: { "hints": ["hint1", "hint2", ...] }`,

    test_cases: `Generate 8-12 comprehensive test cases for this problem. Include edge cases, boundary conditions, and typical scenarios. Mark 2-3 as sample cases.

Title: ${problem.title}
Description: ${problem.description}

Return only a JSON object: { "test_cases": [{ "input_data": "...", "expected_output": "...", "is_sample": true/false, "points": 1-3 }] }`,

    description: `Rewrite this problem description to be clearer and more detailed. Use markdown formatting.
    - Use LaTeX for ALL math, numbers, variables, and complexities. Wrap them in $.
    - CRITICAL: Escape bitwise operators (Use '\\&' for AND, '\\ll' for shifts). Do NOT use unescaped '&', '#', or '%'.
    - **IMPORTANT**: Do NOT include an "Examples" section in the description. Examples must ONLY be provided in the 'examples' array field.

Current description: ${problem.description}

Return only a JSON object: { "description": "..." }`,
  };

  const result = await model.generateContent(prompts[section]);
  const text = result.response.text();
  
  // Clean markdown code blocks
  let cleanedText = text.trim();
  cleanedText = cleanedText.replace(/^```json\s*/i, '');
  cleanedText = cleanedText.replace(/^```\s*/, '');
  cleanedText = cleanedText.replace(/\s*```\s*$/g, '');
  cleanedText = cleanedText.trim();

  return JSON.parse(cleanedText);
}
