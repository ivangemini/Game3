import { describe, expect, it } from 'vitest';
import { audioCueForTimeTaxEvent } from '../src/game/audio/audioCues';
import {
  advanceCombatWithBossRules,
  fastestTimeTaxTarget,
  timeTaxDefinitionForEnemyId,
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

function createDeadlineSetup(): CombatSetup {
  const fast = createCombatBuildItem(
    'fast-carry',
    { definitionId: 'fast-carry', triggerIntervalMs: 1000, damage: 4 },
    noBonuses,
    [{ x: 1, y: 1 }],
    false,
    ['weapon'],
  );
  const slow = createCombatBuildItem(
    'slow-backup',
    { definitionId: 'slow-backup', triggerIntervalMs: 1600, damage: 3 },
    noBonuses,
    [{ x: 3, y: 2 }],
    false,
    ['device'],
  );
  return {
    playerMaxHp: 100,
    items: new Map([
      [slow.instanceId, slow],
      [fast.instanceId, fast],
    ]),
    enemy: {
      id: 'deadline-snail',
      name: 'Deadline Snail',
      maxHp: 9999,
      attackIntervalMs: 10000,
      attackDamage: 0,
    },
  };
}

describe('Deadline Snail Time Tax', () => {
  it('replaces the second campaign boss with the new boss family', () => {
    const encounter = getRunEncounter(
      { ...createInitialRunProgress(), campaignEncounterIndex: 5 },
      'deadline-test',
    );
    expect(encounter).not.toBeNull();
    expect(encounter?.encounterId).toBe('w2-deadline-snail');
    expect(encounter?.enemy.id).toBe('deadline-snail');
    expect(encounter?.enemy.interference).toBeUndefined();
    expect(encounter?.enemy.tagInterference).toBeUndefined();
  });

  it('targets the fastest meaningful combat item with stable instance-id tie breaking', () => {
    const setup = createDeadlineSetup();
    expect(fastestTimeTaxTarget(setup.items)?.instanceId).toBe('fast-carry');

    const a = createCombatBuildItem('a-fast', { definitionId: 'a', triggerIntervalMs: 900, damage: 1 }, noBonuses);
    const z = createCombatBuildItem('z-fast', { definitionId: 'z', triggerIntervalMs: 900, damage: 1 }, noBonuses);
    expect(fastestTimeTaxTarget(new Map([[z.instanceId, z], [a.instanceId, a]]))?.instanceId).toBe('a-fast');
  });

  it('telegraphs the carry then delays only its next queued trigger', () => {
    const setup = createDeadlineSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 4800);

    expect(result.events).toContainEqual({
      kind: 'boss-time-tax-telegraph',
      atMs: 3900,
      itemInstanceId: 'fast-carry',
      impactAtMs: 4800,
      triggerIntervalMs: 1000,
    });
    expect(result.events).toContainEqual({
      kind: 'boss-time-tax-impact',
      atMs: 4800,
      itemInstanceId: 'fast-carry',
      delayMs: 1200,
      previousDueAtMs: 5000,
      nextDueAtMs: 6200,
    });

    const fastTrigger = result.state.queue.find(
      (effect) => effect.kind === 'item-trigger' && effect.itemInstanceId === 'fast-carry',
    );
    const slowTrigger = result.state.queue.find(
      (effect) => effect.kind === 'item-trigger' && effect.itemInstanceId === 'slow-backup',
    );
    expect(fastTrigger?.dueAtMs).toBe(6200);
    expect(slowTrigger?.dueAtMs).toBe(6400);
  });

  it('keeps Time Tax invariant to render/update chunk size', () => {
    const setup = createDeadlineSetup();
    const single = advanceCombatWithBossRules(createCombatState(setup), setup, 12000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 120; index += 1) {
      stepped = advanceCombatWithBossRules(stepped, setup, 100).state;
    }
    expect(stepped).toEqual(single);
  });

  it('accelerates cadence in corrupted loops and exposes semantic boss audio cues', () => {
    const base = timeTaxDefinitionForEnemyId('deadline-snail');
    const loop2 = timeTaxDefinitionForEnemyId('loop-2-deadline-snail');
    expect(base).not.toBeNull();
    expect(loop2).not.toBeNull();
    expect(loop2!.intervalMs).toBeLessThan(base!.intervalMs);
    expect(loop2!.delayMs).toBe(base!.delayMs);

    expect(audioCueForTimeTaxEvent({
      kind: 'boss-time-tax-telegraph',
      atMs: 3900,
      itemInstanceId: 'fast-carry',
      impactAtMs: 4800,
      triggerIntervalMs: 1000,
    })).toMatchObject({ id: 'boss.time-tax.telegraph', priority: 3, group: 'boss' });
    expect(audioCueForTimeTaxEvent({
      kind: 'boss-time-tax-impact',
      atMs: 4800,
      itemInstanceId: 'fast-carry',
      delayMs: 1200,
      previousDueAtMs: 5000,
      nextDueAtMs: 6200,
    })).toMatchObject({ id: 'boss.time-tax.impact', priority: 4, group: 'boss' });
  });
});
