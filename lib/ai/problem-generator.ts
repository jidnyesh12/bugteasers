// AI Problem Generator using Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProblemGenerationRequest,
  ProblemGenerationResponse,
  GeneratedProblem,
} from './types';
import { SYSTEM_PROMPT, buildProblemGenerationPrompt } from './prompt-templates';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateProblems(
  request: ProblemGenerationRequest
): Promise<ProblemGenerationResponse> {
  try {
    // Use Gemini 1.5 Pro for best results
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
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
        model: 'gemini-1.5-pro',
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
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', text);
    throw new Error('AI returned invalid JSON format');
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

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
  
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  return JSON.parse(cleanedText);
}
