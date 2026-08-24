import { describe, expect, it } from 'vitest';
import { DEFAULT_SAVE, loadSave, writeSave, type SaveV3 } from '../src/persistence/save';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('save persistence', () => {
  it('round-trips active run inventory, shop and encounter-claim state', () => {
    const storage = new MemoryStorage();
    const save: SaveV3 = {
      ...DEFAULT_SAVE,
      activeRun: {
        runSeed: 'daily-seed',
        shopIndex: 4,
        coins: 73,
        soldOfferIds: ['shop-4-0-laser-cat'],
        nextLootSequence: 6,
        claimedEncounterIds: ['tv-tyrant'],
        backpackItems: [
          {
            instanceId: 'loot-5-laser-cat',
            definitionId: 'laser-cat',
            origin: { x: 2, y: 1 },
            rotation: 1,
          },
        ],
      },
    };

    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('migrates v1 meta saves into v3 without inventing a run', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 1,
      discoveredItemIds: ['laser-cat'],
      discoveredRecipeIds: ['cat-gun'],
      bestEndlessWave: 12,
      settings: {
        musicVolume: 0.5,
        sfxVolume: 0.75,
        reducedMotion: true,
      },
    }));

    const migrated = loadSave(storage);
    expect(migrated.version).toBe(3);
    expect(migrated.discoveredItemIds).toEqual(['laser-cat']);
    expect(migrated.bestEndlessWave).toBe(12);
    expect(migrated.activeRun).toBeNull();
  });

  it('migrates v2 active runs with an empty encounter-claim set', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 2,
      discoveredItemIds: [],
      discoveredRecipeIds: [],
      bestEndlessWave: 0,
      settings: DEFAULT_SAVE.settings,
      activeRun: {
        runSeed: 'old-run',
        shopIndex: 1,
        coins: 44,
        soldOfferIds: [],
        backpackItems: [],
        nextLootSequence: 2,
      },
    }));

    const migrated = loadSave(storage);
    expect(migrated.version).toBe(3);
    expect(migrated.activeRun?.runSeed).toBe('old-run');
    expect(migrated.activeRun?.claimedEncounterIds).toEqual([]);
  });

  it('falls back safely when persisted run data is malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      activeRun: {
        runSeed: 'bad',
        shopIndex: -2,
        coins: 10,
        soldOfferIds: [],
        claimedEncounterIds: [],
        backpackItems: [],
        nextLootSequence: 0,
      },
    }));

    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });
});
