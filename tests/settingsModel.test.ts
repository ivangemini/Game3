import { describe, expect, it } from 'vitest';
import { clampVolume, normalizeSettingsDraft, settingsEqual, stepVolume, volumePercent } from '../src/game/ui/settingsModel';

describe('presentation settings model', () => {
  it('clamps malformed volumes and keeps reduced motion boolean', () => {
    expect(normalizeSettingsDraft({ musicVolume: 3, sfxVolume: -2, reducedMotion: true })).toEqual({
      musicVolume: 1,
      sfxVolume: 0,
      reducedMotion: true,
    });
    expect(clampVolume(Number.NaN)).toBe(0);
  });

  it('steps audio in stable 10 percent increments without leaving 0..1', () => {
    expect(stepVolume(0.8, 1)).toBe(0.9);
    expect(stepVolume(0.8, -1)).toBe(0.7);
    expect(stepVolume(1, 1)).toBe(1);
    expect(stepVolume(0, -1)).toBe(0);
    expect(volumePercent(0.84)).toBe(84);
  });

  it('compares normalized settings rather than raw malformed values', () => {
    expect(settingsEqual(
      { musicVolume: 1.3, sfxVolume: -1, reducedMotion: false },
      { musicVolume: 1, sfxVolume: 0, reducedMotion: false },
    )).toBe(true);
  });
});
