import { createSeededRng } from './rng';
import type { ItemDefinition, Rarity } from './types';

export interface ShopOffer {
  readonly id: string;
  readonly definitionId: string;
  readonly price: number;
}

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 5,
  legendary: 1,
};

const RARITY_BASE_PRICE: Record<Rarity, number> = {
  common: 18,
  uncommon: 27,
  rare: 40,
  epic: 58,
  legendary: 85,
};

export function itemShopPrice(definition: ItemDefinition): number {
  return RARITY_BASE_PRICE[definition.rarity] + Math.max(0, definition.shape.length - 1) * 3;
}

export function generateShopOffers(
  definitions: readonly ItemDefinition[],
  runSeed: string | number,
  shopIndex: number,
  count = 3,
): ShopOffer[] {
  if (!Number.isInteger(shopIndex) || shopIndex < 0) {
    throw new RangeError('shopIndex must be a non-negative integer');
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('count must be a positive integer');
  }
  if (definitions.length < count) {
    throw new RangeError('Not enough unique item definitions for requested shop size');
  }

  const rng = createSeededRng(`${String(runSeed)}:shop:${shopIndex}`);
  const pool = [...definitions].sort((a, b) => a.id.localeCompare(b.id));
  const offers: ShopOffer[] = [];

  for (let slot = 0; slot < count; slot += 1) {
    const totalWeight = pool.reduce((sum, definition) => sum + RARITY_WEIGHTS[definition.rarity], 0);
    let roll = rng.next() * totalWeight;
    let selectedIndex = pool.length - 1;

    for (let index = 0; index < pool.length; index += 1) {
      const definition = pool[index];
      if (!definition) continue;
      roll -= RARITY_WEIGHTS[definition.rarity];
      if (roll <= 0) {
        selectedIndex = index;
        break;
      }
    }

    const [selected] = pool.splice(selectedIndex, 1);
    if (!selected) throw new Error('Failed to select a shop item');
    offers.push({
      id: `shop-${shopIndex}-${slot}-${selected.id}`,
      definitionId: selected.id,
      price: itemShopPrice(selected),
    });
  }

  return offers;
}
