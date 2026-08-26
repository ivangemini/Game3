import { describe, expect, it } from 'vitest';
import { DEFAULT_DAILY_RETENTION } from '../src/game/domain/dailyRetention';
import { DEFAULT_SAVE, loadSave, type SaveV8 } from '../src/persistence/save';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

function legacyFourWorldBreakpoint(): SaveV8 {
  return {
    version: 8,
    discoveredItemIds: ['laser-cat'],
    discoveredRecipeIds: [],
    bestEndlessWave: 0,
    bestCorruptedLoop: 0,
    settings: DEFAULT_SAVE.settings,
    activeRun: {
      runSeed: 'pre-six-world-v8',
      shopIndex: 7,
      coins: 91,
      soldOfferIds: ['offer-a'],
      backpackItems: [{
        instanceId: 'legacy-cat',
        definitionId: 'laser-cat',
        origin: { x: 2, y: 1 },
        rotation: 0,
      }],
      nextLootSequence: 9,
      claimedEncounterIds: ['w4-baby-moon'],
      selectedPerkIds: ['overclock'],
      perkChoiceIndex: 4,
      pendingPerkOfferIds: ['laser-pet'],
      offeredPerkEncounterIds: ['w4-baby-moon'],
      progress: {
        mode: 'deep-choice',
        campaignEncounterIndex: 11,
        loopNumber: 1,
        loopEncounterIndex: 0,
        score: 4200,
      },
      eventIndex: 4,
      pendingEventId: null,
      resolvedEventIds: ['cat-courier'],
      heroId: 'engineer',
    },
  };
}

describe('six-world save compatibility', () => {
  it('resumes a pre-expansion v8 campaign breakpoint at World 5 without losing the build through v10', () => {
    const storage = new MemoryStorage();
    const oldSave = legacyFourWorldBreakpoint();
    storage.setItem('junkpack.save', JSON.stringify(oldSave));

    const loaded = loadSave(storage);
    expect(loaded.version).toBe(10);
    expect(loaded.activeRun?.progress).toEqual({
      mode: 'campaign',
      campaignEncounterIndex: 12,
      loopNumber: 1,
      loopEncounterIndex: 0,
      score: 4200,
    });
    expect(loaded.activeRun?.runSeed).toBe('pre-six-world-v8');
    expect(loaded.activeRun?.coins).toBe(91);
    expect(loaded.activeRun?.selectedPerkIds).toEqual(['overclock']);
    expect(loaded.activeRun?.pendingPerkOfferIds).toEqual(['laser-pet']);
    expect(loaded.activeRun?.backpackItems).toHaveLength(1);
    expect(loaded.dailyRetention).toEqual(DEFAULT_DAILY_RETENTION);
    expect(loaded.completedBossChallengeIds).toEqual([]);
  });

  it('leaves a genuine six-world v8 campaign breakpoint unchanged while migrating the envelope to v10', () => {
    const storage = new MemoryStorage();
    const old = legacyFourWorldBreakpoint();
    const current: SaveV8 = {
      ...old,
      activeRun: {
        ...old.activeRun!,
        progress: {
          mode: 'deep-choice',
          campaignEncounterIndex: 17,
          loopNumber: 1,
          loopEncounterIndex: 0,
          score: 6100,
        },
      },
    };
    storage.setItem('junkpack.save', JSON.stringify(current));
    const loaded = loadSave(storage);
    expect(loaded.version).toBe(10);
    expect(loaded.activeRun).toEqual(current.activeRun);
    expect(loaded.dailyRetention).toEqual(DEFAULT_DAILY_RETENTION);
    expect(loaded.completedBossChallengeIds).toEqual([]);
  });
});
