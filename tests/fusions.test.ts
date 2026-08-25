import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_RECIPES } from '../src/game/data/fusionRecipes';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { applyFusion, findAvailableFusions } from '../src/game/domain/fusions';
import type { InventoryState } from '../src/game/domain/inventory';

const recipe = (id: string) => {
  const found = PROTOTYPE_FUSION_RECIPES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing recipe ${id}`);
  return found;
};

describe('fusion domain', () => {
  it('finds recipes deterministically from definition IDs regardless of item array order', () => {
    const items = [
      { instanceId: 'toaster-b', definitionId: 'cursed-toaster', origin: { x: 1, y: 0 }, rotation: 0 as const },
      { instanceId: 'battery-a', definitionId: 'angry-battery', origin: { x: 0, y: 0 }, rotation: 0 as const },
    ];
    const first = findAvailableFusions(items, PROTOTYPE_FUSION_RECIPES);
    const second = findAvailableFusions([...items].reverse(), PROTOTYPE_FUSION_RECIPES);
    expect(first.map((candidate) => candidate.recipe.id)).toEqual(second.map((candidate) => candidate.recipe.id));
    expect(first.some((candidate) => candidate.recipe.id === 'shock-toaster')).toBe(true);
  });

  it('consumes both ingredients and produces one legal result', () => {
    const state: InventoryState = {
      width: 6,
      height: 5,
      blockedCells: [{ x: 5, y: 4 }],
      items: [
        { instanceId: 'battery-a', definitionId: 'angry-battery', origin: { x: 0, y: 0 }, rotation: 0 },
        { instanceId: 'toaster-b', definitionId: 'cursed-toaster', origin: { x: 1, y: 0 }, rotation: 0 },
      ],
    };
    const result = applyFusion(state, PROTOTYPE_ITEM_MAP, recipe('shock-toaster'), 'fusion-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.items).toHaveLength(1);
    expect(result.resultItem.definitionId).toBe('shock-toaster');
    expect([...result.ingredientInstanceIds].sort()).toEqual(['battery-a', 'toaster-b']);
  });

  it('does not consume anything when required ingredients are missing', () => {
    const state: InventoryState = {
      width: 6,
      height: 5,
      blockedCells: [],
      items: [{ instanceId: 'battery-a', definitionId: 'angry-battery', origin: { x: 0, y: 0 }, rotation: 0 }],
    };
    const result = applyFusion(state, PROTOTYPE_ITEM_MAP, recipe('shock-toaster'), 'fusion-1');
    expect(result).toEqual({ ok: false, reason: 'missing-ingredients' });
    expect(state.items).toHaveLength(1);
  });

  it('fails safely when a valid ingredient layout has no legal shape for the result', () => {
    const state: InventoryState = {
      width: 3,
      height: 1,
      blockedCells: [],
      items: [
        { instanceId: 'toaster-b', definitionId: 'cursed-toaster', origin: { x: 0, y: 0 }, rotation: 1 },
        { instanceId: 'battery-a', definitionId: 'angry-battery', origin: { x: 2, y: 0 }, rotation: 0 },
      ],
    };
    const result = applyFusion(state, PROTOTYPE_ITEM_MAP, recipe('shock-toaster'), 'fusion-cramped');
    expect(result).toEqual({ ok: false, reason: 'no-space' });
    expect(state.items).toHaveLength(2);
  });
});
