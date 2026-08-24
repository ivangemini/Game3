import { describe, expect, it } from 'vitest';
import { PROTOTYPE_PERK_MAP, PROTOTYPE_PERKS } from '../src/game/data/perks';
import { applyPerkBonuses, generatePerkChoices } from '../src/game/domain/perks';
import type { ItemDefinition } from '../src/game/domain/types';

const device: ItemDefinition = {
  id: 'device',
  name: 'Device',
  shape: [{ x: 0, y: 0 }],
  tags: ['device', 'metal'],
  rarity: 'common',
  description: 'test',
};

describe('run perks', () => {
  it('generates deterministic unique choices and excludes selected perks', () => {
    const first = generatePerkChoices(PROTOTYPE_PERKS, 'seed-42', 0, ['overclock'], 3);
    const second = generatePerkChoices(PROTOTYPE_PERKS, 'seed-42', 0, ['overclock'], 3);
    expect(first.map((perk) => perk.id)).toEqual(second.map((perk) => perk.id));
    expect(new Set(first.map((perk) => perk.id)).size).toBe(first.length);
    expect(first.map((perk) => perk.id)).not.toContain('overclock');
  });

  it('applies tag-targeted and global perk bonuses without replacing synergy bonuses', () => {
    const result = applyPerkBonuses(
      device,
      { triggerSpeedPct: 25, poisonOnHit: 0, bonusLaserShots: 0, chaosPower: 0, scrapArmor: 1 },
      PROTOTYPE_PERK_MAP,
      ['overclock', 'bad-idea-energy', 'scrap-plating'],
    );
    expect(result.triggerSpeedPct).toBe(55);
    expect(result.scrapArmor).toBe(2);
  });
});
