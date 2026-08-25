import { describe, expect, it } from 'vitest';
import { createStandardRunSeed } from '../src/game/domain/runSeed';

describe('createStandardRunSeed', () => {
  it('is deterministic for injected time and entropy', () => {
    expect(createStandardRunSeed(1_700_000_000_000, 0.5)).toBe(createStandardRunSeed(1_700_000_000_000, 0.5));
  });

  it('changes when either time or entropy changes', () => {
    const base = createStandardRunSeed(1_700_000_000_000, 0.5);
    expect(createStandardRunSeed(1_700_000_000_001, 0.5)).not.toBe(base);
    expect(createStandardRunSeed(1_700_000_000_000, 0.5001)).not.toBe(base);
  });

  it('sanitizes invalid injected values without throwing', () => {
    expect(createStandardRunSeed(Number.NaN, Number.POSITIVE_INFINITY)).toMatch(/^run:[0-9a-z]+:[0-9a-z]{7}$/);
  });
});
