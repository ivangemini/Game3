import type { PerkDefinition } from '../domain/perks';
import { WAVE4_PERKS } from './perks.wave4';

export const PROTOTYPE_PERKS: readonly PerkDefinition[] = [
  { id: 'overclock', name: 'Overclock', rarity: 'rare', targetTag: 'device', description: 'Devices trigger 20% faster.', bonuses: { triggerSpeedPct: 20 } },
  { id: 'laser-pet', name: 'Laser Pet', rarity: 'rare', targetTag: 'pet', description: 'Pets fire one extra laser shot when they trigger.', bonuses: { bonusLaserShots: 1 } },
  { id: 'toxic-warranty', name: 'Toxic Warranty', rarity: 'uncommon', targetTag: 'weapon', description: 'Weapons apply +1 poison.', bonuses: { poisonOnHit: 1 } },
  { id: 'chaos-license', name: 'Chaos License', rarity: 'epic', targetTag: 'chaos', description: 'Chaos junk gains +1 chaos power.', bonuses: { chaosPower: 1 } },
  { id: 'scrap-plating', name: 'Scrap Plating', rarity: 'uncommon', targetTag: 'metal', description: 'Metal junk contributes +1 scrap armor.', bonuses: { scrapArmor: 1 } },
  { id: 'bad-idea-energy', name: 'Bad Idea Energy', rarity: 'epic', description: 'Everything triggers 10% faster. Nothing about this is certified.', bonuses: { triggerSpeedPct: 10 } },
  { id: 'signal-booster', name: 'Signal Booster', rarity: 'rare', targetTag: 'antenna', description: 'Antenna junk triggers 25% faster.', bonuses: { triggerSpeedPct: 25 } },
  { id: 'slime-rights', name: 'Slime Rights', rarity: 'rare', targetTag: 'slime', description: 'Slime junk applies +2 poison when it triggers.', bonuses: { poisonOnHit: 2 } },
  { id: 'snack-attack', name: 'Snack Attack', rarity: 'uncommon', targetTag: 'food', description: 'Food triggers 20% faster because nutrition has become tactical.', bonuses: { triggerSpeedPct: 20 } },
  { id: 'hardened-junk', name: 'Hardened Junk', rarity: 'uncommon', targetTag: 'weapon', description: 'Weapons contribute +1 scrap armor at combat start.', bonuses: { scrapArmor: 1 } },
  { id: 'battery-rage', name: 'Battery Rage', rarity: 'rare', targetTag: 'battery', description: 'Battery junk triggers 22% faster and develops opinions about voltage limits.', bonuses: { triggerSpeedPct: 22 } },
  { id: 'catnip-optics', name: 'Catnip Optics', rarity: 'epic', targetTag: 'cat', description: 'Cats fire one additional bonus laser shot.', bonuses: { bonusLaserShots: 1 } },
  { id: 'poison-pension', name: 'Poison Pension', rarity: 'uncommon', targetTag: 'poison', description: 'Poison-tag junk applies +1 poison on every trigger.', bonuses: { poisonOnHit: 1 } },
  { id: 'duck-tape-doctrine', name: 'Duck Tape Doctrine', rarity: 'rare', targetTag: 'duck', description: 'Duck-tag junk contributes +2 scrap armor. Nobody asks how.', bonuses: { scrapArmor: 2 } },
  { id: 'antenna-afterlife', name: 'Antenna Afterlife', rarity: 'epic', targetTag: 'antenna', description: 'Antenna junk triggers 12% faster and contributes +1 scrap armor.', bonuses: { triggerSpeedPct: 12, scrapArmor: 1 } },
  { id: 'magnet-school', name: 'Magnet School', rarity: 'rare', targetTag: 'magnet', description: 'Magnet junk contributes +2 scrap armor by attracting every spare screw in reality.', bonuses: { scrapArmor: 2 } },
  ...WAVE4_PERKS,
];

export const PROTOTYPE_PERK_MAP = new Map(PROTOTYPE_PERKS.map((perk) => [perk.id, perk]));
