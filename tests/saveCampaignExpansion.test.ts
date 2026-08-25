import { describe, expect, it } from 'vitest';
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
    ...DEFAULT_SAVE,
    discoveredItemIds: ['laser-cat'],
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
  it('resumes a pre-expansion v8 campaign breakpoint at World 5 without losing the build', () => {
    const storage = new MemoryStorage();
    const oldSave = legacyFourWorldBreakpoint();
    storage.setItem('junkpack.save', JSON.stringify(oldSave));

    const loaded = loadSave(storage);
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
  });

  it('leaves a genuine six-world campaign breakpoint unchanged', () => {
    const storage = new MemoryStorage();
    const current: SaveV8 = {
      ...legacyFourWorldBreakpoint(),
      activeRun: {
        ...legacyFourWorldBreakpoint().activeRun!,
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
    expect(loadSave(storage)).toEqual(current);
  });
});
