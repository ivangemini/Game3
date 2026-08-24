import { describe, expect, it } from 'vitest';
import {
  findFirstValidPlacement,
  normalizeShape,
  rotateShape,
  validatePlacement,
} from '../src/game/domain/inventory';
import type { ItemDefinition, PlacedItem } from '../src/game/domain/types';

const lItem: ItemDefinition = {
  id: 'l-item',
  name: 'L Item',
  rarity: 'common',
  tags: ['metal'],
  description: 'test',
  shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
};
const definitions = new Map([[lItem.id, lItem]]);

describe('inventory geometry', () => {
  it('normalizes and rotates shapes on integer cells', () => {
    expect(normalizeShape([{ x: 4, y: 5 }, { x: 5, y: 5 }])).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(rotateShape(lItem.shape, 1)).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]);
  });

  it('rejects blocked and overlapping placements', () => {
    const placed: PlacedItem = { instanceId: 'one', definitionId: 'l-item', origin: { x: 0, y: 0 }, rotation: 0 };
    const state = { width: 6, height: 5, blockedCells: [{ x: 5, y: 4 }], items: [placed] } as const;

    expect(validatePlacement(state, definitions, { instanceId: 'two', definitionId: 'l-item', origin: { x: 0, y: 0 }, rotation: 0 }).reason).toBe('occupied');
    expect(validatePlacement(state, definitions, { instanceId: 'two', definitionId: 'l-item', origin: { x: 4, y: 3 }, rotation: 0 }).reason).toBe('blocked');
    expect(validatePlacement(state, definitions, { instanceId: 'two', definitionId: 'l-item', origin: { x: 2, y: 1 }, rotation: 1 }).ok).toBe(true);
  });

  it('finds the first deterministic legal placement across rotations', () => {
    const state = {
      width: 3,
      height: 2,
      blockedCells: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
      items: [] as readonly PlacedItem[],
    } as const;

    expect(findFirstValidPlacement(state, definitions, 'l-item', 'loot')).toEqual({
      instanceId: 'loot',
      definitionId: 'l-item',
      origin: { x: 1, y: 0 },
      rotation: 0,
    });
  });
});
