/**
 * Template DSL — Deterministic Materializer
 *
 * Converts a validated TemplateDSL into concrete test-case inputs.
 * All randomness is driven by a seeded Mulberry32 PRNG so that every
 * (template_hash, seed) pair deterministically produces the same input —
 * the *replay certificate* that makes tests reproducible.
 */

import {
  TemplateDSL,
  VariableSpec,
  IntSpec,
  FloatSpec,
  StringSpec,
  ArraySpec,
  MatrixSpec,
  PermutationSpec,
  GraphSpec,
  TreeSpec,
  MaterializedTestCase,
  MaterializedValue,
  GenerationProfile,
  NumericExpr,
} from "./types";
import { GeneratorError, UnsatConstraintsError, FormatError } from "./errors";

// ---------------------------------------------------------------------------
// Mulberry32 — fast, high-quality, seedable 32-bit PRNG
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    // Avalanche mixing — MurmurHash3-style finalizer steps
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Profile configuration
// ---------------------------------------------------------------------------

interface ProfileConfig {
  preferBoundary: boolean;
  preferMax: boolean;
  adversarial: boolean;
}

function profileConfig(profile: GenerationProfile): ProfileConfig {
  switch (profile) {
    case "random":
      return { preferBoundary: false, preferMax: false, adversarial: false };
    case "edge_cases":
      return { preferBoundary: true, preferMax: false, adversarial: false };
    case "worst_case":
      return { preferBoundary: false, preferMax: true, adversarial: false };
    case "adversarial":
      return { preferBoundary: false, preferMax: true, adversarial: true };
  }
}

// ---------------------------------------------------------------------------
// Expression evaluator
// ---------------------------------------------------------------------------

/**
 * Safe recursive-descent arithmetic evaluator.
 * Supports: integer/decimal literals, +, -, *, /, unary minus, parentheses.
 * No eval / new Function — purely structural parsing.
 */
function safeEvalNumber(input: string): number {
  const s = input.trim();
  const ctx2 = { pos: 0, src: s };

  function peek(): string { return ctx2.src[ctx2.pos] ?? ""; }
  function consume(): string { return ctx2.src[ctx2.pos++] ?? ""; }
  function skipWs(): void { while (ctx2.pos < ctx2.src.length && /\s/.test(ctx2.src[ctx2.pos])) ctx2.pos++; }

  function parseExpr(): number { return parseAddSub(); }

  function parseAddSub(): number {
    let left = parseMulDiv();
    skipWs();
    while (peek() === "+" || peek() === "-") {
      const op = consume();
      skipWs();
      const right = parseMulDiv();
      left = op === "+" ? left + right : left - right;
      skipWs();
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parseUnary();
    skipWs();
    while (peek() === "*" || peek() === "/") {
      const op = consume();
      skipWs();
      const right = parseUnary();
      if (op === "/" && right === 0) throw new GeneratorError("Division by zero in expression");
      left = op === "*" ? left * right : left / right;
      skipWs();
    }
    return left;
  }

  function parseUnary(): number {
    skipWs();
    if (peek() === "-") { consume(); return -parseUnary(); }
    if (peek() === "+") { consume(); return parseUnary(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    skipWs();
    if (peek() === "(") {
      consume(); // '('
      const val = parseExpr();
      skipWs();
      if (peek() !== ")") throw new GeneratorError("Expected ')' in expression");
      consume();
      return val;
    }
    // Number literal
    const start = ctx2.pos;
    if (!/[\d.]/.test(peek())) {
      throw new GeneratorError(`Unexpected token '${peek()}' in expression`);
    }
    while (ctx2.pos < ctx2.src.length && /[\d.]/.test(ctx2.src[ctx2.pos])) ctx2.pos++;
    const numStr = ctx2.src.slice(start, ctx2.pos);
    const n = Number(numStr);
    if (isNaN(n)) throw new GeneratorError(`Invalid number literal: ${numStr}`);
    return n;
  }

  const result = parseExpr();
  skipWs();
  if (ctx2.pos !== ctx2.src.length) {
    throw new GeneratorError(
      `Unexpected characters at position ${ctx2.pos} in expression "${s}"`
    );
  }
  return result;
}

/**
 * Evaluate a NumericExpr against a resolved variable context.
 * Supports:
 *   - plain numbers
 *   - "$var" references
 *   - simple arithmetic: "$n - 1", "2 * $n", "$n + $m", etc.
 */
function evalExpr(expr: NumericExpr, ctx: MaterializedValue): number {
  if (typeof expr === "number") return expr;

  // Replace all $var references with their numeric values
  const resolved = expr.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, name) => {
    const v = ctx[name];
    if (v === undefined) {
      throw new GeneratorError(
        `Expression "${expr}" references undefined variable "$${name}"`
      );
    }
    if (typeof v !== "number") {
      throw new GeneratorError(
        `Expression "${expr}" references "$${name}" which is not numeric (got ${typeof v})`
      );
    }
    return String(v);
  });

  // Only allow safe arithmetic characters after resolution
  if (!/^[\d\s+\-*/().]+$/.test(resolved)) {
    throw new GeneratorError(
      `Expression "${expr}" resolves to unsafe string "${resolved}"`
    );
  }

  return safeEvalNumber(resolved);
}

// ---------------------------------------------------------------------------
// Constraint evaluator
// ---------------------------------------------------------------------------

/**
 * Resolve $var references in a constraint expression, substituting numeric
 * values or array lengths (via a restricted set of aggregate functions).
 * Returns a boolean — without using eval or new Function.
 *
 * Supported patterns (after variable substitution):
 *   number op number         e.g. "5 <= 100"
 *   len($arr) op number      e.g. "len($arr) == $n"  (after substitution: "5 == 5")
 *   expr && expr, expr || expr, !expr
 *
 * Where op ∈ { <, <=, >, >=, ==, != }
 */
function evalConstraint(expr: string, ctx: MaterializedValue): boolean {
  // --- aggregate function resolution BEFORE variable substitution ---
  // len($arr), sum($arr), min($arr), max($arr) → resolved numeric strings
  const withAggregates = expr.replace(
    /(len|sum|min|max)\(\$([a-zA-Z_][a-zA-Z0-9_]*)\)/g,
    (_m, fn: string, name: string) => {
      const v = ctx[name];
      if (!Array.isArray(v)) return "0";
      const nums = (v as unknown[]).map(Number).filter((x) => !isNaN(x));
      switch (fn) {
        case "len": return String(nums.length);
        case "sum": return String(nums.reduce((a, b) => a + b, 0));
        case "min": return nums.length ? String(Math.min(...nums)) : "0";
        case "max": return nums.length ? String(Math.max(...nums)) : "0";
        default:    return "0";
      }
    }
  );

  // --- substitute remaining $var references with numeric values ---
  const resolved = withAggregates.replace(
    /\$([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (_m, name) => {
      const v = ctx[name];
      if (v === undefined) return "0";
      if (typeof v === "number") return String(v);
      if (Array.isArray(v)) return String((v as unknown[]).length);
      return "0";
    }
  );

  return parseConstraintExpr(resolved);
}

/**
 * Parse and evaluate a boolean constraint expression composed of:
 *   - numeric comparisons: number op number
 *   - logical &&, ||, !
 *   - parentheses
 */
function parseConstraintExpr(src: string): boolean {
  const state = { pos: 0, src: src.trim() };

  function peek(): string { return state.src[state.pos] ?? ""; }
  function skipWs(): void { while (state.pos < state.src.length && /\s/.test(state.src[state.pos])) state.pos++; }

  function parseOr(): boolean {
    let left = parseAnd();
    skipWs();
    while (state.pos < state.src.length && state.src.startsWith("||", state.pos)) {
      state.pos += 2;
      skipWs();
      const right = parseAnd();
      left = left || right;
      skipWs();
    }
    return left;
  }

  function parseAnd(): boolean {
    let left = parseNot();
    skipWs();
    while (state.pos < state.src.length && state.src.startsWith("&&", state.pos)) {
      state.pos += 2;
      skipWs();
      const right = parseNot();
      left = left && right;
      skipWs();
    }
    return left;
  }

  function parseNot(): boolean {
    skipWs();
    if (peek() === "!") {
      state.pos++;
      return !parseNot();
    }
    return parsePrimary();
  }

  function parsePrimary(): boolean {
    skipWs();
    if (peek() === "(") {
      state.pos++; // '('
      const val = parseOr();
      skipWs();
      if (peek() === ")") state.pos++;
      return val;
    }

    // Read left number
    const leftNum = readNumber();
    skipWs();

    // Read operator
    const op = readComparisonOp();
    if (!op) return leftNum !== 0;

    skipWs();
    const rightNum = readNumber();

    switch (op) {
      case "<":  return leftNum <  rightNum;
      case "<=": return leftNum <= rightNum;
      case ">":  return leftNum >  rightNum;
      case ">=": return leftNum >= rightNum;
      case "==": return leftNum === rightNum;
      case "!=": return leftNum !== rightNum;
      default:   return false;
    }
  }

  function readNumber(): number {
    skipWs();
    const start = state.pos;
    if (peek() === "-") state.pos++;
    while (state.pos < state.src.length && /[\d.]/.test(state.src[state.pos])) state.pos++;
    const numStr = state.src.slice(start, state.pos);
    return Number(numStr) || 0;
  }

  function readComparisonOp(): string | null {
    const twoChar = state.src.slice(state.pos, state.pos + 2);
    if (["<=", ">=", "==", "!="].includes(twoChar)) {
      state.pos += 2;
      return twoChar;
    }
    const oneChar = peek();
    if (oneChar === "<" || oneChar === ">") {
      state.pos++;
      return oneChar;
    }
    return null;
  }

  try {
    const result = parseOr();
    return result;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Type-specific generators
// ---------------------------------------------------------------------------

function genInt(
  spec: IntSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): number {
  const lo = Math.ceil(evalExpr(spec.min, ctx));
  const hi = Math.floor(evalExpr(spec.max, ctx));
  if (lo > hi) {
    throw new UnsatConstraintsError(
      `int variable has empty range [${lo}, ${hi}]`,
      [`min(${spec.min}) > max(${spec.max})`]
    );
  }

  if (cfg.preferBoundary) {
    const boundary = [lo, hi, 0, 1, -1].filter((v) => v >= lo && v <= hi);
    return boundary[Math.floor(rng() * boundary.length)];
  }
  if (cfg.preferMax) return hi;

  if (spec.distribution === "log_uniform" && lo > 0) {
    // Sample uniformly in log space
    const logLo = Math.log(lo);
    const logHi = Math.log(hi);
    return Math.min(hi, Math.max(lo, Math.round(Math.exp(logLo + rng() * (logHi - logLo)))));
  }

  if (spec.distribution === "extreme_bias") {
    // 30% chance of boundary, rest uniform
    if (rng() < 0.3) return rng() < 0.5 ? lo : hi;
  }

  return lo + Math.floor(rng() * (hi - lo + 1));
}

function genFloat(
  spec: FloatSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): number {
  const lo = evalExpr(spec.min, ctx);
  const hi = evalExpr(spec.max, ctx);
  const precision = spec.precision ?? 6;
  if (cfg.preferMax) return parseFloat(hi.toFixed(precision));
  return parseFloat((lo + rng() * (hi - lo)).toFixed(precision));
}

const CHARSETS: Record<string, string> = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alpha: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanum:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  printable:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?",
};

function genString(
  spec: StringSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): string {
  const minLen = Math.ceil(evalExpr(spec.length_min, ctx));
  const maxLen = Math.floor(evalExpr(spec.length_max, ctx));
  const charset = CHARSETS[spec.charset ?? "lowercase"] ?? spec.charset ?? "abcdefghijklmnopqrstuvwxyz";
  const len = cfg.preferBoundary
    ? rng() < 0.5
      ? minLen
      : maxLen
    : cfg.preferMax
    ? maxLen
    : minLen + Math.floor(rng() * (maxLen - minLen + 1));

  let s = "";
  for (let i = 0; i < len; i++) {
    s += charset[Math.floor(rng() * charset.length)];
  }
  return s;
}

function genArray(
  spec: ArraySpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): unknown[] {
  const len = Math.round(evalExpr(spec.length, ctx));
  const arr: unknown[] = [];

  const used = new Set<unknown>();
  const MAX_DISTINCT_ATTEMPTS = len * 10 + 50;

  for (let i = 0; i < len; ) {
    let val: unknown;
    if (spec.element.type === "int") {
      val = genInt(spec.element, ctx, rng, cfg);
    } else if (spec.element.type === "float") {
      val = genFloat(spec.element, ctx, rng, cfg);
    } else {
      val = genString(spec.element as StringSpec, ctx, rng, cfg);
    }

    if (spec.distinct) {
      let attempts = 0;
      while (used.has(val) && attempts < MAX_DISTINCT_ATTEMPTS) {
        if (spec.element.type === "int") val = genInt(spec.element, ctx, rng, cfg);
        else if (spec.element.type === "float") val = genFloat(spec.element, ctx, rng, cfg);
        else val = genString(spec.element as StringSpec, ctx, rng, cfg);
        attempts++;
      }
      if (used.has(val)) {
        throw new UnsatConstraintsError(
          `Cannot generate ${len} distinct values for array`,
          ["distinct array cannot be satisfied"]
        );
      }
      used.add(val);
    }

    arr.push(val);
    i++;
  }

  if (spec.sorted) {
    if (typeof arr[0] === "number") {
      (arr as number[]).sort((a, b) => a - b);
    } else {
      (arr as string[]).sort();
    }
    if (spec.sorted_dir === "desc") arr.reverse();
  }

  return arr;
}

function genMatrix(
  spec: MatrixSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): unknown[][] {
  const rows = Math.round(evalExpr(spec.rows, ctx));
  const cols = Math.round(evalExpr(spec.cols, ctx));
  const matrix: unknown[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: unknown[] = [];
    for (let c = 0; c < cols; c++) {
      if (spec.element.type === "int") {
        row.push(genInt(spec.element as IntSpec, ctx, rng, cfg));
      } else {
        row.push(genFloat(spec.element as FloatSpec, ctx, rng, cfg));
      }
    }
    matrix.push(row);
  }
  return matrix;
}

function genPermutation(
  spec: PermutationSpec,
  ctx: MaterializedValue,
  rng: () => number
): number[] {
  const len = Math.round(evalExpr(spec.length, ctx));
  const base = spec.one_indexed ? 1 : 0;
  const arr = Array.from({ length: len }, (_, i) => i + base);
  // Fisher-Yates shuffle
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface Edge {
  u: number;
  v: number;
  w?: number;
}

function genGraph(
  spec: GraphSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): { nodes: number; edges: Edge[] } {
  const n = Math.round(evalExpr(spec.nodes, ctx));
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  function edgeKey(u: number, v: number) {
    return spec.directed ? `${u}:${v}` : `${Math.min(u, v)}:${Math.max(u, v)}`;
  }

  function genWeight(): number | undefined {
    if (!spec.weighted) return undefined;
    const wlo = spec.weight_min !== undefined ? evalExpr(spec.weight_min, ctx) : 1;
    const whi = spec.weight_max !== undefined ? evalExpr(spec.weight_max, ctx) : 1000;
    return cfg.preferMax ? whi : wlo + Math.floor(rng() * (whi - wlo + 1));
  }

  function addEdge(u: number, v: number) {
    const key = edgeKey(u, v);
    if (!spec.multi_edges && edgeSet.has(key)) return false;
    if (!spec.self_loops && u === v) return false;
    edgeSet.add(key);
    edges.push({ u, v, w: genWeight() });
    return true;
  }

  // Ensure connectivity via spanning tree (Prüfer sequence or simple path)
  if (spec.connected && n > 0) {
    const perm = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 1; i < n; i++) {
      const parent = perm[Math.floor(rng() * i)];
      const child = perm[i];
      addEdge(parent, child);
      if (!spec.directed) addEdge(child, parent);
    }
  }

  // Additional random edges (up to 2n)
  const targetExtra = cfg.preferMax ? Math.min(n * 2, n * (n - 1)) : n;
  let attempts = 0;
  while (edges.length < targetExtra && attempts < targetExtra * 4) {
    const u = 1 + Math.floor(rng() * n);
    const v = 1 + Math.floor(rng() * n);
    addEdge(u, v);
    attempts++;
  }

  return { nodes: n, edges };
}

function genTree(
  spec: TreeSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): { nodes: number; edges: Edge[] } {
  const n = Math.round(evalExpr(spec.nodes, ctx));
  const edges: Edge[] = [];

  function genWeight(): number | undefined {
    if (!spec.weighted) return undefined;
    const wlo = spec.weight_min !== undefined ? evalExpr(spec.weight_min, ctx) : 1;
    const whi = spec.weight_max !== undefined ? evalExpr(spec.weight_max, ctx) : 1000;
    return cfg.preferMax ? whi : wlo + Math.floor(rng() * (whi - wlo + 1));
  }

  const shape = spec.shape ?? "random";

  if (shape === "path") {
    for (let i = 1; i < n; i++) {
      edges.push({ u: i, v: i + 1, w: genWeight() });
    }
  } else if (shape === "star") {
    for (let i = 2; i <= n; i++) {
      edges.push({ u: 1, v: i, w: genWeight() });
    }
  } else if (shape === "balanced") {
    // Perfect binary tree
    for (let i = 2; i <= n; i++) {
      edges.push({ u: Math.floor(i / 2), v: i, w: genWeight() });
    }
  } else {
    // Random tree via Prüfer sequence
    if (n === 1) return { nodes: 1, edges: [] };
    const degree = new Array<number>(n + 1).fill(1);
    const seq: number[] = [];
    for (let i = 0; i < n - 2; i++) {
      seq.push(1 + Math.floor(rng() * n));
      degree[seq[seq.length - 1]]++;
    }
    for (const v of seq) {
      for (let u = 1; u <= n; u++) {
        if (degree[u] === 1) {
          edges.push({ u, v, w: genWeight() });
          degree[u]--;
          degree[v]--;
          break;
        }
      }
    }
    const remaining = [];
    for (let u = 1; u <= n; u++) {
      if (degree[u] === 1) remaining.push(u);
    }
    if (remaining.length === 2) {
      edges.push({ u: remaining[0], v: remaining[1], w: genWeight() });
    }
  }

  if (cfg.adversarial && shape === "random" && n > 1) {
    // Adversarial: long path (stresses DFS stack)
    edges.length = 0;
    for (let i = 1; i < n; i++) {
      edges.push({ u: i, v: i + 1, w: genWeight() });
    }
  }

  return { nodes: n, edges };
}

// ---------------------------------------------------------------------------
// Variable materializer
// ---------------------------------------------------------------------------

function materializeVariable(
  name: string,
  spec: VariableSpec,
  ctx: MaterializedValue,
  rng: () => number,
  cfg: ProfileConfig
): unknown {
  switch (spec.type) {
    case "int":
      return genInt(spec, ctx, rng, cfg);
    case "float":
      return genFloat(spec, ctx, rng, cfg);
    case "string":
      return genString(spec, ctx, rng, cfg);
    case "array":
      return genArray(spec, ctx, rng, cfg);
    case "matrix":
      return genMatrix(spec, ctx, rng, cfg);
    case "permutation":
      return genPermutation(spec, ctx, rng);
    case "graph":
      return genGraph(spec, ctx, rng, cfg);
    case "tree":
      return genTree(spec, ctx, rng, cfg);
    default:
      throw new GeneratorError(`Unknown variable type for "${name}"`);
  }
}

// ---------------------------------------------------------------------------
// Format renderer
// ---------------------------------------------------------------------------

function renderGraph(data: { nodes: number; edges: Edge[] }): string {
  const lines = [`${data.nodes} ${data.edges.length}`];
  for (const e of data.edges) {
    lines.push(e.w !== undefined ? `${e.u} ${e.v} ${e.w}` : `${e.u} ${e.v}`);
  }
  return lines.join("\n");
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      // Matrix
      return (value as unknown[][]).map((row) => row.join(" ")).join("\n");
    }
    return value.join(" ");
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "nodes" in value &&
    "edges" in value
  ) {
    return renderGraph(value as { nodes: number; edges: Edge[] });
  }
  return String(value);
}

function renderFormat(template: string, values: MaterializedValue): string {
  // Matches {varname} — simple, no-backtrack pattern (no extra options needed)
  return template.replace(/\{(\w+)\}/g, (_match, name) => {
    if (!(name in values)) {
      throw new FormatError(
        `Format string references undefined variable "${name}"`
      );
    }
    return renderValue(values[name]);
  });
}

function autoFormat(
  template: TemplateDSL,
  values: MaterializedValue
): string {
  const parts: string[] = [];
  for (const [name, spec] of Object.entries(template.variables)) {
    const v = values[name];
    if (spec.type === "matrix") {
      const rows = Math.round(evalExpr(spec.rows, values));
      const cols = Math.round(evalExpr(spec.cols, values));
      parts.push(`${rows} ${cols}`);
      parts.push(renderValue(v));
    } else if (spec.type === "graph" || spec.type === "tree") {
      parts.push(renderGraph(v as { nodes: number; edges: Edge[] }));
    } else if (spec.type === "array") {
      const len = Math.round(evalExpr(spec.length, values));
      parts.push(String(len));
      parts.push(renderValue(v));
    } else {
      parts.push(renderValue(v));
    }
  }
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Public API — materialize one test case
// ---------------------------------------------------------------------------

const MAX_CONSTRAINT_RETRIES = 20;

export function materializeOne(
  template: TemplateDSL,
  seed: number,
  profile: GenerationProfile,
  templateHash: string
): MaterializedTestCase {
  const cfg = profileConfig(profile);

  for (let attempt = 0; attempt <= MAX_CONSTRAINT_RETRIES; attempt++) {
    const rng = mulberry32(seed + attempt * 0x9e3779b9);
    const values: MaterializedValue = {};

    try {
      for (const [name, spec] of Object.entries(template.variables)) {
        values[name] = materializeVariable(name, spec, values, rng, cfg);
      }
    } catch (e) {
      if (attempt === MAX_CONSTRAINT_RETRIES) throw e;
      continue;
    }

    // Check constraints
    const unsat: string[] = [];
    for (const c of template.constraints) {
      if (!evalConstraint(c, values)) {
        unsat.push(c);
      }
    }
    if (unsat.length > 0 && attempt < MAX_CONSTRAINT_RETRIES) continue;
    if (unsat.length > 0) {
      throw new UnsatConstraintsError(
        `Constraints unsatisfied after ${MAX_CONSTRAINT_RETRIES} attempts`,
        unsat
      );
    }

    // Render format
    let input: string;
    if (template.format) {
      input = renderFormat(template.format, values);
    } else {
      input = autoFormat(template, values);
    }

    return { input, values, profile, seed, template_hash: templateHash };
  }

  throw new GeneratorError("materializeOne: unreachable");
}

// ---------------------------------------------------------------------------
// Public API — materialise all test cases for a template
// ---------------------------------------------------------------------------

export function materializeAll(
  template: TemplateDSL,
  templateHash: string,
  baseSeed: number = 0
): MaterializedTestCase[] {
  const cases: MaterializedTestCase[] = [];
  const perProfile = template.cases_per_profile ?? 2;

  for (const profile of template.profiles) {
    for (let i = 0; i < perProfile; i++) {
      // Seed derivation: baseSeed + profile_index * 1000 + case_index
      const profileIndex = template.profiles.indexOf(profile);
      const seed = baseSeed + profileIndex * 1000 + i;
      cases.push(materializeOne(template, seed, profile, templateHash));
    }
  }

  return cases;
}
