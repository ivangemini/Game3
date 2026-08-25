import { describe, expect, it } from 'vitest';
import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../src/game/data/combatProfiles';
import { PROTOTYPE_FUSION_RECIPES } from '../src/game/data/fusionRecipes';
import {
  PROTOTYPE_BASE_ITEMS,
  PROTOTYPE_FUSION_ITEMS,
  PROTOTYPE_ITEM_MAP,
  PROTOTYPE_ITEMS,
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
  it('expands the prototype pools without orphaned combat profiles or recipes', () => {
    expect(PROTOTYPE_BASE_ITEMS).toHaveLength(24);
    expect(PROTOTYPE_FUSION_ITEMS).toHaveLength(21);
    expect(PROTOTYPE_ITEMS).toHaveLength(45);
    expect(PROTOTYPE_FUSION_RECIPES).toHaveLength(21);
    expect(PROTOTYPE_PERKS).toHaveLength(16);
    expect(SYNERGY_RULES).toHaveLength(10);

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

  it('lets one new contact activate battery-device and food-pet in opposite directions', () => {
    const snapshot = evaluateSynergies(
      inventory(
        placed('hamster', 'alarm-hamster', 0, 0),
        placed('microwave', 'emergency-microwave', 0, 1),
      ),
      PROTOTYPE_ITEM_MAP,
    );

    expect(snapshot.connections.some((connection) => connection.ruleId === 'battery-device')).toBe(true);
    expect(snapshot.connections.some((connection) => connection.ruleId === 'food-pet')).toBe(true);
    expect(snapshot.bonusesByInstanceId.microwave?.triggerSpeedPct).toBe(25);
    expect(snapshot.bonusesByInstanceId.hamster?.triggerSpeedPct).toBe(20);
  });

  it('activates antenna, slime and reinforced-weapon families through real side contact', () => {
    const antenna = evaluateSynergies(
      inventory(placed('radio', 'pocket-radio', 0, 0), placed('toaster', 'cursed-toaster', 1, 0)),
      PROTOTYPE_ITEM_MAP,
    );
    expect(antenna.connections.some((connection) => connection.ruleId === 'antenna-device')).toBe(true);
    expect(antenna.bonusesByInstanceId.toaster?.triggerSpeedPct).toBe(15);

    const slime = evaluateSynergies(
      inventory(placed('slime', 'slime-can', 0, 0), placed('flask', 'poison-flask', 0, 1)),
      PROTOTYPE_ITEM_MAP,
    );
    expect(slime.connections.some((connection) => connection.ruleId === 'slime-poison')).toBe(true);
    expect(slime.bonusesByInstanceId.slime?.poisonOnHit).toBe(2);

    const reinforced = evaluateSynergies(
      inventory(placed('radio', 'pocket-radio', 0, 0), placed('fish', 'fish-blaster', 1, 0)),
      PROTOTYPE_ITEM_MAP,
    );
    expect(reinforced.connections.some((connection) => connection.ruleId === 'metal-weapon')).toBe(true);
    expect(reinforced.bonusesByInstanceId.fish?.scrapArmor).toBe(1);
  });

  it('requires two fusion-only ingredients for the first second-stage evolution', () => {
    const recipe = PROTOTYPE_FUSION_RECIPES.find((candidate) => candidate.id === 'singularity-toaster');
    expect(recipe).toBeDefined();
    if (!recipe) return;

    const fusionIds = new Set(PROTOTYPE_FUSION_ITEMS.map((item) => item.id));
    expect(recipe.ingredientDefinitionIds.every((id) => fusionIds.has(id))).toBe(true);
    expect(findFusionCandidate([
      placed('gravity', 'gravity-toaster', 0, 0),
      placed('shock', 'shock-toaster', 3, 0),
    ], recipe)?.ingredientInstanceIds).toEqual(['gravity', 'shock']);
    expect(findFusionCandidate([
      placed('gravity', 'gravity-toaster', 0, 0),
      placed('toaster', 'cursed-toaster', 3, 0),
    ], recipe)).toBeNull();
  });
});
