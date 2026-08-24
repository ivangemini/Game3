import { describe, expect, it } from 'vitest';
import {
  advanceCombat,
  createCombatBuildItem,
  createCombatState,
  type CombatSetup,
  type CombatState,
} from '../src/game/domain/combat';

const zeroBonuses = {
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
} as const;

function bossSetup(): CombatSetup {
  const item = createCombatBuildItem(
    'weapon-1',
    { definitionId: 'weapon', triggerIntervalMs: 1000, damage: 10 },
    zeroBonuses,
  );
  return {
    playerMaxHp: 100,
    items: new Map([[item.instanceId, item]]),
    enemy: {
      id: 'tv-test',
      name: 'TV Test',
      maxHp: 1000,
      attackIntervalMs: 10000,
      attackDamage: 0,
      interference: {
        kind: 'channel-jam',
        intervalMs: 2000,
        telegraphMs: 500,
        durationMs: 1800,
      },
    },
  };
}

describe('boss channel jam', () => {
  it('telegraphs before impact and suppresses scheduled item triggers while jammed', () => {
    const setup = bossSetup();
    const telegraph = advanceCombat(createCombatState(setup), setup, 1500);
    expect(telegraph.events).toContainEqual({
      kind: 'boss-telegraph',
      atMs: 1500,
      itemInstanceId: 'weapon-1',
      impactAtMs: 2000,
    });

    const impact = advanceCombat(telegraph.state, setup, 500);
    expect(impact.events).toContainEqual({
      kind: 'boss-jammed',
      atMs: 2000,
      itemInstanceId: 'weapon-1',
      durationMs: 1800,
    });
    expect(impact.events).toContainEqual({
      kind: 'item-jammed',
      atMs: 2000,
      itemInstanceId: 'weapon-1',
    });
    expect(impact.state.enemyHp).toBe(990);
  });

  it('remains invariant to update chunk size with boss interference active', () => {
    const setup = bossSetup();
    const single = advanceCombat(createCombatState(setup), setup, 6000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 60; index += 1) {
      stepped = advanceCombat(stepped, setup, 100).state;
    }
    expect(stepped).toEqual(single);
  });
});
