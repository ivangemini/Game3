import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_RECIPES } from '../src/game/data/fusionRecipes';
import { PROTOTYPE_ITEMS, PROTOTYPE_SHOP_ITEMS } from '../src/game/data/items';
import { createCollectionSnapshot } from '../src/game/domain/collection';

describe('meta collection model', () => {
  it('builds the full launch collection while keeping zero-progress recipe payloads locked', () => {
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
    expect(snapshot.recipeClueProgress).toEqual({ traced: 0, almostSolved: 0 });
    expect(snapshot.items.every((entry) => entry.discovered === false)).toBe(true);
    expect(snapshot.recipes.every((entry) => entry.discovered === false)).toBe(true);

    const hiddenItem = snapshot.items.find((entry) => entry.definitionId === 'laser-cat');
    expect(hiddenItem?.discovered).toBe(false);
    if (hiddenItem && !hiddenItem.discovered) {
      expect(hiddenItem.silhouetteShape.length).toBeGreaterThan(0);
      expect('definition' in hiddenItem).toBe(false);
    }

    const hiddenRecipe = snapshot.recipes.find((entry) => entry.recipeId === 'cyber-cat');
    expect(hiddenRecipe).toEqual({ recipeId: 'cyber-cat', discovered: false, clue: { state: 'locked' } });
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
    expect(hidden?.discovered).toBe(false);
    if (hidden && !hidden.discovered) expect(hidden.silhouetteShape.length).toBeGreaterThan(0);
    expect(snapshot.itemProgress.discovered).toBe(2);
  });

  it('turns one known ingredient into a structural recipe trace without revealing the missing name or result', () => {
    const snapshot = createCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      { discoveredItemIds: ['laser-cat'], discoveredRecipeIds: [] },
    );

    const cyberCat = snapshot.recipes.find((entry) => entry.recipeId === 'cyber-cat');
    expect(cyberCat?.discovered).toBe(false);
    if (!cyberCat || cyberCat.discovered) throw new Error('expected hidden cyber-cat recipe');
    expect(cyberCat.clue.state).toBe('traced');
    if (cyberCat.clue.state !== 'traced') throw new Error('expected traced clue');
    expect(cyberCat.clue.knownIngredientDefinitions.map((item) => item.id)).toEqual(['laser-cat']);
    expect(cyberCat.clue.missingIngredientClues).toEqual([{
      rarity: 'common',
      primaryTag: 'battery',
      cellCount: 1,
    }]);
    expect(JSON.stringify(cyberCat)).not.toContain('angry-battery');
    expect(JSON.stringify(cyberCat)).not.toContain('Cyber Cat');
    expect(snapshot.recipeClueProgress.traced).toBeGreaterThan(0);
  });

  it('marks an undiscovered recipe almost solved once every ingredient has been discovered', () => {
    const snapshot = createCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      { discoveredItemIds: ['laser-cat', 'angry-battery'], discoveredRecipeIds: [] },
    );

    const cyberCat = snapshot.recipes.find((entry) => entry.recipeId === 'cyber-cat');
    expect(cyberCat?.discovered).toBe(false);
    if (!cyberCat || cyberCat.discovered) throw new Error('expected hidden cyber-cat recipe');
    expect(cyberCat.clue.state).toBe('almost-solved');
    if (cyberCat.clue.state !== 'almost-solved') throw new Error('expected almost-solved clue');
    expect(cyberCat.clue.ingredientDefinitions.map((item) => item.id)).toEqual(['laser-cat', 'angry-battery']);
    expect(cyberCat.clue.authoredHint).toBe('LASER CAT + BATTERY');
    expect(cyberCat.clue.stage).toBe('first-stage');
    expect('resultDefinition' in cyberCat).toBe(false);
    expect(snapshot.recipeClueProgress.almostSolved).toBeGreaterThan(0);
  });

  it('reveals recipe ingredients after discovery and identifies second-stage recipes', () => {
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
      expect(secondStage.ingredientDefinitions.every((item) => !PROTOTYPE_SHOP_ITEMS.some((shop) => shop.id === item.id))).toBe(true);
      expect(secondStage.stage).toBe('second-stage');
    }
    expect(hidden).toEqual({ recipeId: 'cyber-cat', discovered: false, clue: { state: 'locked' } });
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
