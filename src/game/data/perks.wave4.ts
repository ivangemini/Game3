import type { PerkDefinition } from '../domain/perks';

export const WAVE4_PERKS: readonly PerkDefinition[] = [
  {
    id: 'laser-tax-refund',
    name: 'Laser Tax Refund',
    rarity: 'rare',
    targetTag: 'laser',
    description: 'Laser-tag junk fires one additional bonus laser shot.',
    bonuses: { bonusLaserShots: 1 },
  },
  {
    id: 'pet-union',
    name: 'Pet Union',
    rarity: 'rare',
    targetTag: 'pet',
    description: 'Pets trigger 10% faster and contribute +1 scrap armor after collective bargaining.',
    bonuses: { triggerSpeedPct: 10, scrapArmor: 1 },
  },
  {
    id: 'slime-shell',
    name: 'Slime Shell',
    rarity: 'uncommon',
    targetTag: 'slime',
    description: 'Slime junk applies +1 poison and contributes +1 scrap armor.',
    bonuses: { poisonOnHit: 1, scrapArmor: 1 },
  },
  {
    id: 'food-chain-reaction',
    name: 'Food Chain Reaction',
    rarity: 'rare',
    targetTag: 'food',
    description: 'Food-tag junk gains +1 chaos power. Lunch is now a strategic incident.',
    bonuses: { chaosPower: 1 },
  },
  {
    id: 'device-liability',
    name: 'Device Liability',
    rarity: 'epic',
    targetTag: 'device',
    description: 'Every device applies +1 poison because none of this passed certification.',
    bonuses: { poisonOnHit: 1 },
  },
];
