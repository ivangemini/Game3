import { createSeededRng } from './rng';
import type { ItemBonuses } from './synergies';
import type { ItemDefinition, ItemTag, Rarity } from './types';

export interface PerkDefinition {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly description: string;
  readonly targetTag?: ItemTag;
  readonly bonuses: Partial<ItemBonuses>;
}

interface MutableBonuses {
  triggerSpeedPct: number;
  poisonOnHit: number;
  bonusLaserShots: number;
  chaosPower: number;
  scrapArmor: number;
}

export function generatePerkChoices(
  definitions: readonly PerkDefinition[],
  runSeed: string | number,
  choiceIndex: number,
  selectedPerkIds: readonly string[],
  count = 3,
): PerkDefinition[] {
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0) throw new RangeError('choiceIndex must be non-negative');
  const selected = new Set(selectedPerkIds);
  const eligible = definitions.filter((perk) => !selected.has(perk.id));
  if (eligible.length <= count) return [...eligible].sort((a, b) => a.id.localeCompare(b.id));
  return createSeededRng(`${runSeed}:perk:${choiceIndex}`).shuffle(eligible).slice(0, count);
}

export function applyPerkBonuses(
  item: ItemDefinition,
  base: ItemBonuses | undefined,
  perkDefinitions: ReadonlyMap<string, PerkDefinition>,
  selectedPerkIds: readonly string[],
): ItemBonuses {
  const result: MutableBonuses = {
    triggerSpeedPct: base?.triggerSpeedPct ?? 0,
    poisonOnHit: base?.poisonOnHit ?? 0,
    bonusLaserShots: base?.bonusLaserShots ?? 0,
    chaosPower: base?.chaosPower ?? 0,
    scrapArmor: base?.scrapArmor ?? 0,
  };
  for (const perkId of selectedPerkIds) {
    const perk = perkDefinitions.get(perkId);
    if (!perk || (perk.targetTag && !item.tags.includes(perk.targetTag))) continue;
    result.triggerSpeedPct += perk.bonuses.triggerSpeedPct ?? 0;
    result.poisonOnHit += perk.bonuses.poisonOnHit ?? 0;
    result.bonusLaserShots += perk.bonuses.bonusLaserShots ?? 0;
    result.chaosPower += perk.bonuses.chaosPower ?? 0;
    result.scrapArmor += perk.bonuses.scrapArmor ?? 0;
  }
  return result;
}
