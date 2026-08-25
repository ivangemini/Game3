import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_RECIPES } from '../src/game/data/fusionRecipes';
import { PROTOTYPE_ITEMS, PROTOTYPE_SHOP_ITEMS } from '../src/game/data/items';
import { createCollectionSnapshot } from '../src/game/domain/collection';

describe('meta collection model', () => {
  it('builds the full launch collection without leaking unknown payloads', () => {
    const snapshot = createCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      { discoveredItemIds: [], discoveredRecipeIds: [] },
    );

    expect(snapshot.items).toHaveLength(60);
    expect(snapshot.recipes).toHaveLength(24);
    expect(snapshot.itemProgress).toEqual({ discovered: 0, total: 60, percent: 0 });
    expect(snapshot.recipeProgress).toEqual({ discovered: 0, total: 24, percent: 0 });
    expect(snapshot.items.every((entry) => entry.discovered === false)).toBe(true);
    expect(snapshot.recipes.every((entry) => entry.discovered === false)).toBe(true);
  });

  it('reveals only discovered item definitions and classifies shop vs fusion sources', () => {
    const snapshot = createCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      { discoveredItemIds: ['laser-cat', 'singularity-toaster', 'stale-item'], discoveredRecipeIds: [] },
    );

    const cat = snapshot.items.find((entry) => entry.definitionId === 'laser-cat');
    const toaster = snapshot.items.find((entry) => entry.definitionId === 'singularity-toaster');
    const hidden = snapshot.items.find((entry) => entry.definitionId === 'mutant-duck');
    expect(cat?.discovered).toBe(true);
    if (cat?.discovered) expect(cat.source).toBe('shop');
    expect(toaster?.discovered).toBe(true);
    if (toaster?.discovered) expect(toaster.source).toBe('fusion');
    expect(hidden).toEqual({ definitionId: 'mutant-duck', discovered: false });
    expect(snapshot.itemProgress.discovered).toBe(2);
  });

  it('reveals recipe ingredients only after discovery and identifies second-stage recipes', () => {
    const snapshot = createCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      {
        discoveredItemIds: [],
        discoveredRecipeIds: ['shock-toaster', 'singularity-toaster', 'stale-recipe'],
      },
    );

    const firstStage = snapshot.recipes.find((entry) => entry.recipeId === 'shock-toaster');
    const secondStage = snapshot.recipes.find((entry) => entry.recipeId === 'singularity-toaster');
    const hidden = snapshot.recipes.find((entry) => entry.recipeId === 'cyber-cat');
    expect(firstStage?.discovered).toBe(true);
    if (firstStage?.discovered) {
      expect(firstStage.stage).toBe('first-stage');
      expect(firstStage.ingredientDefinitions.map((item) => item.id)).toEqual(['angry-battery', 'cursed-toaster']);
    }
    expect(secondStage?.discovered).toBe(true);
    if (secondStage?.discovered) {
      expect(secondStage.stage).toBe('second-stage');
      expect(secondStage.ingredientDefinitions.every((item) => !PROTOTYPE_SHOP_ITEMS.some((shop) => shop.id === item.id))).toBe(true);
    }
    expect(hidden).toEqual({ recipeId: 'cyber-cat', discovered: false });
    expect(snapshot.recipeProgress.discovered).toBe(2);
  });

  it('calculates progress from known content only, ignoring stale save IDs', () => {
    const snapshot = createCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      {
        discoveredItemIds: ['laser-cat', 'not-real-a', 'not-real-b'],
        discoveredRecipeIds: ['shock-toaster', 'not-real-recipe'],
      },
    );

    expect(snapshot.itemProgress.discovered).toBe(1);
    expect(snapshot.recipeProgress.discovered).toBe(1);
    expect(snapshot.itemProgress.percent).toBe(2);
    expect(snapshot.recipeProgress.percent).toBe(4);
  });
});
