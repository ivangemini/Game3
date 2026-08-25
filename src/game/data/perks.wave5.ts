import type { PerkDefinition } from '../domain/perks';

export const WAVE5_PERKS: readonly PerkDefinition[] = [
  {
    id: 'weaponized-paperwork',
    name: 'Weaponized Paperwork',
    rarity: 'rare',
    targetTag: 'weapon',
    description: 'Weapons trigger 12% faster and apply +1 poison. The forms were sharpened.',
    bonuses: { triggerSpeedPct: 12, poisonOnHit: 1 },
  },
  {
    id: 'battery-afterparty',
    name: 'Battery Afterparty',
    rarity: 'epic',
    targetTag: 'battery',
    description: 'Battery junk fires one bonus laser shot when it triggers. Voltage etiquette has ended.',
    bonuses: { bonusLaserShots: 1 },
  },
  {
    id: 'magnetic-tenure',
    name: 'Magnetic Tenure',
    rarity: 'rare',
    targetTag: 'magnet',
    description: 'Magnet junk triggers 12% faster and contributes +1 scrap armor.',
    bonuses: { triggerSpeedPct: 12, scrapArmor: 1 },
  },
  {
    id: 'poison-subscription',
    name: 'Poison Subscription',
    rarity: 'rare',
    targetTag: 'poison',
    description: 'Poison junk triggers 15% faster and applies +1 additional poison.',
    bonuses: { triggerSpeedPct: 15, poisonOnHit: 1 },
  },
  {
    id: 'catastrophic-catnip',
    name: 'Catastrophic Catnip',
    rarity: 'uncommon',
    targetTag: 'cat',
    description: 'Cats trigger 10% faster and contribute +1 scrap armor while pretending not to care.',
    bonuses: { triggerSpeedPct: 10, scrapArmor: 1 },
  },
  {
    id: 'duck-emergency-powers',
    name: 'Duck Emergency Powers',
    rarity: 'epic',
    targetTag: 'duck',
    description: 'Duck junk gains +1 chaos power and +1 scrap armor under temporary permanent emergency law.',
    bonuses: { chaosPower: 1, scrapArmor: 1 },
  },
];
