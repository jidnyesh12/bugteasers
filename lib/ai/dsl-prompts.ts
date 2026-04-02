/**
 * AI DSL Generator — Prompt Templates
 *
 * Prompts that ask Gemini to output a TemplateDSL JSON object rather than
 * generating raw test-case strings.  This decouples structural generation
 * (handled deterministically by the materializer) from oracle evaluation
 * (handled by the consensus oracle).
 */

export const DSL_SYSTEM_PROMPT = [
  "You are an expert at designing test-case templates for competitive programming problems.",
  "Your role is to produce a TemplateDSL JSON object that structurally describes the input space",
  "of a problem.  You do NOT generate expected outputs — those are produced by an independent oracle.",
  "",
  "A TemplateDSL object has this shape:",
  "{",
  '  "version": "1.0",',
  '  "problem_id": "<uuid or slug>",',
  '  "description": "Short description of what this template generates",',
  '  "variables": {',
  '    "<name>": <VariableSpec>',
  "  },",
  '  "constraints": ["<boolean expression>", ...],',
  '  "profiles": ["random", "edge_cases", "worst_case", "adversarial"],',
  '  "cases_per_profile": 2,',
  '  "format": "{n}\\n{arr}"',
  "}",
  "",
  "Supported variable types:",
  "",
  '  int:    { "type":"int", "min":<expr>, "max":<expr>, "distribution":"uniform"|"log_uniform"|"extreme_bias" }',
  '  float:  { "type":"float", "min":<expr>, "max":<expr>, "precision":<int> }',
  '  string: { "type":"string", "length_min":<expr>, "length_max":<expr>, "charset":"lowercase"|"uppercase"|"alpha"|"alphanum"|"printable"|"<custom>" }',
  '  array:  { "type":"array", "length":<expr>, "element":<int|float|string spec>, "sorted":<bool>, "distinct":<bool>, "sorted_dir":"asc"|"desc" }',
  '  matrix: { "type":"matrix", "rows":<expr>, "cols":<expr>, "element":<int|float spec> }',
  '  permutation: { "type":"permutation", "length":<expr>, "one_indexed":<bool> }',
  '  graph:  { "type":"graph", "nodes":<expr>, "directed":<bool>, "weighted":<bool>, "connected":<bool>, "acyclic":<bool>, "weight_min":<expr>, "weight_max":<expr> }',
  '  tree:   { "type":"tree", "nodes":<expr>, "shape":"random"|"path"|"star"|"caterpillar"|"balanced", "weighted":<bool>, "weight_min":<expr>, "weight_max":<expr>, "rooted":<bool> }',
  "",
  "NumericExpr can be:",
  '  - a literal number:  100000',
  '  - a variable ref:    "$n"',
  '  - simple arithmetic: "$n - 1", "2 * $n"',
  "",
  "Constraints are boolean expressions:",
  '  "$k <= $n", "$n >= 1 && $n <= 100000", "len($arr) == $n"',
  "",
  "Format string uses {var_name} placeholders:",
  '  "{n}\\n{arr}" means: print n on line 1, then space-separated array on line 2',
  "",
  "CRITICAL RULES:",
  "- Variable names: [a-zA-Z_][a-zA-Z0-9_]*",
  "- All NumericExpr references must point to an earlier-declared variable",
  "- Profiles: choose from random, edge_cases, worst_case, adversarial",
  "- cases_per_profile: 2 to 5 is typical",
  "- Output ONLY valid JSON — no markdown fences, no extra text",
].join("\n");

export function buildDslGenerationPrompt(
  problemTitle: string,
  problemDescription: string,
  difficulty: "easy" | "medium" | "hard"
): string {
  const lines = [
    `Generate a TemplateDSL JSON object for the following competitive programming problem:`,
    "",
    `**Title**: ${problemTitle}`,
    `**Difficulty**: ${difficulty}`,
    "",
    `**Description**:`,
    problemDescription,
    "",
    "Requirements:",
    "- Declare all input variables with accurate types and bounds from the problem constraints",
    "- Include cross-variable constraints (e.g. k <= n)",
    "- Choose appropriate profiles based on difficulty:",
    "  - easy: [\"random\", \"edge_cases\"]",
    "  - medium: [\"random\", \"edge_cases\", \"worst_case\"]",
    "  - hard: [\"random\", \"edge_cases\", \"worst_case\", \"adversarial\"]",
    "- Set cases_per_profile to 2 for easy, 3 for medium, 4 for hard",
    "- Write a format string that matches the problem's input specification",
    "",
    "Return ONLY the JSON object, nothing else.",
  ];

  return lines.join("\n");
}
