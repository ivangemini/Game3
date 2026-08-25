import { describe, expect, it } from 'vitest';
import { audioCueForClutterCrushEvent } from '../src/game/audio/audioCues';
import {
  advanceCombatWithBossRules,
  clutterCrushDefinitionForEnemyId,
  looseClutterItems,
} from '../src/game/domain/bossCombat';
import {
  createCombatBuildItem,
  createCombatState,
  type CombatSetup,
  type CombatState,
} from '../src/game/domain/combat';
import { createInitialRunProgress } from '../src/game/domain/runProgression';
import type { ItemBonuses } from '../src/game/domain/synergies';
import { getRunEncounter } from '../src/game/data/runEncounters';

const noBonuses: ItemBonuses = {
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
};

function item(
  instanceId: string,
  x: number,
  y: number,
  bonuses: ItemBonuses = noBonuses,
) {
  return createCombatBuildItem(
    instanceId,
    { definitionId: instanceId, triggerIntervalMs: 10000, damage: 1 },
    bonuses,
    [{ x, y }],
  );
}

function createClosetSetup(): CombatSetup {
  const anchorA = item('anchor-a', 0, 0);
  const anchorB = item('anchor-b', 1, 0);
  const looseA = item('loose-a', 4, 3, { ...noBonuses, scrapArmor: 1 });
  const looseB = item('loose-b', 5, 1);
  return {
    playerMaxHp: 100,
    items: new Map([
      [looseB.instanceId, looseB],
      [anchorB.instanceId, anchorB],
      [looseA.instanceId, looseA],
      [anchorA.instanceId, anchorA],
    ]),
    enemy: {
      id: 'closet-monster',
      name: 'Closet Monster',
      maxHp: 9999,
      attackIntervalMs: 10000,
      attackDamage: 0,
    },
  };
}

describe('Closet Monster Clutter Crush', () => {
  it('replaces the third campaign boss with a distinct boss family', () => {
    const encounter = getRunEncounter(
      { ...createInitialRunProgress(), campaignEncounterIndex: 8 },
      'closet-test',
    );
    expect(encounter).not.toBeNull();
    expect(encounter?.encounterId).toBe('w3-closet-monster');
    expect(encounter?.enemy.id).toBe('closet-monster');
    expect(encounter?.enemy.interference).toBeUndefined();
    expect(encounter?.enemy.cellInterference).toBeUndefined();
    expect(encounter?.enemy.rowInterference).toBeUndefined();
    expect(encounter?.enemy.tagInterference).toBeUndefined();
  });

  it('treats orthogonally touching items as anchored and returns only isolated junk', () => {
    const setup = createClosetSetup();
    expect(looseClutterItems(setup.items).map((candidate) => candidate.instanceId)).toEqual([
      'loose-a',
      'loose-b',
    ]);
  });

  it('telegraphs loose footprints then deals three pressure per loose item through shield first', () => {
    const setup = createClosetSetup();
    const initial = createCombatState(setup);
    expect(initial.playerShield).toBe(2);

    const result = advanceCombatWithBossRules(initial, setup, 6000);
    expect(result.events).toContainEqual({
      kind: 'boss-clutter-telegraph',
      atMs: 4800,
      itemInstanceIds: ['loose-a', 'loose-b'],
      impactAtMs: 6000,
      affectedItemCount: 2,
    });
    expect(result.events).toContainEqual({
      kind: 'boss-clutter-impact',
      atMs: 6000,
      itemInstanceIds: ['loose-a', 'loose-b'],
      affectedItemCount: 2,
      damagePerLooseItem: 3,
      totalDamage: 6,
      absorbedByShield: 2,
      healthDamage: 4,
    });
    expect(result.state.playerShield).toBe(0);
    expect(result.state.playerHp).toBe(96);
  });

  it('deals zero Clutter Crush damage when every item is anchored', () => {
    const a = item('a', 0, 0);
    const b = item('b', 1, 0);
    const setup: CombatSetup = {
      playerMaxHp: 100,
      items: new Map([[a.instanceId, a], [b.instanceId, b]]),
      enemy: { id: 'closet-monster', name: 'Closet Monster', maxHp: 9999, attackIntervalMs: 10000, attackDamage: 0 },
    };
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 6000);
    const impact = result.events.find((event) => event.kind === 'boss-clutter-impact');
    expect(impact).toMatchObject({ affectedItemCount: 0, totalDamage: 0, healthDamage: 0 });
    expect(result.state.playerHp).toBe(100);
  });

  it('keeps Clutter Crush chunk-invariant, scales loop cadence and exposes semantic audio', () => {
    const setup = createClosetSetup();
    const single = advanceCombatWithBossRules(createCombatState(setup), setup, 12000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 120; index += 1) {
      stepped = advanceCombatWithBossRules(stepped, setup, 100).state;
    }
    expect(stepped).toEqual(single);

    const base = clutterCrushDefinitionForEnemyId('closet-monster');
    const loop2 = clutterCrushDefinitionForEnemyId('loop-2-closet-monster');
    expect(base).not.toBeNull();
    expect(loop2).not.toBeNull();
    expect(loop2!.intervalMs).toBeLessThan(base!.intervalMs);
    expect(loop2!.damagePerLooseItem).toBe(base!.damagePerLooseItem);

    expect(audioCueForClutterCrushEvent({
      kind: 'boss-clutter-telegraph',
      atMs: 4800,
      itemInstanceIds: ['loose-a'],
      impactAtMs: 6000,
      affectedItemCount: 1,
    })).toMatchObject({ id: 'boss.clutter.telegraph', priority: 3, group: 'boss' });
    expect(audioCueForClutterCrushEvent({
      kind: 'boss-clutter-impact',
      atMs: 6000,
      itemInstanceIds: ['loose-a'],
      affectedItemCount: 1,
      damagePerLooseItem: 3,
      totalDamage: 3,
      absorbedByShield: 0,
      healthDamage: 3,
    })).toMatchObject({ id: 'boss.clutter.impact', priority: 4, group: 'boss' });
  });
});
