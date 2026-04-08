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

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsedResponse = parseGeneratedProblems(text);
    for (const problem of parsedResponse.problems) {
      for (let i = 0; i < problem.test_cases.length; i++) {
        const testCase = problem.test_cases[i];
            
        // Ensure input_data is empty when using template
        if (testCase.input_template) {
          testCase.input_data = '';
              
          // For SAMPLE test cases: preserve the LLM's expected_output from examples
          // For HIDDEN test cases: use __AUTO_EXPECTED_OUTPUT__ placeholder for auto-derivation
          if (testCase.is_sample) {
            const llmProvidedOutput = testCase.expected_output;
            const isValidOutput = llmProvidedOutput && 
                                   typeof llmProvidedOutput === 'string' &&
                                   llmProvidedOutput.trim().length > 0 &&
                                   !llmProvidedOutput.includes('__AUTO_');
                
            if (isValidOutput) {
              // Keep the LLM-provided expected_output (already set)
            } else {
              // Extract from examples array - sample test cases correspond to examples
              const exampleIndex = problem.test_cases.slice(0, i + 1).filter(tc => tc.is_sample).length - 1;
              const matchingExample = problem.examples[exampleIndex];
                  
              if (matchingExample && matchingExample.output) {
                testCase.expected_output = matchingExample.output;
              }
            }
          } else {
            // Hidden test case - use placeholder for auto-derivation
            testCase.expected_output = '__AUTO_EXPECTED_OUTPUT__';
          }
        }
      }
    }

    validateGeneratedProblems(parsedResponse.problems);

    return {
      problems: parsedResponse.problems,
      metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
      },
    };
  } catch (error) {
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

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    const parsedResponse = parseGeneratedProblems(text);
    for (const problem of parsedResponse.problems) {
      for (let i = 0; i < problem.test_cases.length; i++) {
        const testCase = problem.test_cases[i];
        if (testCase.input_template) {
          testCase.input_data = '';
              
          // For SAMPLE test cases: preserve the LLM's expected_output
          // For HIDDEN test cases: use __AUTO_EXPECTED_OUTPUT__ placeholder for auto-derivation
          if (testCase.is_sample) {
            const llmProvidedOutput = testCase.expected_output;
            const isValidOutput = llmProvidedOutput && 
                                   typeof llmProvidedOutput === 'string' &&
                                   llmProvidedOutput.trim().length > 0 &&
                                   !llmProvidedOutput.includes('__AUTO_');
                
            if (isValidOutput) {
              // Keep LLM-provided expected_output
            } else {
              // Extract from examples array - sample test cases correspond to examples
              const exampleIndex = problem.test_cases.slice(0, i + 1).filter(tc => tc.is_sample).length - 1;
              const matchingExample = problem.examples[exampleIndex];
                  
              if (matchingExample && matchingExample.output) {
                testCase.expected_output = matchingExample.output;
              }
            }
          } else {
            testCase.expected_output = '__AUTO_EXPECTED_OUTPUT__';
          }
        }
      }
    }

    validateGeneratedProblems(parsedResponse.problems);

    return {
      problems: parsedResponse.problems,
      metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
      },
    };
  } catch (error) {
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

  const parsed = parseSolutionRepairResponse(text);

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
      if (cleanedText.includes('"title"') && cleanedText.includes('"description"')) {
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
    throw new Error(`AI returned invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateGeneratedProblems(problems: GeneratedProblem[]): void {
  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error('No problems generated');
  }

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    
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

    // Validate test cases
    const sampleCases = problem.test_cases.filter((tc) => tc.is_sample);
    if (sampleCases.length === 0) {
      throw new Error('Problem must have at least one sample test case');
    }

    for (let j = 0; j < problem.test_cases.length; j++) {
      const testCase = problem.test_cases[j];
      const hasTemplate = testCase.input_template !== undefined && testCase.input_template !== null;
      const inputData = typeof testCase.input_data === 'string' ? testCase.input_data : '';
      const expectedOutput =
        typeof testCase.expected_output === 'string' ? testCase.expected_output : '';

      // All test cases must use DSL
      if (!hasTemplate) {
        throw new Error(
          `All test cases must use input_template DSL format. ` +
          `This test case (is_sample: ${testCase.is_sample}) is missing input_template.`
        );
      }

      try {
        validateTestCaseInputTemplate(testCase.input_template);
      } catch (error) {
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
