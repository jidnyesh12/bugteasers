import { TemplateDslError } from './errors';
import { isTemplateRef } from './guards';
import type { TestCaseInputTemplate, TestCaseTemplateVariable } from './types';

function collectVariableRefs(spec: TestCaseTemplateVariable): Set<string> {
  const refs = new Set<string>();

  const addRef = (value: unknown): void => {
    if (isTemplateRef(value)) {
      refs.add(value.ref);
    }
  };

  switch (spec.type) {
    case 'const':
    case 'choice':
      break;
    case 'int':
      addRef(spec.min);
      addRef(spec.max);
      break;
    case 'string':
      addRef(spec.length);
      break;
    case 'int_array':
      addRef(spec.length);
      addRef(spec.min);
      addRef(spec.max);
      break;
    case 'matrix':
      addRef(spec.rows);
      addRef(spec.cols);
      addRef(spec.min);
      addRef(spec.max);
      break;
    case 'permutation':
      addRef(spec.n);
      break;
    case 'pairs':
      addRef(spec.count);
      addRef(spec.first.min);
      addRef(spec.first.max);
      addRef(spec.second.min);
      addRef(spec.second.max);
      break;
    case 'graph':
      addRef(spec.nodes);
      addRef(spec.edges);
      addRef(spec.minWeight);
      addRef(spec.maxWeight);
      break;
    default: {
      const exhaustive: never = spec;
      throw new TemplateDslError(`Unsupported variable type in dependency scan: ${JSON.stringify(exhaustive)}`);
    }
  }

  return refs;
}

export function buildVariableEvaluationOrder(template: TestCaseInputTemplate): string[] {
  const variableEntries = Object.entries(template.variables);
  const variableNames = variableEntries.map(([name]) => name);
  const variableNameSet = new Set(variableNames);

  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const name of variableNames) {
    inDegree.set(name, 0);
    dependents.set(name, []);
  }

  for (const [name, rawSpec] of variableEntries) {
    const spec = rawSpec as TestCaseTemplateVariable;
    const refs = collectVariableRefs(spec);

    for (const ref of refs) {
      if (!variableNameSet.has(ref)) {
        throw new TemplateDslError(`Variable "${name}" references unknown variable "${ref}"`);
      }

      if (ref === name) {
        throw new TemplateDslError(`Variable "${name}" cannot reference itself`);
      }

      inDegree.set(name, (inDegree.get(name) ?? 0) + 1);
      dependents.get(ref)?.push(name);
    }
  }

  const queue = variableNames.filter((name) => (inDegree.get(name) ?? 0) === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    ordered.push(current);

    for (const dependent of dependents.get(current) ?? []) {
      const nextDegree = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, nextDegree);
      if (nextDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  if (ordered.length !== variableNames.length) {
    const cycleMembers = variableNames.filter((name) => (inDegree.get(name) ?? 0) > 0);
    throw new TemplateDslError(
      `Circular variable dependency detected: ${cycleMembers.join(' -> ')}`
    );
  }

  return ordered;
}
