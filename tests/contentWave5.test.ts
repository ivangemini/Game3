import { describe, expect, it } from 'vitest';
import {
  LOOP_ANOMALY_MODIFIERS,
  LOOP_WORLD_MODIFIERS,
  WORLD_MODIFIERS,
  createLoopEncounter,
  modifiersForLoopWorld,
} from '../src/game/data/runEncounters';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { PROTOTYPE_PERK_MAP, PROTOTYPE_PERKS } from '../src/game/data/perks';
import { WAVE5_PERKS } from '../src/game/data/perks.wave5';
import { WAVE5_RUN_EVENTS } from '../src/game/data/runEvents.wave5';
import { applyPerkBonuses } from '../src/game/domain/perks';

const ZERO_BONUSES = {
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
};

describe('content wave 5', () => {
  it('adds six unique perks without expanding the authored item catalog', () => {
    expect(WAVE5_PERKS).toHaveLength(6);
    expect(PROTOTYPE_PERKS).toHaveLength(27);
    expect(new Set(WAVE5_PERKS.map((perk) => perk.id)).size).toBe(WAVE5_PERKS.length);
    for (const perk of WAVE5_PERKS) {
      expect(PROTOTYPE_PERK_MAP.get(perk.id)).toEqual(perk);
    }
  });

  it('makes wave-5 perks interact with existing item families through the shared bonus vocabulary', () => {
    const battery = PROTOTYPE_ITEM_MAP.get('angry-battery');
    const poison = PROTOTYPE_ITEM_MAP.get('poison-flask');
    const duck = PROTOTYPE_ITEM_MAP.get('mutant-duck');
    if (!battery || !poison || !duck) throw new Error('Missing baseline items');

    expect(applyPerkBonuses(battery, ZERO_BONUSES, PROTOTYPE_PERK_MAP, ['battery-afterparty']).bonusLaserShots).toBe(1);
    expect(applyPerkBonuses(poison, ZERO_BONUSES, PROTOTYPE_PERK_MAP, ['poison-subscription'])).toMatchObject({
      triggerSpeedPct: 15,
      poisonOnHit: 1,
    });
    expect(applyPerkBonuses(duck, ZERO_BONUSES, PROTOTYPE_PERK_MAP, ['duck-emergency-powers'])).toMatchObject({
      chaosPower: 1,
      scrapArmor: 1,
    });
  });

  it('keeps launch campaign mutations stable while doubling the deep-loop mutation pool', () => {
    expect(WORLD_MODIFIERS).toHaveLength(6);
    expect(LOOP_ANOMALY_MODIFIERS).toHaveLength(6);
    expect(LOOP_WORLD_MODIFIERS).toHaveLength(12);
    expect(new Set(LOOP_WORLD_MODIFIERS.map((modifier) => modifier.id)).size).toBe(12);

    const launchIds = new Set(WORLD_MODIFIERS.map((modifier) => modifier.id));
    const loop2 = modifiersForLoopWorld('wave5-loop', 2, 1);
    expect(loop2).toHaveLength(2);
    expect(loop2.every((modifier) => launchIds.has(modifier.id))).toBe(true);

    const anomalyIds = new Set(LOOP_ANOMALY_MODIFIERS.map((modifier) => modifier.id));
    const deepSelections = Array.from({ length: 40 }, (_, index) =>
      modifiersForLoopWorld(`wave5-loop-${index}`, 3, (index % 4) + 1),
    ).flat();
    expect(deepSelections.some((modifier) => anomalyIds.has(modifier.id))).toBe(true);
  });

  it('introduces alternate non-boss enemy families from loop 3 without changing loop 2', () => {
    const loop2Fight = createLoopEncounter(2, 0, 'variant-seed');
    const loop3Fight = createLoopEncounter(3, 0, 'variant-seed');
    const loop2Elite = createLoopEncounter(2, 1, 'variant-seed');
    const loop3Elite = createLoopEncounter(3, 1, 'variant-seed');

    expect(loop2Fight.enemy.id).toContain('static-rats');
    expect(loop3Fight.enemy.id).toContain('receipt-wasps');
    expect(loop2Elite.enemy.id).toContain('trash-brute');
    expect(loop3Elite.enemy.id).toContain('dumpster-oracle');
    expect(loop3Fight.title).toContain('Receipt Wasps');
    expect(loop3Elite.title).toContain('Dumpster Oracle');
  });

  it('adds six event definitions with two meaningful choices each', () => {
    expect(WAVE5_RUN_EVENTS).toHaveLength(6);
    expect(new Set(WAVE5_RUN_EVENTS.map((event) => event.id)).size).toBe(6);
    for (const event of WAVE5_RUN_EVENTS) {
      expect(event.choices).toHaveLength(2);
      expect(new Set(event.choices.map((choice) => choice.id)).size).toBe(2);
      expect(event.choices.some((choice) => choice.reward.kind === 'item')).toBe(true);
      expect(event.choices.some((choice) => choice.reward.kind !== 'item')).toBe(true);
    }
  });
});
