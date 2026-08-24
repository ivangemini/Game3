import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ITEMS } from '../src/game/data/items';
import { generateShopOffers, itemShopPrice } from '../src/game/domain/shop';

describe('seeded shop', () => {
  it('returns the same offers for the same seed regardless of input order', () => {
    const forward = generateShopOffers(PROTOTYPE_ITEMS, 'daily-2026-08-24', 3, 3);
    const reversed = generateShopOffers([...PROTOTYPE_ITEMS].reverse(), 'daily-2026-08-24', 3, 3);

    expect(reversed).toEqual(forward);
    expect(new Set(forward.map((offer) => offer.definitionId)).size).toBe(3);
  });

  it('uses stable rarity/shape pricing', () => {
    for (const definition of PROTOTYPE_ITEMS) {
      expect(itemShopPrice(definition)).toBeGreaterThan(0);
    }

    const battery = PROTOTYPE_ITEMS.find((item) => item.id === 'angry-battery');
    const duck = PROTOTYPE_ITEMS.find((item) => item.id === 'mutant-duck');
    expect(battery).toBeDefined();
    expect(duck).toBeDefined();
    expect(itemShopPrice(duck!)).toBeGreaterThan(itemShopPrice(battery!));
  });

  it('rejects impossible shop requests', () => {
    expect(() => generateShopOffers(PROTOTYPE_ITEMS, 'seed', -1, 3)).toThrow(RangeError);
    expect(() => generateShopOffers(PROTOTYPE_ITEMS, 'seed', 0, PROTOTYPE_ITEMS.length + 1)).toThrow(RangeError);
  });
});
