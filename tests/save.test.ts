import { describe, expect, it } from 'vitest';
import { createInitialRunProgress } from '../src/game/domain/runProgression';
import { DEFAULT_SAVE, loadSave, writeSave, type SaveV6 } from '../src/persistence/save';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('save persistence', () => {
  it('round-trips active run inventory, rewards, perks and loop progression', () => {
    const storage = new MemoryStorage();
    const save: SaveV6 = {
      ...DEFAULT_SAVE,
      bestCorruptedLoop: 3,
      activeRun: {
        runSeed: 'daily-seed', shopIndex: 4, coins: 73,
        soldOfferIds: ['shop-4-0-laser-cat'], nextLootSequence: 6,
        claimedEncounterIds: ['w1-tv-tyrant'],
        selectedPerkIds: ['overclock'], perkChoiceIndex: 1,
        pendingPerkOfferIds: ['laser-pet', 'chaos-license', 'scrap-plating'],
        offeredPerkEncounterIds: ['w1-tv-tyrant'],
        progress: { mode: 'loop', campaignEncounterIndex: 11, loopNumber: 3, loopEncounterIndex: 4, score: 1550 },
        backpackItems: [{
          instanceId: 'loot-5-laser-cat', definitionId: 'laser-cat',
          origin: { x: 2, y: 1 }, rotation: 1,
        }],
      },
    };
    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('migrates v1 meta saves into v6 without inventing a run', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 1,
      discoveredItemIds: ['laser-cat'], discoveredRecipeIds: ['cat-gun'], bestEndlessWave: 12,
      settings: { musicVolume: 0.5, sfxVolume: 0.75, reducedMotion: true },
    }));
    const migrated = loadSave(storage);
    expect(migrated.version).toBe(6);
    expect(migrated.discoveredItemIds).toEqual(['laser-cat']);
    expect(migrated.activeRun).toBeNull();
    expect(migrated.bestCorruptedLoop).toBe(2);
  });

  it('migrates v2-v4 active runs with safe progression defaults', () => {
    for (const version of [2, 3, 4] as const) {
      const storage = new MemoryStorage();
      storage.setItem('junkpack.save', JSON.stringify({
        version,
        discoveredItemIds: [], discoveredRecipeIds: [], bestEndlessWave: 0,
        settings: DEFAULT_SAVE.settings,
        activeRun: {
          runSeed: `old-v${version}`, shopIndex: 1, coins: 44,
          soldOfferIds: [], backpackItems: [], nextLootSequence: 2,
          ...(version >= 3 ? { claimedEncounterIds: ['scrap-dummy'] } : {}),
          ...(version >= 4 ? {
            selectedPerkIds: [], perkChoiceIndex: 0,
            pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
          } : {}),
        },
      }));
      const migrated = loadSave(storage);
      expect(migrated.version).toBe(6);
      expect(migrated.activeRun?.progress).toEqual(createInitialRunProgress());
    }
  });

  it('moves old v5 cashout saves into the new fourth world', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 5,
      discoveredItemIds: [], discoveredRecipeIds: [], bestEndlessWave: 0,
      settings: DEFAULT_SAVE.settings,
      activeRun: {
        runSeed: 'old-cashout', shopIndex: 3, coins: 90,
        soldOfferIds: [], backpackItems: [], nextLootSequence: 3,
        claimedEncounterIds: [], selectedPerkIds: [], perkChoiceIndex: 0,
        pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
        progress: { mode: 'cashout', campaignEncounterIndex: 8, endlessWave: 0, score: 2200 },
      },
    }));

    const migrated = loadSave(storage);
    expect(migrated.activeRun?.progress).toEqual({
      mode: 'campaign', campaignEncounterIndex: 9, loopNumber: 1, loopEncounterIndex: 0, score: 2200,
    });
  });

  it('maps old v5 endless waves into corrupted loops', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 5,
      discoveredItemIds: [], discoveredRecipeIds: [], bestEndlessWave: 14,
      settings: DEFAULT_SAVE.settings,
      activeRun: {
        runSeed: 'old-endless', shopIndex: 3, coins: 90,
        soldOfferIds: [], backpackItems: [], nextLootSequence: 3,
        claimedEncounterIds: [], selectedPerkIds: [], perkChoiceIndex: 0,
        pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
        progress: { mode: 'endless', campaignEncounterIndex: 8, endlessWave: 14, score: 4200 },
      },
    }));

    const migrated = loadSave(storage);
    expect(migrated.bestCorruptedLoop).toBe(3);
    expect(migrated.activeRun?.progress).toEqual({
      mode: 'loop', campaignEncounterIndex: 11, loopNumber: 3, loopEncounterIndex: 1, score: 4200,
    });
  });

  it('falls back safely when persisted progression is malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      activeRun: {
        runSeed: 'bad', shopIndex: 0, coins: 10, soldOfferIds: [], claimedEncounterIds: [],
        selectedPerkIds: [], perkChoiceIndex: 0, pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
        backpackItems: [], nextLootSequence: 1,
        progress: { mode: 'campaign', campaignEncounterIndex: 99, loopNumber: 1, loopEncounterIndex: 0, score: 0 },
      },
    }));
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });
});
