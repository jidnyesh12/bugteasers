// Prompt templates for problem generation

export const SYSTEM_PROMPT = `You are an expert coding problem creator for an educational platform. Your role is to generate high-quality, pedagogically sound coding problems that help students learn programming concepts.

Guidelines:
- Problems should be clear, unambiguous, and well-structured
- Include detailed explanations and examples
- Generate progressive hints that guide without giving away the solution
- Create comprehensive test cases (both sample and hidden)
- Ensure test cases cover edge cases, boundary conditions, and typical scenarios
- Provide starter code that gives students a clear starting point
- Write reference solutions that are clean and well-commented
- Use markdown formatting for descriptions`;

export function buildProblemGenerationPrompt(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  tags: string[] = [],
  constraints?: string,
  numProblems: number = 1,
  languages: string[] = ['python', 'javascript']
): string {
  const difficultyGuidelines = {
    easy: 'Suitable for beginners. Focus on basic concepts, simple logic, and straightforward implementations. Time complexity: O(n) or better.',
    medium: 'Intermediate level. Requires understanding of data structures, algorithms, and problem-solving strategies. Time complexity: O(n log n) or better.',
    hard: 'Advanced level. Complex algorithms, optimization techniques, or multiple concepts combined. May require dynamic programming, graph algorithms, or advanced data structures.'
  };

  return `Generate ${numProblems} coding problem${numProblems > 1 ? 's' : ''} with the following specifications:

**Topic**: ${topic}
**Difficulty**: ${difficulty}
**Difficulty Guidelines**: ${difficultyGuidelines[difficulty]}
${tags.length > 0 ? `**Tags**: ${tags.join(', ')}` : ''}
${constraints ? `**Additional Constraints**: ${constraints}` : ''}
**Programming Languages**: ${languages.join(', ')}

For each problem, provide:

1. **Title**: Concise and descriptive (3-6 words)

2. **Description**: 
   - Clear problem statement in markdown format
   - Input/output format specifications
   - Constraints and limitations
   - Use code blocks for examples

3. **Examples**: 
   - Provide 2-3 sample input/output pairs
   - Include explanations for each example
   - Show edge cases if relevant

4. **Hints**: 
   - Generate 3-4 progressive hints
   - Start with conceptual guidance
   - Progress to more specific algorithmic hints
   - Never give away the complete solution

5. **Test Cases**:
   - Generate 8-12 test cases total
   - Mark 2-3 as sample cases (visible to students)
   - Include edge cases: empty input, single element, maximum constraints
   - Include typical cases and boundary conditions
   - Assign points based on difficulty (1-3 points per case)

6. **Starter Code**:
   - Provide function signatures for: ${languages.join(', ')}
   - Include parameter names and return type hints
   - Add brief docstring/comment explaining expected behavior

7. **Solution Code**:
   - Provide a complete, well-commented reference solution in Python
   - Use clean, readable code with proper variable names
   - Include time and space complexity analysis in comments

8. **Metadata**:
   - Time limit: ${difficulty === 'easy' ? '1000-2000' : difficulty === 'medium' ? '2000-3000' : '3000-5000'}ms
   - Memory limit: 256MB
   - Suggested tags based on concepts used

Return the response as a valid JSON object matching this structure:
{
  "problems": [
    {
      "title": "string",
      "description": "string (markdown)",
      "difficulty": "${difficulty}",
      "tags": ["array of strings"],
      "constraints": "string",
      "examples": [
        {
          "input": "string",
          "output": "string",
          "explanation": "string"
        }
      ],
      "hints": ["array of strings"],
      "time_limit": number,
      "memory_limit": 256,
      "starter_code": {
        ${languages.map(lang => `"${lang}": "string"`).join(',\n        ')}
      },
      "solution_code": "string",
      "test_cases": [
        {
          "input_data": "string",
          "expected_output": "string",
          "is_sample": boolean,
          "points": number
        }
      ]
    }
  ]
}`;
}

export const EXAMPLE_PROBLEM = `
Example of a well-structured problem:

**Title**: Two Sum

**Description**:
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Input Format**:
- First line: integer \`n\` (length of array)
- Second line: \`n\` space-separated integers
- Third line: integer \`target\`

**Output Format**:
- Two space-separated integers representing the indices (0-indexed)

**Constraints**:
- 2 ≤ n ≤ 10^4
- -10^9 ≤ nums[i] ≤ 10^9
- -10^9 ≤ target ≤ 10^9

**Examples**:
Input: [2, 7, 11, 15], target = 9
Output: 0 1
Explanation: nums[0] + nums[1] = 2 + 7 = 9

**Hints**:
1. Think about what data structure allows O(1) lookup time
2. Consider storing elements you've seen along with their indices
3. For each element, check if (target - element) exists in your data structure
`;
