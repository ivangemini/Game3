import { describe, expect, it } from 'vitest';
import { DEFAULT_WEEKLY_CHALLENGE, recordWeeklyAttempt, recordWeeklyProgress } from '../src/game/domain/weeklyChallenge';
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

describe('weekly challenge save-v9 extension', () => {
  it('loads an existing save v9 that predates weekly history and normalizes an empty weekly state', () => {
    const storage = new MemoryStorage();
    const { weeklyChallenge: _weekly, ...legacyV9 } = DEFAULT_SAVE;
    storage.setItem('junkpack.save', JSON.stringify(legacyV9));

    const loaded = loadSave(storage);
    expect(loaded.version).toBe(9);
    expect(loaded.weeklyChallenge).toEqual(DEFAULT_WEEKLY_CHALLENGE);
  });

  it('round-trips bounded weekly attempts, best score, tier and cosmetic reward history', () => {
    const storage = new MemoryStorage();
    let weekly = recordWeeklyAttempt(DEFAULT_WEEKLY_CHALLENGE, '2026-W35');
    weekly = recordWeeklyAttempt(weekly, '2026-W35');
    weekly = recordWeeklyProgress(weekly, '2026-W35', 8200, 2).state;
    const save: SaveV9 = { ...DEFAULT_SAVE, weeklyChallenge: weekly };

    writeSave(save, storage);
    expect(loadSave(storage).weeklyChallenge).toEqual(weekly);
  });

  it('rejects forged weekly loadout history instead of accepting impossible local progression', () => {
    const storage = new MemoryStorage();
    const valid = recordWeeklyProgress(
      recordWeeklyAttempt(DEFAULT_WEEKLY_CHALLENGE, '2026-W35'),
      '2026-W35',
      5000,
      1,
    ).state;
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      weeklyChallenge: {
        history: valid.history.map((entry) => ({ ...entry, startingPerkId: 'forged-perk' })),
      },
    }));

    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });
});
