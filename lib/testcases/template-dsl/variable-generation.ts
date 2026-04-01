import { TemplateDslError } from './errors';
import {
  assertValidConstValue,
  cloneGeneratedValue,
  isScalar,
} from './guards';
import { resolveNumericRef, resolveRange, toPositiveInteger } from './numeric';
import { DeterministicRandom } from './random';
import { MAX_COLLECTION_SIZE } from './types';
import type {
  TemplateGeneratedValue,
  TestCaseTemplateVariable,
} from './types';

function generateIntArray(
  spec: Extract<TestCaseTemplateVariable, { type: 'int_array' }>,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  random: DeterministicRandom
): number[] {
  const length = toPositiveInteger(
    resolveNumericRef(spec.length, context, 'int_array.length'),
    'int_array.length',
    true
  );

  if (length > MAX_COLLECTION_SIZE) {
    throw new TemplateDslError(`int_array length cannot exceed ${MAX_COLLECTION_SIZE}`);
  }

  const { min, max } = resolveRange({ min: spec.min, max: spec.max }, context, 'int_array');

  const values: number[] = [];

  if (spec.unique) {
    const rangeSize = max - min + 1;
    if (rangeSize < length) {
      throw new TemplateDslError('int_array.unique=true requires a value range at least as large as length');
    }

    const used = new Set<number>();
    while (values.length < length) {
      const nextValue = random.nextInt(min, max);
      if (!used.has(nextValue)) {
        used.add(nextValue);
        values.push(nextValue);
      }
    }
  } else {
    for (let index = 0; index < length; index += 1) {
      values.push(random.nextInt(min, max));
    }
  }

  if (spec.sorted === 'asc') {
    values.sort((a, b) => a - b);
  }

  if (spec.sorted === 'desc') {
    values.sort((a, b) => b - a);
  }

  return values;
}

function generateMatrix(
  spec: Extract<TestCaseTemplateVariable, { type: 'matrix' }>,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  random: DeterministicRandom
): number[][] {
  const rows = toPositiveInteger(resolveNumericRef(spec.rows, context, 'matrix.rows'), 'matrix.rows', true);
  const cols = toPositiveInteger(resolveNumericRef(spec.cols, context, 'matrix.cols'), 'matrix.cols', true);

  if (rows * cols > MAX_COLLECTION_SIZE) {
    throw new TemplateDslError(`matrix cells cannot exceed ${MAX_COLLECTION_SIZE}`);
  }

  const { min, max } = resolveRange({ min: spec.min, max: spec.max }, context, 'matrix');
  const matrix: number[][] = [];

  for (let row = 0; row < rows; row += 1) {
    const line: number[] = [];
    for (let col = 0; col < cols; col += 1) {
      line.push(random.nextInt(min, max));
    }
    matrix.push(line);
  }

  return matrix;
}

function generatePairs(
  spec: Extract<TestCaseTemplateVariable, { type: 'pairs' }>,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  random: DeterministicRandom
): number[][] {
  const count = toPositiveInteger(resolveNumericRef(spec.count, context, 'pairs.count'), 'pairs.count', true);

  if (count > MAX_COLLECTION_SIZE) {
    throw new TemplateDslError(`pairs.count cannot exceed ${MAX_COLLECTION_SIZE}`);
  }

  const firstRange = resolveRange(spec.first, context, 'pairs.first');
  const secondRange = resolveRange(spec.second, context, 'pairs.second');

  if (spec.unique) {
    const leftChoices = firstRange.max - firstRange.min + 1;
    const rightChoices = secondRange.max - secondRange.min + 1;
    const maxUniquePairs = leftChoices * rightChoices;
    if (count > maxUniquePairs) {
      throw new TemplateDslError(
        'pairs.unique=true requires count to be less than or equal to available unique combinations'
      );
    }
  }

  const pairs: number[][] = [];
  const used = new Set<string>();

  while (pairs.length < count) {
    const left = random.nextInt(firstRange.min, firstRange.max);
    const right = random.nextInt(secondRange.min, secondRange.max);

    if (spec.unique) {
      const key = `${left}|${right}`;
      if (used.has(key)) {
        continue;
      }
      used.add(key);
    }

    pairs.push([left, right]);
  }

  return pairs;
}

function maxDistinctEdges(params: {
  nodes: number;
  directed: boolean;
  allowSelfLoops: boolean;
}): number {
  if (params.nodes === 0) {
    return 0;
  }

  if (params.directed) {
    return params.allowSelfLoops
      ? params.nodes * params.nodes
      : params.nodes * (params.nodes - 1);
  }

  const withoutSelf = (params.nodes * (params.nodes - 1)) / 2;
  return params.allowSelfLoops ? withoutSelf + params.nodes : withoutSelf;
}

function encodeEdgeKey(
  from: number,
  to: number,
  directed: boolean
): string {
  if (directed) {
    return `${from}>${to}`;
  }

  return from <= to ? `${from}-${to}` : `${to}-${from}`;
}

function generateGraph(
  spec: Extract<TestCaseTemplateVariable, { type: 'graph' }>,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  random: DeterministicRandom
): number[][] {
  const nodes = toPositiveInteger(resolveNumericRef(spec.nodes, context, 'graph.nodes'), 'graph.nodes', true);
  const edges = toPositiveInteger(resolveNumericRef(spec.edges, context, 'graph.edges'), 'graph.edges', true);

  const directed = spec.directed ?? false;
  const connected = spec.connected ?? false;
  const weighted = spec.weighted ?? false;
  const oneIndexed = spec.oneIndexed ?? true;
  const allowSelfLoops = spec.allowSelfLoops ?? false;
  const allowMultiEdges = spec.allowMultiEdges ?? false;

  if (connected && nodes > 0 && edges < nodes - 1) {
    throw new TemplateDslError('graph.connected=true requires edges >= nodes - 1');
  }

  if (!allowMultiEdges) {
    const maxEdges = maxDistinctEdges({ nodes, directed, allowSelfLoops });
    if (edges > maxEdges) {
      throw new TemplateDslError('graph.edges exceeds maximum distinct edges for the chosen options');
    }
  }

  if (edges > MAX_COLLECTION_SIZE) {
    throw new TemplateDslError(`graph.edges cannot exceed ${MAX_COLLECTION_SIZE}`);
  }

  let weightRange: { min: number; max: number } | null = null;
  if (weighted) {
    weightRange = resolveRange(
      { min: spec.minWeight ?? 1, max: spec.maxWeight ?? 1_000_000_000 },
      context,
      'graph.weight'
    );
  }

  const edgeList: number[][] = [];
  const used = new Set<string>();

  const maybeAddEdge = (fromNode: number, toNode: number): boolean => {
    if (!allowSelfLoops && fromNode === toNode) {
      return false;
    }

    const key = encodeEdgeKey(fromNode, toNode, directed);
    if (!allowMultiEdges && used.has(key)) {
      return false;
    }

    used.add(key);

    const from = oneIndexed ? fromNode + 1 : fromNode;
    const to = oneIndexed ? toNode + 1 : toNode;

    if (weighted && weightRange) {
      edgeList.push([from, to, random.nextInt(weightRange.min, weightRange.max)]);
    } else {
      edgeList.push([from, to]);
    }

    return true;
  };

  if (connected && nodes > 1) {
    for (let node = 1; node < nodes; node += 1) {
      const parent = random.nextInt(0, node - 1);
      maybeAddEdge(parent, node);
    }
  }

  let guard = 0;
  const maxGuard = Math.max(edges * 20, 10_000);

  while (edgeList.length < edges) {
    if (guard > maxGuard) {
      throw new TemplateDslError('Unable to generate graph edges with the requested constraints');
    }
    guard += 1;

    const fromNode = nodes === 0 ? 0 : random.nextInt(0, Math.max(0, nodes - 1));
    const toNode = nodes === 0 ? 0 : random.nextInt(0, Math.max(0, nodes - 1));

    maybeAddEdge(fromNode, toNode);
  }

  return edgeList;
}

function resolveAlphabet(spec: Extract<TestCaseTemplateVariable, { type: 'string' }>): string {
  if (typeof spec.alphabet === 'string' && spec.alphabet.length > 0) {
    return spec.alphabet;
  }

  switch (spec.charset) {
    case 'upper':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    case 'alpha':
      return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    case 'alnum':
      return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    case 'digits':
      return '0123456789';
    case 'lower':
    default:
      return 'abcdefghijklmnopqrstuvwxyz';
  }
}

export function generateVariableValue(
  spec: TestCaseTemplateVariable,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  random: DeterministicRandom
): TemplateGeneratedValue {
  switch (spec.type) {
    case 'const': {
      assertValidConstValue(spec.value);
      return cloneGeneratedValue(spec.value);
    }

    case 'int': {
      const { min, max } = resolveRange({ min: spec.min, max: spec.max }, context, 'int');
      return random.nextInt(min, max);
    }

    case 'choice': {
      if (!Array.isArray(spec.values) || spec.values.length === 0 || !spec.values.every(isScalar)) {
        throw new TemplateDslError('choice.values must be a non-empty array of strings or numbers');
      }

      if (spec.weights) {
        return random.pickWeighted(spec.values, spec.weights);
      }

      return random.pick(spec.values);
    }

    case 'string': {
      const length = toPositiveInteger(
        resolveNumericRef(spec.length, context, 'string.length'),
        'string.length',
        true
      );

      if (length > MAX_COLLECTION_SIZE) {
        throw new TemplateDslError(`string.length cannot exceed ${MAX_COLLECTION_SIZE}`);
      }

      const alphabet = resolveAlphabet(spec);
      if (alphabet.length === 0) {
        throw new TemplateDslError('string.alphabet must not be empty');
      }

      let value = '';
      for (let index = 0; index < length; index += 1) {
        value += alphabet.charAt(random.nextInt(0, alphabet.length - 1));
      }
      return value;
    }

    case 'int_array': {
      return generateIntArray(spec, context, random);
    }

    case 'matrix': {
      return generateMatrix(spec, context, random);
    }

    case 'permutation': {
      const size = toPositiveInteger(resolveNumericRef(spec.n, context, 'permutation.n'), 'permutation.n', true);
      if (size > MAX_COLLECTION_SIZE) {
        throw new TemplateDslError(`permutation.n cannot exceed ${MAX_COLLECTION_SIZE}`);
      }

      const start = typeof spec.start === 'number' && Number.isInteger(spec.start) ? spec.start : 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(start + Math.max(0, size - 1))) {
        throw new TemplateDslError('permutation start and size must remain within safe integer bounds');
      }
      const values = Array.from({ length: size }, (_, index) => start + index);
      return random.shuffle(values);
    }

    case 'pairs': {
      return generatePairs(spec, context, random);
    }

    case 'graph': {
      return generateGraph(spec, context, random);
    }

    default: {
      const exhaustive: never = spec;
      throw new TemplateDslError(`Unsupported variable specification: ${JSON.stringify(exhaustive)}`);
    }
  }
}
