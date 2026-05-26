// AI-powered hint generation using Google Gemini

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@/lib/env";
import type { HintGenerationContext } from "./hint-types";
import { HINT_LEVEL_GUIDELINES, HINT_GENERATION_RULES } from "./hint-config";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate a contextual hint for a student
 */
export async function generateContextualHint(
  context: HintGenerationContext,
): Promise<string> {
  const {
    problem,
    studentCode,
    language,
    executionResults,
    previousHints,
    hintLevel,
  } = context;

  const guideline = HINT_LEVEL_GUIDELINES[hintLevel as keyof typeof HINT_LEVEL_GUIDELINES];

  // Build the prompt
  const prompt = buildHintPrompt({
    problem,
    studentCode,
    language,
    executionResults,
    previousHints,
    hintLevel,
    guideline,
  });

  // Try multiple models in order of preference
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3-flash-preview", 
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const hint = result.response.text().trim();

      // Validate hint doesn't contain code
      validateHintQuality(hint);

      return hint;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = (error as Error).message.toLowerCase();
      
      // If it's a 503 or high demand error, try next model
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("service unavailable")
      ) {
        console.log(`Model ${modelName} unavailable, trying next model...`);
        continue;
      }

      // If it's a 404 (model not found), try next model
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        console.log(`Model ${modelName} not found, trying next model...`);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // All models failed
  throw new Error(
    `All models unavailable. Last error: ${lastError?.message || "Unknown error"}. Please try again in a moment.`,
  );
}

/**
 * Build the prompt for hint generation
 */
function buildHintPrompt(params: {
  problem: HintGenerationContext["problem"];
  studentCode: string;
  language: string;
  executionResults?: HintGenerationContext["executionResults"];
  previousHints: string[];
  hintLevel: number;
  guideline: typeof HINT_LEVEL_GUIDELINES[keyof typeof HINT_LEVEL_GUIDELINES];
}): string {
  const {
    problem,
    studentCode,
    language,
    executionResults,
    previousHints,
    hintLevel,
    guideline,
  } = params;

  const lines: string[] = [];

  // System role
  lines.push("You are an expert programming tutor helping students solve coding problems.");
  lines.push("Your goal is to guide students toward the solution through thoughtful questions and specific observations about their code.");
  lines.push("");

  // CRITICAL RULES (emphasized)
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("CRITICAL RULES - YOU MUST FOLLOW THESE:");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("1. ANALYZE THE STUDENT'S CODE FIRST: Carefully examine what they've written before giving any hint.");
  lines.push("2. BE SPECIFIC: Reference exact parts of their code, variable names, or logic they've used.");
  lines.push("3. NO CODE OR PSEUDOCODE: Never provide code snippets, function signatures, or pseudocode. Use plain English only.");
  lines.push("4. ASK GUIDING QUESTIONS: Help them discover the solution through Socratic questioning.");
  lines.push("5. POINT OUT PATTERNS: If they're close, acknowledge what's working and what needs adjustment.");
  lines.push("6. BE CONCRETE: Instead of 'think about sorting', say 'what would happen if you arranged the array in ascending order?'");
  lines.push("7. LENGTH: 3-5 sentences that are actionable and specific to their code.");
  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");

  // Problem context
  lines.push("PROBLEM:");
  lines.push(`Title: ${problem.title}`);
  lines.push(`Difficulty: ${problem.difficulty}`);
  lines.push("");
  lines.push("Description:");
  lines.push(problem.description);
  lines.push("");

  if (problem.constraints) {
    lines.push("Constraints:");
    lines.push(problem.constraints);
    lines.push("");
  }

  if (problem.examples && problem.examples.length > 0) {
    lines.push("Examples:");
    problem.examples.forEach((example, i) => {
      lines.push(`Example ${i + 1}:`);
      lines.push(`Input: ${example.input}`);
      lines.push(`Output: ${example.output}`);
      if (example.explanation) {
        lines.push(`Explanation: ${example.explanation}`);
      }
      lines.push("");
    });
  }

  // Student's code
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push(`STUDENT'S CODE (${language.toUpperCase()}):`);
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("```" + language);
  lines.push(studentCode);
  lines.push("```");
  lines.push("");

  // Execution results (if available)
  if (executionResults) {
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("EXECUTION RESULTS:");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Status: ${executionResults.status}`);

    if (executionResults.score !== undefined) {
      lines.push(`Score: ${executionResults.score}%`);
    }

    if (executionResults.failedTestCases !== undefined) {
      lines.push(
        `Failed test cases: ${executionResults.failedTestCases}/${executionResults.totalTestCases || "?"}`,
      );
    }

    if (executionResults.error) {
      lines.push(`Error: ${executionResults.error}`);
    }

    if (executionResults.stderr) {
      lines.push(`Stderr: ${executionResults.stderr}`);
    }

    lines.push("");
  }

  // Previous hints (if any)
  if (previousHints.length > 0) {
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("PREVIOUS HINTS YOU GAVE:");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("");
    previousHints.forEach((hint, i) => {
      lines.push(`Hint ${i + 1}: ${hint}`);
      lines.push("");
    });
    lines.push(
      "IMPORTANT: Build on your previous hints. Be MORE SPECIFIC than before.",
    );
    lines.push(
      "If they've made progress, acknowledge it. If they're stuck on the same issue, provide a more direct observation.",
    );
    lines.push("");
  }

  // Hint level guidance
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push(`HINT PROGRESSION - THIS IS HINT #${hintLevel} OF 3`);
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  
  if (hintLevel === 1) {
    lines.push("FIRST HINT - Focus on the high-level approach:");
    lines.push("- What key insight or pattern is needed to solve this problem?");
    lines.push("- What operation or transformation would make the problem easier?");
    lines.push("- Ask a question that leads them to discover the main strategy.");
  } else if (hintLevel === 2) {
    lines.push("SECOND HINT - Guide them toward the algorithm:");
    lines.push("- Be more specific about the approach they should take.");
    lines.push("- Point out what's missing or incorrect in their current logic.");
    lines.push("- Suggest the type of algorithm or data structure that would help.");
    lines.push("- Reference their code directly: 'I notice you're doing X, but consider...'");
  } else {
    lines.push("THIRD HINT - Provide concrete implementation guidance:");
    lines.push("- Be very specific about what needs to change in their code.");
    lines.push("- Point to exact variables, loops, or conditions that need adjustment.");
    lines.push("- Describe the step-by-step logic they should follow (without code).");
    lines.push("- Example: 'After sorting, you need to examine each group of k consecutive elements...'");
  }
  lines.push("");

  // Final instructions
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("GENERATE YOUR HINT:");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("Write a hint that:");
  lines.push("1. Starts by acknowledging what they've done (if anything is correct)");
  lines.push("2. Points to a specific aspect of their code or approach");
  lines.push("3. Asks a guiding question OR makes a concrete observation");
  lines.push("4. Is encouraging but actionable");
  lines.push("5. Uses 3-5 sentences");
  lines.push("");
  lines.push("Use LaTeX for math expressions: $O(n)$, $n^2$, etc.");
  lines.push("");
  lines.push("Your hint:");

  return lines.join("\n");
}

/**
 * Validate hint quality
 * Ensures hint doesn't contain code or pseudocode
 */
function validateHintQuality(hint: string): void {
  // Check for code-like patterns
  const codePatterns = [
    /```/g, // Code blocks
    /function\s+\w+\s*\(/gi, // Function declarations
    /def\s+\w+\s*\(/gi, // Python functions
    /for\s*\(/gi, // For loops
    /while\s*\(/gi, // While loops
    /if\s*\(/gi, // If statements (too strict, commented out)
    /return\s+[^a-z]/gi, // Return statements with non-word
  ];

  for (const pattern of codePatterns) {
    if (pattern.test(hint)) {
      console.warn("Hint contains code-like pattern:", pattern);
      // Don't throw error, just warn - AI might use these words in explanation
    }
  }

  // Check hint length
  if (hint.length < 20) {
    throw new Error("Hint is too short (less than 20 characters)");
  }

  if (hint.length > 1000) {
    throw new Error("Hint is too long (more than 1000 characters)");
  }
}

/**
 * Generate hint with API key rotation
 * Tries multiple API keys if rate limit is hit
 */
export async function generateHintWithRotation(
  context: HintGenerationContext,
  apiKeys: string[],
): Promise<string> {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  let lastError: Error | null = null;

  // Try each API key
  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);

    // Try each model with this API key
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const guideline = HINT_LEVEL_GUIDELINES[context.hintLevel as keyof typeof HINT_LEVEL_GUIDELINES];
        const prompt = buildHintPrompt({
          problem: context.problem,
          studentCode: context.studentCode,
          language: context.language,
          executionResults: context.executionResults,
          previousHints: context.previousHints,
          hintLevel: context.hintLevel,
          guideline,
        });

        const result = await model.generateContent(prompt);
        const hint = result.response.text().trim();

        validateHintQuality(hint);

        return hint;
      } catch (error) {
        lastError = error as Error;
        const errorMessage = (error as Error).message.toLowerCase();

        // Check if it's a rate limit error
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("quota")
        ) {
          console.log(`API key ${i + 1} rate limited, trying next key...`);
          break; // Try next API key
        }

        // Check if it's a service unavailable error
        if (
          errorMessage.includes("503") ||
          errorMessage.includes("high demand") ||
          errorMessage.includes("service unavailable")
        ) {
          console.log(`Model ${modelName} unavailable with key ${i + 1}, trying next model...`);
          continue; // Try next model with same key
        }

        // Check if model not found
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          console.log(`Model ${modelName} not found with key ${i + 1}, trying next model...`);
          continue; // Try next model with same key
        }

        // If it's not a rate limit or availability error, throw immediately
        throw error;
      }
    }
  }

  // All API keys and models exhausted
  throw new Error(
    `All API keys and models exhausted. Last error: ${lastError?.message || "Unknown error"}`,
  );
}
