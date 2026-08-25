import { describe, expect, it } from 'vitest';
import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../src/game/data/combatProfiles';
import { PROTOTYPE_HEROES, PROTOTYPE_HERO_MAP } from '../src/game/data/heroes';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { PROTOTYPE_PERK_MAP } from '../src/game/data/perks';
import { createCombatBuild } from '../src/game/domain/combatBuild';
import { applyHeroBonuses } from '../src/game/domain/heroes';
import type { InventoryState } from '../src/game/domain/inventory';

const inventory: InventoryState = {
  width: 6,
  height: 5,
  blockedCells: [],
  items: [
    { instanceId: 'radio', definitionId: 'pocket-radio', origin: { x: 0, y: 0 }, rotation: 0 },
    { instanceId: 'toaster', definitionId: 'cursed-toaster', origin: { x: 1, y: 0 }, rotation: 0 },
    { instanceId: 'slime', definitionId: 'slime-can', origin: { x: 3, y: 0 }, rotation: 0 },
    { instanceId: 'cat', definitionId: 'laser-cat', origin: { x: 0, y: 2 }, rotation: 0 },
  ],
};

describe('run heroes', () => {
  it('defines four soft rule-benders with one economy hero and three tag heroes', () => {
    expect(PROTOTYPE_HEROES).toHaveLength(4);
    expect(new Set(PROTOTYPE_HEROES.map((hero) => hero.id)).size).toBe(4);
    expect(PROTOTYPE_HERO_MAP.get('scavenger')?.startingCoinsBonus).toBe(25);
    expect(PROTOTYPE_HERO_MAP.get('engineer')?.targetTag).toBe('device');
    expect(PROTOTYPE_HERO_MAP.get('alchemist')?.targetTag).toBe('poison');
    expect(PROTOTYPE_HERO_MAP.get('beastfriend')?.targetTag).toBe('pet');
  });

  it('applies hero bonuses only to matching tags', () => {
    const engineer = PROTOTYPE_HERO_MAP.get('engineer');
    const radio = PROTOTYPE_ITEM_MAP.get('pocket-radio');
    const cat = PROTOTYPE_ITEM_MAP.get('laser-cat');
    expect(engineer).toBeDefined();
    expect(radio).toBeDefined();
    expect(cat).toBeDefined();
    if (!engineer || !radio || !cat) return;

    expect(applyHeroBonuses(radio, undefined, engineer).triggerSpeedPct).toBe(12);
    expect(applyHeroBonuses(cat, undefined, engineer).triggerSpeedPct).toBe(0);
  });

  it('layers hero, spatial synergy and perk bonuses in the real combat build', () => {
    const engineer = PROTOTYPE_HERO_MAP.get('engineer');
    const build = createCombatBuild(
      inventory,
      PROTOTYPE_ITEM_MAP,
      PROTOTYPE_COMBAT_PROFILE_MAP,
      PROTOTYPE_PERK_MAP,
      ['overclock'],
      engineer,
    );

    const toaster = build.items.get('toaster');
    expect(toaster).toBeDefined();
    if (!toaster) return;
    // Pocket Radio touches the toaster: +15% antenna synergy, +12% Engineer and +20% Overclock.
    expect(toaster.triggerIntervalMs).toBe(Math.round(2200 / 1.47));
  });

  it('gives Alchemist poison output and Beastfriend pet speed without affecting unrelated items', () => {
    const alchemistBuild = createCombatBuild(
      inventory, PROTOTYPE_ITEM_MAP, PROTOTYPE_COMBAT_PROFILE_MAP, PROTOTYPE_PERK_MAP, [],
      PROTOTYPE_HERO_MAP.get('alchemist'),
    );
    expect(alchemistBuild.items.get('slime')?.poisonOnHit).toBe(3);
    expect(alchemistBuild.items.get('cat')?.poisonOnHit).toBe(0);

    const beastBuild = createCombatBuild(
      inventory, PROTOTYPE_ITEM_MAP, PROTOTYPE_COMBAT_PROFILE_MAP, PROTOTYPE_PERK_MAP, [],
      PROTOTYPE_HERO_MAP.get('beastfriend'),
    );
    expect(beastBuild.items.get('cat')?.triggerIntervalMs).toBe(Math.round(1800 / 1.15));
    expect(beastBuild.items.get('radio')?.triggerIntervalMs).toBe(2600);
  });
});
