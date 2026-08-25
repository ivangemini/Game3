import { describe, expect, it } from 'vitest';
import { musicStepFor, type MusicMode } from '../src/game/audio/musicPattern';

const MODES: readonly MusicMode[] = ['menu', 'combat', 'boss'];

describe('procedural music pattern', () => {
  it('is deterministic and finite across modes and steps', () => {
    for (const mode of MODES) {
      for (let index = 0; index < 24; index += 1) {
        const first = musicStepFor(mode, index);
        expect(musicStepFor(mode, index)).toEqual(first);
        expect(Number.isFinite(first.rootHz)).toBe(true);
        expect(first.rootHz).toBeGreaterThan(0);
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

  it('sanitizes invalid step indices deterministically', () => {
    expect(musicStepFor('menu', Number.NaN)).toEqual(musicStepFor('menu', 0));
    expect(musicStepFor('boss', -4)).toEqual(musicStepFor('boss', 0));
  });
});
