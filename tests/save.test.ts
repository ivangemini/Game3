import { describe, expect, it } from 'vitest';
import { DEFAULT_DAILY_RETENTION } from '../src/game/domain/dailyRetention';
import { createInitialRunProgress } from '../src/game/domain/runProgression';
import {
  DEFAULT_HERO_MASTERY_XP,
  DEFAULT_SAVE,
  loadSave,
  writeSave,
  type SaveV8,
  type SaveV10,
} from '../src/persistence/save';

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
  it('round-trips active run inventory, retention, boss mastery, hero, rewards, perks, events and loop progression', () => {
    const storage = new MemoryStorage();
    const save: SaveV10 = {
      ...DEFAULT_SAVE,
      bestCorruptedLoop: 3,
      completedBossChallengeIds: ['tv-backup-channel', 'moon-mixed-sky'],
      dailyRetention: {
        ...DEFAULT_DAILY_RETENTION,
        streakCount: 4,
        realityStamps: 7,
        rewardTrackDay: 4,
        lastQualifiedKey: '2026-08-25',
      },
      activeRun: {
        runSeed: 'daily:2026-08-26', shopIndex: 4, coins: 73,
        soldOfferIds: ['shop-4-0-laser-cat'], nextLootSequence: 6,
        claimedEncounterIds: ['w1-tv-tyrant'],
        selectedPerkIds: ['overclock'], perkChoiceIndex: 1,
        pendingPerkOfferIds: ['laser-pet', 'chaos-license', 'scrap-plating'],
        offeredPerkEncounterIds: ['w1-tv-tyrant'],
        progress: { mode: 'loop', campaignEncounterIndex: 17, loopNumber: 3, loopEncounterIndex: 4, score: 1550 },
        eventIndex: 3,
        pendingEventId: 'cat-courier',
        resolvedEventIds: ['fish-shrine', 'slime-pawnshop'],
        heroId: 'engineer',
        backpackItems: [{
          instanceId: 'loot-5-laser-cat', definitionId: 'laser-cat',
          origin: { x: 2, y: 1 }, rotation: 1,
        }],
      },
    };
    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('keeps the previous validated save as a recovery backup', () => {
    const storage = new MemoryStorage();
    const first: SaveV10 = { ...DEFAULT_SAVE, bestCorruptedLoop: 1 };
    const second: SaveV10 = { ...DEFAULT_SAVE, bestCorruptedLoop: 2 };
    writeSave(first, storage);
    writeSave(second, storage);
    expect(JSON.parse(storage.getItem('junkpack.save.backup') ?? 'null')).toEqual(first);
    expect(loadSave(storage)).toEqual(second);
  });

  it('recovers a corrupted primary slot from the previous valid backup', () => {
    const storage = new MemoryStorage();
    const recoverable: SaveV10 = { ...DEFAULT_SAVE, discoveredItemIds: ['laser-cat'], bestCorruptedLoop: 2 };
    const newer: SaveV10 = { ...DEFAULT_SAVE, discoveredItemIds: ['laser-cat', 'mutant-duck'], bestCorruptedLoop: 3 };
    writeSave(recoverable, storage);
    writeSave(newer, storage);
    storage.setItem('junkpack.save', '{broken json');
    expect(loadSave(storage)).toEqual(recoverable);
    expect(JSON.parse(storage.getItem('junkpack.save') ?? 'null')).toEqual(recoverable);
  });

  it('does not overwrite a good backup with an already corrupt primary slot', () => {
    const storage = new MemoryStorage();
    const good: SaveV10 = { ...DEFAULT_SAVE, bestCorruptedLoop: 4 };
    storage.setItem('junkpack.save.backup', JSON.stringify(good));
    storage.setItem('junkpack.save', '{broken json');
    writeSave({ ...DEFAULT_SAVE, bestCorruptedLoop: 5 }, storage);
    expect(JSON.parse(storage.getItem('junkpack.save.backup') ?? 'null')).toEqual(good);
  });

  it('migrates a full v8 save into v10 without losing the active build', () => {
    const storage = new MemoryStorage();
    const v8: SaveV8 = {
      version: 8,
      discoveredItemIds: ['laser-cat'],
      discoveredRecipeIds: ['cat-gun'],
      bestEndlessWave: 16,
      bestCorruptedLoop: 3,
      settings: DEFAULT_SAVE.settings,
      activeRun: {
        runSeed: 'daily:2026-08-25', shopIndex: 2, coins: 61,
        soldOfferIds: ['offer-a'], backpackItems: [{
          instanceId: 'legacy-cat', definitionId: 'laser-cat', origin: { x: 1, y: 1 }, rotation: 0,
        }], nextLootSequence: 3,
        claimedEncounterIds: ['w1-tv-tyrant'], selectedPerkIds: ['overclock'], perkChoiceIndex: 1,
        pendingPerkOfferIds: [], offeredPerkEncounterIds: ['w1-tv-tyrant'],
        progress: { mode: 'campaign', campaignEncounterIndex: 4, loopNumber: 1, loopEncounterIndex: 0, score: 700 },
        eventIndex: 1, pendingEventId: null, resolvedEventIds: ['cat-courier'], heroId: 'engineer',
      },
    };
    storage.setItem('junkpack.save', JSON.stringify(v8));
    const migrated = loadSave(storage);
    expect(migrated.version).toBe(10);
    expect(migrated.activeRun).toEqual(v8.activeRun);
    expect(migrated.dailyRetention).toEqual(DEFAULT_DAILY_RETENTION);
    expect(migrated.heroMasteryXp).toEqual(DEFAULT_HERO_MASTERY_XP);
    expect(migrated.bossHistory).toEqual([]);
    expect(migrated.completedBossChallengeIds).toEqual([]);
  });

  it('migrates v1 meta saves into v10 without inventing a run', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 1,
      discoveredItemIds: ['laser-cat'], discoveredRecipeIds: ['cat-gun'], bestEndlessWave: 12,
      settings: { musicVolume: 0.5, sfxVolume: 0.75, reducedMotion: true },
    }));
    const migrated = loadSave(storage);
    expect(migrated.version).toBe(10);
    expect(migrated.discoveredItemIds).toEqual(['laser-cat']);
    expect(migrated.activeRun).toBeNull();
    expect(migrated.bestCorruptedLoop).toBe(2);
    expect(migrated.dailyRetention).toEqual(DEFAULT_DAILY_RETENTION);
    expect(migrated.completedBossChallengeIds).toEqual([]);
  });

  it('migrates v2-v4 active runs with safe progression, event and hero defaults', () => {
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
      expect(migrated.version).toBe(10);
      expect(migrated.activeRun?.progress).toEqual(createInitialRunProgress());
      expect(migrated.activeRun?.eventIndex).toBe(0);
      expect(migrated.activeRun?.pendingEventId).toBeNull();
      expect(migrated.activeRun?.resolvedEventIds).toEqual([]);
      expect(migrated.activeRun?.heroId).toBeNull();
    }
  });

  it('moves old v5 cashout saves into the fourth campaign world', () => {
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
    expect(migrated.activeRun?.eventIndex).toBe(0);
    expect(migrated.activeRun?.heroId).toBeNull();
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

  it('migrates v6 active runs without creating a phantom event or hero', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 6,
      discoveredItemIds: [], discoveredRecipeIds: [], bestEndlessWave: 0, bestCorruptedLoop: 2,
      settings: DEFAULT_SAVE.settings,
      activeRun: {
        runSeed: 'v6-run', shopIndex: 2, coins: 51,
        soldOfferIds: [], backpackItems: [], nextLootSequence: 3,
        claimedEncounterIds: [], selectedPerkIds: [], perkChoiceIndex: 0,
        pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
        progress: { mode: 'campaign', campaignEncounterIndex: 4, loopNumber: 1, loopEncounterIndex: 0, score: 800 },
      },
    }));
    const migrated = loadSave(storage);
    expect(migrated.version).toBe(10);
    expect(migrated.activeRun?.eventIndex).toBe(0);
    expect(migrated.activeRun?.pendingEventId).toBeNull();
    expect(migrated.activeRun?.resolvedEventIds).toEqual([]);
    expect(migrated.activeRun?.heroId).toBeNull();
  });

  it('migrates v7 active runs by requiring a one-time hero choice', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      version: 7,
      discoveredItemIds: [], discoveredRecipeIds: [], bestEndlessWave: 0, bestCorruptedLoop: 0,
      settings: DEFAULT_SAVE.settings,
      activeRun: {
        runSeed: 'v7-run', shopIndex: 2, coins: 51,
        soldOfferIds: [], backpackItems: [], nextLootSequence: 3,
        claimedEncounterIds: [], selectedPerkIds: [], perkChoiceIndex: 0,
        pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
        progress: { mode: 'campaign', campaignEncounterIndex: 4, loopNumber: 1, loopEncounterIndex: 0, score: 800 },
        eventIndex: 2, pendingEventId: null, resolvedEventIds: ['cat-courier'],
      },
    }));
    const migrated = loadSave(storage);
    expect(migrated.version).toBe(10);
    expect(migrated.activeRun?.eventIndex).toBe(2);
    expect(migrated.activeRun?.resolvedEventIds).toEqual(['cat-courier']);
    expect(migrated.activeRun?.heroId).toBeNull();
  });

  it('falls back safely when persisted progression is malformed and no backup exists', () => {
    const storage = new MemoryStorage();
    storage.setItem('junkpack.save', JSON.stringify({
      ...DEFAULT_SAVE,
      activeRun: {
        runSeed: 'bad', shopIndex: 0, coins: 10, soldOfferIds: [], claimedEncounterIds: [],
        selectedPerkIds: [], perkChoiceIndex: 0, pendingPerkOfferIds: [], offeredPerkEncounterIds: [],
        eventIndex: 0, pendingEventId: null, resolvedEventIds: [], heroId: 'engineer',
        backpackItems: [], nextLootSequence: 1,
        progress: { mode: 'campaign', campaignEncounterIndex: 99, loopNumber: 1, loopEncounterIndex: 0, score: 0 },
      },
    }));
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });
});
