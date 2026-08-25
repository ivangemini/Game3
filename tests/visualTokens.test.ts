import { describe, expect, it } from 'vitest';
import type { ItemDefinition } from '../src/game/domain/types';
import { itemArtKey, primaryVisualTag, rarityVisual, stableItemAccent } from '../src/game/ui/visualTokens';

function item(id: string, tags: ItemDefinition['tags']): Pick<ItemDefinition, 'id' | 'tags'> {
  return { id, tags };
}

describe('visual token contract', () => {
  it('uses stable item atlas keys that do not depend on display names', () => {
    expect(itemArtKey('laser-cat')).toBe('item.laser-cat');
    expect(itemArtKey('orbital-cat')).toBe('item.orbital-cat');
  });

  it('chooses a consistent readable primary silhouette tag', () => {
    expect(primaryVisualTag(item('x', ['device', 'cat', 'laser']))).toBe('cat');
    expect(primaryVisualTag(item('x', ['metal', 'weapon']))).toBe('weapon');
    expect(primaryVisualTag(item('x', ['device']))).toBe('device');
  });

  it('keeps rarity visuals distinct and deterministic', () => {
    const rarities = ['common', 'uncommon', 'rare', 'epic'] as const;
    const strokes = rarities.map((rarity) => rarityVisual(rarity).stroke);
    expect(new Set(strokes).size).toBe(rarities.length);
    expect(stableItemAccent('laser-cat')).toBe(stableItemAccent('laser-cat'));
    expect(stableItemAccent('laser-cat')).not.toBe(stableItemAccent('angry-battery'));
  });
});
