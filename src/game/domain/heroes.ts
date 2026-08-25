import type { ItemBonuses } from './synergies';
import type { ItemDefinition, ItemTag } from './types';

export type HeroId = 'scavenger' | 'engineer' | 'alchemist' | 'beastfriend';

export interface HeroDefinition {
  readonly id: HeroId;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly startingCoinsBonus: number;
  readonly targetTag?: ItemTag;
  readonly bonuses: Partial<ItemBonuses>;
}

export function applyHeroBonuses(
  item: ItemDefinition,
  base: ItemBonuses | undefined,
  hero: HeroDefinition | undefined,
): ItemBonuses {
  const result: ItemBonuses = {
    triggerSpeedPct: base?.triggerSpeedPct ?? 0,
    poisonOnHit: base?.poisonOnHit ?? 0,
    bonusLaserShots: base?.bonusLaserShots ?? 0,
    chaosPower: base?.chaosPower ?? 0,
    scrapArmor: base?.scrapArmor ?? 0,
  };

  if (!hero || (hero.targetTag && !item.tags.includes(hero.targetTag))) return result;

  return {
    triggerSpeedPct: result.triggerSpeedPct + (hero.bonuses.triggerSpeedPct ?? 0),
    poisonOnHit: result.poisonOnHit + (hero.bonuses.poisonOnHit ?? 0),
    bonusLaserShots: result.bonusLaserShots + (hero.bonuses.bonusLaserShots ?? 0),
    chaosPower: result.chaosPower + (hero.bonuses.chaosPower ?? 0),
    scrapArmor: result.scrapArmor + (hero.bonuses.scrapArmor ?? 0),
  };
}
