import { describe, expect, it } from 'vitest';
import {
  advanceCombat,
  createCombatBuildItem,
  createCombatState,
  type CombatSetup,
  type CombatState,
} from '../src/game/domain/combat';

const noBonuses = {
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
} as const;

function slimeSetup(): CombatSetup {
  const item = createCombatBuildItem(
    'weapon-1',
    { definitionId: 'weapon', triggerIntervalMs: 1000, damage: 10 },
    noBonuses,
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  );
  return {
    playerMaxHp: 100,
    items: new Map([[item.instanceId, item]]),
    enemy: {
      id: 'slime-test',
      name: 'Slime Test',
      maxHp: 1000,
      attackIntervalMs: 10000,
      attackDamage: 0,
      cellInterference: {
        kind: 'slime-cell',
        intervalMs: 2000,
        telegraphMs: 500,
        durationMs: 1800,
      },
    },
  };
}

describe('boss slime-cell interference', () => {
  it('telegraphs an occupied backpack cell then blocks item triggers touching it', () => {
    const setup = slimeSetup();
    const beforeImpact = advanceCombat(createCombatState(setup), setup, 1500);
    expect(beforeImpact.events).toContainEqual({
      kind: 'boss-cell-telegraph',
      atMs: 1500,
      cell: { x: 0, y: 0 },
      impactAtMs: 2000,
    });
    expect(beforeImpact.state.enemyHp).toBe(990);

    const impact = advanceCombat(beforeImpact.state, setup, 500);
    expect(impact.events).toContainEqual({
      kind: 'boss-cell-slimed',
      atMs: 2000,
      cell: { x: 0, y: 0 },
      durationMs: 1800,
    });
    expect(impact.events).toContainEqual({
      kind: 'item-slimed',
      atMs: 2000,
      itemInstanceId: 'weapon-1',
      cell: { x: 0, y: 0 },
    });
    expect(impact.state.enemyHp).toBe(990);
  });

  it('stays invariant across update chunk sizes with slime active', () => {
    const setup = slimeSetup();
    const single = advanceCombat(createCombatState(setup), setup, 6000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 60; index += 1) stepped = advanceCombat(stepped, setup, 100).state;
    expect(stepped).toEqual(single);
  });
});
