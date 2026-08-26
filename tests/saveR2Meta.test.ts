import { describe, expect, it } from 'vitest';
import { DEFAULT_SAVE, loadSave, writeSave, type SaveV9 } from '../src/persistence/save';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('R2 mastery/grudge persistence', () => {
  it('round-trips non-default hero mastery, boss history and challenge stars in save v9', () => {
    const storage = new MemoryStorage();
    const save: SaveV9 = {
      ...DEFAULT_SAVE,
      heroMasteryXp: { scavenger: 321, engineer: 987, alchemist: 44, beastfriend: 1200 },
      bossHistory: [
        {
          bossId: 'tv-tyrant', wins: 3, losses: 2, fastestVictoryMs: 31_250,
          currentWinStreak: 2, bestWinStreak: 3, revengePending: false, challengeStars: 2,
        },
        {
          bossId: 'border-shark', wins: 1, losses: 1, fastestVictoryMs: 54_900,
          currentWinStreak: 0, bestWinStreak: 1, revengePending: true, challengeStars: 1,
        },
      ],
    };

    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('rejects malformed mastery XP instead of silently accepting corrupt progression', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      heroMasteryXp: { ...DEFAULT_SAVE.heroMasteryXp, engineer: -1 },
    }));
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });

  it('rejects malformed boss history instead of creating an invalid revenge state', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      bossHistory: [{
        bossId: 'tv-tyrant', wins: 1, losses: 0, fastestVictoryMs: -5,
        currentWinStreak: 1, bestWinStreak: 1, revengePending: false,
      }],
    }));
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });

  it('rejects out-of-range persisted boss challenge stars', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      bossHistory: [{
        bossId: 'baby-moon', wins: 2, losses: 0, fastestVictoryMs: 42_000,
        currentWinStreak: 2, bestWinStreak: 2, revengePending: false, challengeStars: 4,
      }],
    }));
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });
});
