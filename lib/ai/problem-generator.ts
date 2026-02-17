// AI Problem Generator using Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProblemGenerationRequest,
  ProblemGenerationResponse,
  GeneratedProblem,
} from './types';
import { SYSTEM_PROMPT, buildProblemGenerationPrompt } from './prompt-templates';

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateProblems(
  request: ProblemGenerationRequest
): Promise<ProblemGenerationResponse> {
  try {
    // Use Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    });

    // Build the prompt
    const userPrompt = buildProblemGenerationPrompt(
      request.topic,
      request.difficulty,
      request.tags,
      request.constraints,
      request.numProblems || 1,
      request.languages || ['python', 'javascript']
    );

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const parsedResponse = parseGeneratedProblems(text);

    // Validate the response
    validateGeneratedProblems(parsedResponse.problems);

    return {
      problems: parsedResponse.problems,
      metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
      },
    };
  } catch (error) {
    console.error('Error generating problems:', error);
    throw new Error(
      `Failed to generate problems: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function parseGeneratedProblems(text: string): { problems: GeneratedProblem[] } {
  try {
    // Remove markdown code blocks if present - more robust approach
    let cleanedText = text.trim();
    
    // Remove opening code block markers
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/^```\s*/, '');
    
    // Remove closing code block markers
    cleanedText = cleanedText.replace(/\s*```\s*$/g, '');
    
    // Trim again after removing markers
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);
    
    // Validate structure
    if (!parsed || !parsed.problems || !Array.isArray(parsed.problems)) {
      throw new Error('Response missing "problems" array');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response. First 500 chars:', text.substring(0, 500));
    console.error('Parse error:', error);
    throw new Error(`AI returned invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateGeneratedProblems(problems: GeneratedProblem[]): void {
  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error('No problems generated');
  }

  for (const problem of problems) {
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

    // Validate test cases
    const sampleCases = problem.test_cases.filter((tc) => tc.is_sample);
    if (sampleCases.length === 0) {
      throw new Error('Problem must have at least one sample test case');
    }

    for (const testCase of problem.test_cases) {
      if (!testCase.input_data || !testCase.expected_output) {
        throw new Error('Test case missing input or output');
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
  section: 'hints' | 'test_cases' | 'description' | 'starter_code'
): Promise<Partial<GeneratedProblem>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompts = {
    hints: `Given this coding problem, generate 3-4 progressive hints that guide students without giving away the solution:

Title: ${problem.title}
Description: ${problem.description}

Return only a JSON object: { "hints": ["hint1", "hint2", ...] }`,

    test_cases: `Generate 8-12 comprehensive test cases for this problem. Include edge cases, boundary conditions, and typical scenarios. Mark 2-3 as sample cases.

Title: ${problem.title}
Description: ${problem.description}

Return only a JSON object: { "test_cases": [{ "input_data": "...", "expected_output": "...", "is_sample": true/false, "points": 1-3 }] }`,

    description: `Rewrite this problem description to be clearer and more detailed. Use markdown formatting.

Current description: ${problem.description}

Return only a JSON object: { "description": "..." }`,

    starter_code: `Generate starter code (function signatures) for this problem in Python and JavaScript:

Title: ${problem.title}
Description: ${problem.description}

Return only a JSON object: { "starter_code": { "python": "...", "javascript": "..." } }`,
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
