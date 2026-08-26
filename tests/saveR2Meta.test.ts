import { describe, expect, it } from 'vitest';
import { DEFAULT_SAVE, loadSave, writeSave, type SaveV10 } from '../src/persistence/save';

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
  it('round-trips hero mastery, boss history and counterplay stars in save v10', () => {
    const storage = new MemoryStorage();
    const save: SaveV10 = {
      ...DEFAULT_SAVE,
      heroMasteryXp: { scavenger: 321, engineer: 987, alchemist: 44, beastfriend: 1200 },
      bossHistory: [
        {
          bossId: 'tv-tyrant', wins: 3, losses: 2, fastestVictoryMs: 31_250,
          currentWinStreak: 2, bestWinStreak: 3, revengePending: false,
        },
        {
          bossId: 'border-shark', wins: 1, losses: 1, fastestVictoryMs: 54_900,
          currentWinStreak: 0, bestWinStreak: 1, revengePending: true,
        },
      ],
      completedBossChallengeIds: ['tv-backup-channel', 'shark-cheap-rent'],
    };

    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('migrates a valid v9 retention save into v10 with an empty challenge list', () => {
    const storage = new MemoryStorage();
    const v9 = {
      ...DEFAULT_SAVE,
      version: 9,
      completedBossChallengeIds: undefined,
      heroMasteryXp: { scavenger: 10, engineer: 20, alchemist: 30, beastfriend: 40 },
      bossHistory: [{
        bossId: 'baby-moon', wins: 2, losses: 1, fastestVictoryMs: 40_000,
        currentWinStreak: 1, bestWinStreak: 2, revengePending: false,
      }],
    };
    delete (v9 as Record<string, unknown>).completedBossChallengeIds;
    storage.setItem('junkpack.save', JSON.stringify(v9));

    const loaded = loadSave(storage);
    expect(loaded.version).toBe(10);
    expect(loaded.heroMasteryXp.engineer).toBe(20);
    expect(loaded.bossHistory).toEqual(v9.bossHistory);
    expect(loaded.completedBossChallengeIds).toEqual([]);
  });

  it('normalizes stale and duplicate counterplay challenge IDs without discarding the save', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      completedBossChallengeIds: [
        'shark-cheap-rent',
        'stale-challenge',
        'tv-backup-channel',
        'shark-cheap-rent',
      ],
    }));
    expect(loadSave(storage).completedBossChallengeIds).toEqual([
      'tv-backup-channel',
      'shark-cheap-rent',
    ]);
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
});
