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
        if (first.bassHz !== null) expect(first.bassHz).toBeGreaterThan(0);
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

  it('uses a sparse bass cadence and deterministic swing outside the menu', () => {
    expect(musicStepFor('menu', 0).bassHz).not.toBeNull();
    expect(musicStepFor('menu', 1).bassHz).toBeNull();
    expect(musicStepFor('combat', 0).bassHz).not.toBeNull();
    expect(musicStepFor('combat', 1).bassHz).toBeNull();
    expect(musicStepFor('combat', 0).intervalMs).not.toBe(musicStepFor('combat', 1).intervalMs);
    expect(musicStepFor('boss', 0).intervalMs).not.toBe(musicStepFor('boss', 1).intervalMs);
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
