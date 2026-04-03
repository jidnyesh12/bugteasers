import { TemplateDslError } from './errors';
import type { TemplateScalar } from './types';

function hashStringToUint32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export class DeterministicRandom {
  private state: number;

  constructor(seed: string) {
    const hashedSeed = hashStringToUint32(seed);
    this.state = hashedSeed === 0 ? 0x9e3779b9 : hashedSeed;
  }

  nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }

  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new TemplateDslError(`Invalid integer range: min=${min}, max=${max}`);
    }

    if (min === max) {
      return min;
    }

    const span = max - min + 1;
    return min + Math.floor(this.nextFloat() * span);
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new TemplateDslError('Cannot pick from an empty list');
    }

    return values[this.nextInt(0, values.length - 1)];
  }

  pickWeighted(values: readonly TemplateScalar[], weights: readonly number[]): TemplateScalar {
    if (values.length === 0) {
      throw new TemplateDslError('Weighted choice requires at least one value');
    }

    if (values.length !== weights.length) {
      throw new TemplateDslError('Weighted choice requires weights length to match values length');
    }

    let total = 0;
    for (const weight of weights) {
      if (!Number.isFinite(weight) || weight <= 0) {
        throw new TemplateDslError('Weighted choice requires strictly positive finite weights');
      }
      total += weight;
      if (total > Number.MAX_SAFE_INTEGER) {
        throw new TemplateDslError('Weighted choice sum exceeds safe integer precision');
      }
    }

    const target = this.nextFloat() * total;
    let running = 0;

    for (let index = 0; index < values.length; index += 1) {
      running += weights[index];
      if (target <= running) {
        return values[index];
      }
    }

    return values[values.length - 1];
  }

  shuffle<T>(values: T[]): T[] {
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = this.nextInt(0, i);
      [values[i], values[j]] = [values[j], values[i]];
    }

    return values;
  }

  private nextUint32(): number {
    let x = this.state >>> 0;
    x ^= (x << 13) >>> 0;
    x ^= x >>> 17;
    x ^= (x << 5) >>> 0;
    this.state = x >>> 0;
    return this.state;
  }
}
