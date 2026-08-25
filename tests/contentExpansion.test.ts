import { describe, expect, it } from 'vitest';
import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../src/game/data/combatProfiles';
import {
  PROTOTYPE_FUSION_RECIPES,
  SECOND_STAGE_FUSION_RECIPE_IDS,
  SECOND_STAGE_FUSION_RESULT_IDS,
} from '../src/game/data/fusionRecipes';
import {
  PROTOTYPE_BASE_ITEMS,
  PROTOTYPE_FUSION_ITEMS,
  PROTOTYPE_ITEM_MAP,
  PROTOTYPE_ITEMS,
  PROTOTYPE_SHOP_ITEMS,
} from '../src/game/data/items';
import { PROTOTYPE_PERKS } from '../src/game/data/perks';
import { findFusionCandidate } from '../src/game/domain/fusions';
import { evaluateSynergies, SYNERGY_RULES } from '../src/game/domain/synergies';
import type { InventoryState } from '../src/game/domain/inventory';
import type { PlacedItem } from '../src/game/domain/types';

const inventory = (...items: PlacedItem[]): InventoryState => ({
  width: 6,
  height: 5,
  blockedCells: [],
  items,
});

const placed = (
  instanceId: string,
  definitionId: string,
  x: number,
  y: number,
): PlacedItem => ({ instanceId, definitionId, origin: { x, y }, rotation: 0 });

describe('content expansion pack', () => {
  it('reaches launch-range content counts without orphaned profiles or recipes', () => {
    expect(PROTOTYPE_BASE_ITEMS).toHaveLength(36);
    expect(PROTOTYPE_FUSION_ITEMS).toHaveLength(24);
    expect(PROTOTYPE_ITEMS).toHaveLength(60);
    expect(PROTOTYPE_FUSION_RECIPES).toHaveLength(24);
    expect(PROTOTYPE_PERKS).toHaveLength(21);
    expect(SYNERGY_RULES).toHaveLength(10);
    expect(PROTOTYPE_SHOP_ITEMS).toHaveLength(36);

    const itemIds = new Set(PROTOTYPE_ITEMS.map((item) => item.id));
    expect(itemIds.size).toBe(PROTOTYPE_ITEMS.length);
    expect(new Set(PROTOTYPE_PERKS.map((perk) => perk.id)).size).toBe(PROTOTYPE_PERKS.length);
    expect(new Set(PROTOTYPE_FUSION_RECIPES.map((recipe) => recipe.id)).size).toBe(PROTOTYPE_FUSION_RECIPES.length);

    for (const item of PROTOTYPE_ITEMS) {
      expect(PROTOTYPE_COMBAT_PROFILE_MAP.has(item.id), `missing combat profile for ${item.id}`).toBe(true);
    }
    for (const recipe of PROTOTYPE_FUSION_RECIPES) {
      expect(PROTOTYPE_ITEM_MAP.has(recipe.resultDefinitionId), `missing fusion result ${recipe.resultDefinitionId}`).toBe(true);
      for (const ingredientId of recipe.ingredientDefinitionIds) {
        expect(PROTOTYPE_ITEM_MAP.has(ingredientId), `missing fusion ingredient ${ingredientId}`).toBe(true);
      }
    }
  });

  it('lets old food and chaos rules energize an adjacent pet laser at the same time', () => {
    const snapshot = evaluateSynergies(
      inventory(
        placed('banana', 'tactical-banana', 0, 0),
        placed('cat', 'laser-cat', 0, 1),
      ),
      PROTOTYPE_ITEM_MAP,
    );

    expect(snapshot.connections.some((connection) => connection.ruleId === 'food-pet')).toBe(true);
    expect(snapshot.connections.some((connection) => connection.ruleId === 'chaos-laser')).toBe(true);
    expect(snapshot.bonusesByInstanceId.cat?.triggerSpeedPct).toBe(20);
    expect(snapshot.bonusesByInstanceId.cat?.bonusLaserShots).toBe(1);
  });

  it('turns one wave-4 contact into three cross-family synergy links', () => {
    const snapshot = evaluateSynergies(
      inventory(
        placed('pigeon', 'battery-pigeon', 0, 0),
        placed('kettle', 'laser-kettle', 0, 2),
      ),
      PROTOTYPE_ITEM_MAP,
    );

    expect(snapshot.connections.filter((connection) => connection.ruleId === 'battery-device')).toHaveLength(1);
    expect(snapshot.connections.filter((connection) => connection.ruleId === 'antenna-device')).toHaveLength(1);
    expect(snapshot.connections.filter((connection) => connection.ruleId === 'food-pet')).toHaveLength(1);
    expect(snapshot.bonusesByInstanceId.kettle?.triggerSpeedPct).toBe(40);
    expect(snapshot.bonusesByInstanceId.pigeon?.triggerSpeedPct).toBe(20);
  });

  it('keeps all four second-stage evolutions fusion-only and out of the shop pool', () => {
    expect(SECOND_STAGE_FUSION_RECIPE_IDS).toHaveLength(4);
    expect(SECOND_STAGE_FUSION_RESULT_IDS.size).toBe(4);

    const fusionIds = new Set(PROTOTYPE_FUSION_ITEMS.map((item) => item.id));
    const shopIds = new Set(PROTOTYPE_SHOP_ITEMS.map((item) => item.id));
    for (const recipeId of SECOND_STAGE_FUSION_RECIPE_IDS) {
      const recipe = PROTOTYPE_FUSION_RECIPES.find((candidate) => candidate.id === recipeId);
      expect(recipe, `missing second-stage recipe ${recipeId}`).toBeDefined();
      if (!recipe) continue;
      expect(SECOND_STAGE_FUSION_RESULT_IDS.has(recipe.resultDefinitionId)).toBe(true);
      expect(shopIds.has(recipe.resultDefinitionId)).toBe(false);
      expect(recipe.ingredientDefinitionIds.every((id) => fusionIds.has(id))).toBe(true);
    }
  });

  it('requires both fusion-only branches for Cataclysm Satellite', () => {
    const recipe = PROTOTYPE_FUSION_RECIPES.find((candidate) => candidate.id === 'cataclysm-satellite');
    expect(recipe).toBeDefined();
    if (!recipe) return;

    expect(findFusionCandidate([
      placed('orbital', 'orbital-cat', 0, 0),
      placed('router', 'turbo-router', 3, 0),
    ], recipe)?.ingredientInstanceIds).toEqual(['orbital', 'router']);
    expect(findFusionCandidate([
      placed('orbital', 'orbital-cat', 0, 0),
      placed('router', 'feral-router', 3, 0),
    ], recipe)).toBeNull();
  });
});
