import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_RECIPES, SECOND_STAGE_FUSION_RECIPE_IDS } from '../src/game/data/fusionRecipes';
import { PROTOTYPE_ITEMS } from '../src/game/data/items';
import { createMetaProgressionSnapshot } from '../src/game/domain/metaProgression';

const itemIds = PROTOTYPE_ITEMS.map((item) => item.id);
const recipeIds = PROTOTYPE_FUSION_RECIPES.map((recipe) => recipe.id);

describe('derived meta progression', () => {
  it('starts at the baseline archive rank without creating save flags', () => {
    const snapshot = createMetaProgressionSnapshot(itemIds, recipeIds, SECOND_STAGE_FUSION_RECIPE_IDS, {
      discoveredItemIds: [],
      discoveredRecipeIds: [],
      bestCorruptedLoop: 0,
    });

    expect(snapshot.currentRank.id).toBe('dumpster-intern');
    expect(snapshot.milestones[0]?.unlocked).toBe(true);
    expect(snapshot.unlockedAchievementCount).toBe(0);
  });

  it('ignores stale discovery ids and unlocks rank milestones from current catalog progress', () => {
    const discoveredItems = [...itemIds.slice(0, 30), 'removed-item'];
    const discoveredRecipes = [...recipeIds.slice(0, 8), 'removed-recipe'];
    const snapshot = createMetaProgressionSnapshot(itemIds, recipeIds, SECOND_STAGE_FUSION_RECIPE_IDS, {
      discoveredItemIds: discoveredItems,
      discoveredRecipeIds: discoveredRecipes,
      bestCorruptedLoop: 0,
    });

    expect(snapshot.currentRank.id).toBe('junk-curator');
    expect(snapshot.achievements.find((entry) => entry.id === 'half-the-heap')?.unlocked).toBe(true);
    expect(snapshot.achievements.find((entry) => entry.id === 'full-itemdex')?.unlocked).toBe(false);
  });

  it('counts second-stage discoveries independently from ordinary recipes', () => {
    const firstSecret = SECOND_STAGE_FUSION_RECIPE_IDS[0];
    const snapshot = createMetaProgressionSnapshot(itemIds, recipeIds, SECOND_STAGE_FUSION_RECIPE_IDS, {
      discoveredItemIds: itemIds.slice(0, 50),
      discoveredRecipeIds: [...recipeIds.slice(0, 12), firstSecret],
      bestCorruptedLoop: 0,
    });

    expect(snapshot.discoveredSecondStageRecipes).toBeGreaterThanOrEqual(1);
    expect(snapshot.achievements.find((entry) => entry.id === 'secret-spark')?.unlocked).toBe(true);
  });

  it('unlocks the final cosmetic rank only for full collection plus corrupted-loop mastery', () => {
    const beforeLoop = createMetaProgressionSnapshot(itemIds, recipeIds, SECOND_STAGE_FUSION_RECIPE_IDS, {
      discoveredItemIds: itemIds,
      discoveredRecipeIds: recipeIds,
      bestCorruptedLoop: 1,
    });
    expect(beforeLoop.currentRank.id).toBe('fusion-librarian');

    const complete = createMetaProgressionSnapshot(itemIds, recipeIds, SECOND_STAGE_FUSION_RECIPE_IDS, {
      discoveredItemIds: itemIds,
      discoveredRecipeIds: recipeIds,
      bestCorruptedLoop: 5,
    });
    expect(complete.currentRank.id).toBe('void-archivist');
    expect(complete.nextRank).toBeNull();
    expect(complete.achievements.every((entry) => entry.unlocked)).toBe(true);
  });

  it('keeps thresholds catalog-relative so content expansion does not require migration', () => {
    const expandedItems = [...itemIds, 'future-a', 'future-b', 'future-c', 'future-d'];
    const snapshot = createMetaProgressionSnapshot(expandedItems, recipeIds, SECOND_STAGE_FUSION_RECIPE_IDS, {
      discoveredItemIds: itemIds,
      discoveredRecipeIds: recipeIds,
      bestCorruptedLoop: 2,
    });

    expect(snapshot.achievements.find((entry) => entry.id === 'full-itemdex')?.unlocked).toBe(false);
    expect(snapshot.currentRank.id).not.toBe('void-archivist');
  });
});
