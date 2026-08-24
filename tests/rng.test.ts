import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../src/game/domain/rng';

describe('createSeededRng', () => {
  it('reproduces the same sequence for the same seed', () => {
    const a = createSeededRng('daily-2026-08-24');
    const b = createSeededRng('daily-2026-08-24');
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('keeps integer output inside the inclusive range', () => {
    const rng = createSeededRng(42);
    for (let index = 0; index < 100; index += 1) {
      const value = rng.int(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });
});
