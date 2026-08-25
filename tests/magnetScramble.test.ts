import { describe, expect, it } from 'vitest';
import {
  advanceCombat,
  createCombatBuildItem,
  createCombatState,
  type CombatSetup,
  type CombatState,
} from '../src/game/domain/combat';
import type { ItemBonuses } from '../src/game/domain/synergies';

const noBonuses: ItemBonuses = {
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
};

function createMagnetSetup(): CombatSetup {
  const normal = createCombatBuildItem(
    'normal-row-0',
    { definitionId: 'normal', triggerIntervalMs: 500, damage: 3 },
    noBonuses,
    [{ x: 0, y: 0 }],
    false,
  );
  const metal = createCombatBuildItem(
    'metal-row-2',
    { definitionId: 'metal', triggerIntervalMs: 500, damage: 4 },
    noBonuses,
    [{ x: 2, y: 2 }, { x: 3, y: 2 }],
    true,
  );

  return {
    playerMaxHp: 100,
    items: new Map([
      [normal.instanceId, normal],
      [metal.instanceId, metal],
    ]),
    enemy: {
      id: 'magnet-boss',
      name: 'Magnet Boss',
      maxHp: 999,
      attackIntervalMs: 10000,
      attackDamage: 0,
      rowInterference: {
        kind: 'magnet-row',
        intervalMs: 2000,
        telegraphMs: 500,
        durationMs: 900,
      },
    },
  };
}

describe('magnet row scramble', () => {
  it('prioritizes rows containing metal-tagged combat items', () => {
    const setup = createMagnetSetup();
    const initial = createCombatState(setup);
    const telegraph = initial.queue.find((effect) => effect.kind === 'boss-row-telegraph');
    const impact = initial.queue.find((effect) => effect.kind === 'boss-row-interference');

    expect(telegraph).toMatchObject({ kind: 'boss-row-telegraph', row: 2, dueAtMs: 1500 });
    expect(impact).toMatchObject({ kind: 'boss-row-interference', row: 2, dueAtMs: 2000 });
  });

  it('suppresses triggers for every item crossing the scrambled row', () => {
    const setup = createMagnetSetup();
    const result = advanceCombat(createCombatState(setup), setup, 2600);

    expect(result.events).toContainEqual({
      kind: 'boss-row-telegraph',
      atMs: 1500,
      row: 2,
      impactAtMs: 2000,
      magneticPriority: true,
    });
    expect(result.events).toContainEqual({
      kind: 'boss-row-scrambled',
      atMs: 2000,
      row: 2,
      durationMs: 900,
    });
    expect(result.events.some(
      (event) => event.kind === 'item-scrambled' && event.itemInstanceId === 'metal-row-2' && event.row === 2,
    )).toBe(true);
    expect(result.events.some(
      (event) => event.kind === 'item-scrambled' && event.itemInstanceId === 'normal-row-0',
    )).toBe(false);
  });

  it('falls back to occupied rows when the build contains no metal', () => {
    const item = createCombatBuildItem(
      'plain-row-3',
      { definitionId: 'plain', triggerIntervalMs: 700, damage: 2 },
      noBonuses,
      [{ x: 1, y: 3 }],
      false,
    );
    const setup: CombatSetup = {
      playerMaxHp: 100,
      items: new Map([[item.instanceId, item]]),
      enemy: {
        id: 'fallback-magnet',
        name: 'Fallback Magnet',
        maxHp: 999,
        attackIntervalMs: 10000,
        attackDamage: 0,
        rowInterference: { kind: 'magnet-row', intervalMs: 2000, telegraphMs: 500, durationMs: 900 },
      },
    };

    const result = advanceCombat(createCombatState(setup), setup, 1600);
    expect(result.events).toContainEqual({
      kind: 'boss-row-telegraph',
      atMs: 1500,
      row: 3,
      impactAtMs: 2000,
      magneticPriority: false,
    });
  });

  it('is invariant to render/update chunk size', () => {
    const setup = createMagnetSetup();
    const single = advanceCombat(createCombatState(setup), setup, 6000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 60; index += 1) {
      stepped = advanceCombat(stepped, setup, 100).state;
    }
    expect(stepped).toEqual(single);
  });
});
