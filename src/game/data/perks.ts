import type { PerkDefinition } from '../domain/perks';

export const PROTOTYPE_PERKS: readonly PerkDefinition[] = [
  {
    id: 'overclock',
    name: 'Overclock',
    rarity: 'rare',
    targetTag: 'device',
    description: 'Devices trigger 20% faster.',
    bonuses: { triggerSpeedPct: 20 },
  },
  {
    id: 'laser-pet',
    name: 'Laser Pet',
    rarity: 'rare',
    targetTag: 'pet',
    description: 'Pets fire one extra laser shot when they trigger.',
    bonuses: { bonusLaserShots: 1 },
  },
  {
    id: 'toxic-warranty',
    name: 'Toxic Warranty',
    rarity: 'uncommon',
    targetTag: 'weapon',
    description: 'Weapons apply +1 poison.',
    bonuses: { poisonOnHit: 1 },
  },
  {
    id: 'chaos-license',
    name: 'Chaos License',
    rarity: 'epic',
    targetTag: 'chaos',
    description: 'Chaos junk gains +1 chaos power.',
    bonuses: { chaosPower: 1 },
  },
  {
    id: 'scrap-plating',
    name: 'Scrap Plating',
    rarity: 'uncommon',
    targetTag: 'metal',
    description: 'Metal junk contributes +1 scrap armor.',
    bonuses: { scrapArmor: 1 },
  },
  {
    id: 'bad-idea-energy',
    name: 'Bad Idea Energy',
    rarity: 'epic',
    description: 'Everything triggers 10% faster. Nothing about this is certified.',
    bonuses: { triggerSpeedPct: 10 },
  },
];

export const PROTOTYPE_PERK_MAP = new Map(PROTOTYPE_PERKS.map((perk) => [perk.id, perk]));
