export interface SeededRng {
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(values: readonly T[]): T;
  shuffle<T>(values: readonly T[]): T[];
}

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeededRng(seed: string | number): SeededRng {
  let state = hashSeed(seed) || 0x6d2b79f5;

  const next = (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(minInclusive, maxInclusive) {
      if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive) || maxInclusive < minInclusive) {
        throw new RangeError('Invalid integer range');
      }
      return minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1));
    },
    pick<T>(values: readonly T[]): T {
      if (values.length === 0) throw new RangeError('Cannot pick from an empty collection');
      const result = values[Math.floor(next() * values.length)];
      if (result === undefined) throw new Error('RNG index resolution failed');
      return result;
    },
    shuffle<T>(values: readonly T[]): T[] {
      const result = [...values];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(next() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
      }
      return result;
    },
  };
}
