import { describe, expect, it } from 'vitest';
import { CAMPAIGN_ENCOUNTERS, createLoopEncounter } from '../src/game/data/runEncounters';
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

function createEclipseSetup(): CombatSetup {
  const deviceA = createCombatBuildItem(
    'device-a',
    { definitionId: 'device-a', triggerIntervalMs: 500, damage: 3 },
    noBonuses,
    [{ x: 0, y: 0 }],
    false,
    ['device', 'metal'],
  );
  const deviceB = createCombatBuildItem(
    'device-b',
    { definitionId: 'device-b', triggerIntervalMs: 500, damage: 3 },
    noBonuses,
    [{ x: 1, y: 0 }],
    false,
    ['device'],
  );
  const weapon = createCombatBuildItem(
    'weapon-a',
    { definitionId: 'weapon-a', triggerIntervalMs: 500, damage: 3 },
    noBonuses,
    [{ x: 2, y: 0 }],
    false,
    ['weapon'],
  );

  return {
    playerMaxHp: 100,
    items: new Map([
      [deviceA.instanceId, deviceA],
      [deviceB.instanceId, deviceB],
      [weapon.instanceId, weapon],
    ]),
    enemy: {
      id: 'baby-moon-test',
      name: 'Baby Moon Test',
      maxHp: 999,
      attackIntervalMs: 10000,
      attackDamage: 0,
      tagInterference: {
        kind: 'tag-eclipse',
        intervalMs: 2000,
        telegraphMs: 500,
        durationMs: 900,
      },
    },
  };
}

describe('Baby Moon Tag Eclipse', () => {
  it('is a distinct second boss family instead of reusing TV Tyrant interference', () => {
    const encounter = CAMPAIGN_ENCOUNTERS[11];
    expect(encounter?.enemy.id).toBe('baby-moon');
    expect(encounter?.enemy.tagInterference).toEqual({
      kind: 'tag-eclipse', intervalMs: 5200, telegraphMs: 1200, durationMs: 3000,
    });
    expect(encounter?.enemy.interference).toBeUndefined();
    expect(encounter?.enemy.cellInterference).toBeUndefined();
    expect(encounter?.enemy.rowInterference).toBeUndefined();
  });

  it('telegraphs the most represented combat tag with deterministic tie-breaking', () => {
    const setup = createEclipseSetup();
    const initial = createCombatState(setup);

    expect(initial.queue.find((effect) => effect.kind === 'boss-tag-telegraph')).toMatchObject({
      kind: 'boss-tag-telegraph',
      dueAtMs: 1500,
      tag: 'device',
    });
    expect(initial.queue.find((effect) => effect.kind === 'boss-tag-interference')).toMatchObject({
      kind: 'boss-tag-interference',
      dueAtMs: 2000,
      tag: 'device',
    });
  });

  it('suppresses only items carrying the eclipsed tag and reports affected build size', () => {
    const setup = createEclipseSetup();
    const result = advanceCombat(createCombatState(setup), setup, 2600);

    expect(result.events).toContainEqual({
      kind: 'boss-tag-telegraph',
      atMs: 1500,
      tag: 'device',
      impactAtMs: 2000,
      affectedItemCount: 2,
    });
    expect(result.events).toContainEqual({
      kind: 'boss-tag-eclipsed',
      atMs: 2000,
      tag: 'device',
      durationMs: 900,
      affectedItemCount: 2,
    });
    expect(result.events.some(
      (event) => event.kind === 'item-eclipsed' && event.itemInstanceId === 'device-a' && event.tag === 'device',
    )).toBe(true);
    expect(result.events.some(
      (event) => event.kind === 'item-eclipsed' && event.itemInstanceId === 'device-b' && event.tag === 'device',
    )).toBe(true);
    expect(result.events.some(
      (event) => event.kind === 'item-eclipsed' && event.itemInstanceId === 'weapon-a',
    )).toBe(false);
  });

  it('keeps the eclipse queue invariant to render/update chunk size', () => {
    const setup = createEclipseSetup();
    const single = advanceCombat(createCombatState(setup), setup, 6000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 60; index += 1) stepped = advanceCombat(stepped, setup, 100).state;
    expect(stepped).toEqual(single);
  });

  it('escalates eclipse cadence in corrupted loops without adding another bespoke attack', () => {
    const campaign = CAMPAIGN_ENCOUNTERS[11]?.enemy.tagInterference;
    const loop = createLoopEncounter(2, 11, 'baby-moon-loop-test').enemy.tagInterference;
    expect(campaign).toBeDefined();
    expect(loop).toBeDefined();
    expect(loop?.kind).toBe('tag-eclipse');
    expect(loop?.intervalMs).toBeLessThan(campaign?.intervalMs ?? Infinity);
  });
});
