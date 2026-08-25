import { describe, expect, it } from 'vitest';
import { musicStepFor, type MusicMode } from '../src/game/audio/musicPattern';

const MODES: readonly MusicMode[] = ['menu', 'combat', 'boss'];

describe('procedural music pattern', () => {
  it('is deterministic and finite across modes and steps', () => {
    for (const mode of MODES) {
      for (let index = 0; index < 32; index += 1) {
        const first = musicStepFor(mode, index);
        expect(musicStepFor(mode, index)).toEqual(first);
        expect(Number.isFinite(first.rootHz)).toBe(true);
        expect(first.rootHz).toBeGreaterThan(0);
        if (first.accentHz !== null) expect(first.accentHz).toBeGreaterThan(0);
        expect(first.intervalMs).toBeGreaterThan(0);
        expect(first.durationMs).toBeGreaterThan(0);
        expect(first.gain).toBeGreaterThan(0);
      }
    }
  });

  it('raises intensity by shortening cadence and increasing gain for boss combat', () => {
    const menu = musicStepFor('menu', 0);
    const combat = musicStepFor('combat', 0);
    const boss = musicStepFor('boss', 0);
    expect(combat.intervalMs).toBeLessThan(menu.intervalMs);
    expect(boss.intervalMs).toBeLessThan(combat.intervalMs);
    expect(boss.gain).toBeGreaterThan(combat.gain);
    expect(combat.gain).toBeGreaterThan(menu.gain);
  });

  it('uses sparse sub accents and deterministic swing outside the menu', () => {
    const combat0 = musicStepFor('combat', 0);
    const combat1 = musicStepFor('combat', 1);
    const combat4 = musicStepFor('combat', 4);
    const boss0 = musicStepFor('boss', 0);
    const boss1 = musicStepFor('boss', 1);

    expect(combat0.accentHz).not.toBeNull();
    expect(combat0.accentHz!).toBeLessThan(combat0.rootHz);
    expect(combat1.accentHz).toBeNull();
    expect(combat4.accentHz).not.toBeNull();
    expect(combat4.accentHz!).toBeGreaterThan(combat4.rootHz);
    expect(combat0.intervalMs).not.toBe(combat1.intervalMs);
    expect(boss0.intervalMs).not.toBe(boss1.intervalMs);
    expect(musicStepFor('menu', 0).intervalMs).toBe(musicStepFor('menu', 1).intervalMs);
  });

  it('does not repeat the old eight-step phrase verbatim in the second half', () => {
    for (const mode of MODES) {
      const firstHalf = Array.from({ length: 8 }, (_, index) => musicStepFor(mode, index).rootHz);
      const secondHalf = Array.from({ length: 8 }, (_, index) => musicStepFor(mode, index + 8).rootHz);
      expect(secondHalf).not.toEqual(firstHalf);
    }
  });

  it('sanitizes invalid step indices deterministically', () => {
    expect(musicStepFor('menu', Number.NaN)).toEqual(musicStepFor('menu', 0));
    expect(musicStepFor('boss', -4)).toEqual(musicStepFor('boss', 0));
  });
});
