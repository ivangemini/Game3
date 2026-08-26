import { describe, expect, it } from 'vitest';
import {
  audioCueForDuplicateDebtEvent,
  audioCueForEdgeRentEvent,
} from '../src/game/audio/audioCues';
import { createLoopEncounter } from '../src/game/data/runEncounters';
import {
  advanceCombatWithBossRules,
  duplicateDebtDefinitionForEnemyId,
  duplicateDebtTarget,
  edgeRentDefinitionForEnemyId,
  edgeRentItems,
} from '../src/game/domain/bossCombat';
import {
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

const shieldBonuses: ItemBonuses = { ...noBonuses, scrapArmor: 2 };
const smallShieldBonuses: ItemBonuses = { ...noBonuses, scrapArmor: 1 };

function makeItem(
  instanceId: string,
  definitionId: string,
  x: number,
  y: number,
  bonuses: ItemBonuses = noBonuses,
) {
  return createCombatBuildItem(
    instanceId,
    { definitionId, triggerIntervalMs: 20000, damage: 0 },
    bonuses,
    [{ x, y }],
    false,
    ['weapon'],
  );
}

function duplicateSetup(withDuplicates = true): CombatSetup {
  const items = withDuplicates
    ? [
        makeItem('dup-a', 'laser-cat', 1, 1, shieldBonuses),
        makeItem('dup-b', 'laser-cat', 2, 1),
        makeItem('dup-c', 'laser-cat', 3, 1),
        makeItem('unique', 'angry-battery', 2, 2),
      ]
    : [
        makeItem('one', 'laser-cat', 1, 1, shieldBonuses),
        makeItem('two', 'angry-battery', 2, 1),
        makeItem('three', 'cursed-toaster', 3, 1),
      ];
  return {
    playerMaxHp: 100,
    items: new Map(items.map((item) => [item.instanceId, item])),
    enemy: {
      id: 'copycat-auditor',
      name: 'Copycat Auditor',
      maxHp: 9999,
      attackIntervalMs: 20000,
      attackDamage: 0,
    },
  };
}

function edgeSetup(): CombatSetup {
  const items = [
    makeItem('left-edge', 'laser-cat', 0, 1, smallShieldBonuses),
    makeItem('center', 'angry-battery', 2, 2),
    makeItem('right-edge', 'cursed-toaster', 5, 2),
    makeItem('bottom-edge', 'mutant-duck', 3, 4),
  ];
  return {
    playerMaxHp: 100,
    items: new Map(items.map((item) => [item.instanceId, item])),
    enemy: {
      id: 'border-shark',
      name: 'Border Shark',
      maxHp: 9999,
      attackIntervalMs: 20000,
      attackDamage: 0,
    },
  };
}

describe('Corrupted Loop boss families 5 and 6', () => {
  it('rotates Copycat Auditor and Border Shark into even corrupted loops', () => {
    const loop2Boss2 = createLoopEncounter(2, 5, 'six-family');
    const loop2Boss3 = createLoopEncounter(2, 8, 'six-family');
    const loop3Boss2 = createLoopEncounter(3, 5, 'six-family');
    const loop3Boss3 = createLoopEncounter(3, 8, 'six-family');

    expect(loop2Boss2.enemy.id).toBe('loop-2-copycat-auditor');
    expect(loop2Boss2.title).toBe('Corrupted Copycat Auditor');
    expect(loop2Boss3.enemy.id).toBe('loop-2-border-shark');
    expect(loop2Boss3.title).toBe('Corrupted Border Shark');
    expect(loop3Boss2.enemy.id).toBe('loop-3-deadline-snail');
    expect(loop3Boss3.enemy.id).toBe('loop-3-closet-monster');
  });

  it('selects the most duplicated definition with stable lexical tie breaking', () => {
    const alpha1 = makeItem('alpha-1', 'alpha', 1, 1);
    const alpha2 = makeItem('alpha-2', 'alpha', 2, 1);
    const beta1 = makeItem('beta-1', 'beta', 1, 2);
    const beta2 = makeItem('beta-2', 'beta', 2, 2);
    const target = duplicateDebtTarget(new Map([
      [beta2.instanceId, beta2],
      [alpha2.instanceId, alpha2],
      [beta1.instanceId, beta1],
      [alpha1.instanceId, alpha1],
    ]));

    expect(target).toEqual({
      definitionId: 'alpha',
      itemInstanceIds: ['alpha-1', 'alpha-2'],
      copyCount: 2,
      extraCopyCount: 1,
    });
  });

  it('telegraphs Duplicate Debt and applies shield-aware damage only for extra copies', () => {
    const setup = duplicateSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 5600);

    expect(result.events).toContainEqual({
      kind: 'boss-duplicate-telegraph',
      atMs: 4500,
      definitionId: 'laser-cat',
      itemInstanceIds: ['dup-a', 'dup-b', 'dup-c'],
      impactAtMs: 5600,
      copyCount: 3,
      extraCopyCount: 2,
      phase: 1,
      damagePerExtraCopy: 4,
    });
    expect(result.events).toContainEqual({
      kind: 'boss-duplicate-impact',
      atMs: 5600,
      definitionId: 'laser-cat',
      itemInstanceIds: ['dup-a', 'dup-b', 'dup-c'],
      copyCount: 3,
      extraCopyCount: 2,
      damagePerExtraCopy: 4,
      phase: 1,
      totalDamage: 8,
      absorbedByShield: 4,
      healthDamage: 4,
    });
    expect(result.state.playerShield).toBe(0);
    expect(result.state.playerHp).toBe(96);
  });

  it('turns Duplicate Debt into a readable zero-damage tell when no definitions repeat', () => {
    const setup = duplicateSetup(false);
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 5600);
    expect(result.events).toContainEqual({
      kind: 'boss-duplicate-impact',
      atMs: 5600,
      definitionId: null,
      itemInstanceIds: [],
      copyCount: 0,
      extraCopyCount: 0,
      damagePerExtraCopy: 4,
      phase: 1,
      totalDamage: 0,
      absorbedByShield: 0,
      healthDamage: 0,
    });
    expect(result.state.playerHp).toBe(100);
  });

  it('classifies only backpack-perimeter items for Border Shark Edge Rent', () => {
    const setup = edgeSetup();
    expect(edgeRentItems(setup.items).map((item) => item.instanceId)).toEqual([
      'bottom-edge',
      'left-edge',
      'right-edge',
    ]);
  });

  it('telegraphs Edge Rent and applies shield-aware rent per edge item', () => {
    const setup = edgeSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 6500);

    expect(result.events).toContainEqual({
      kind: 'boss-edge-telegraph',
      atMs: 5200,
      itemInstanceIds: ['bottom-edge', 'left-edge', 'right-edge'],
      impactAtMs: 6500,
      affectedItemCount: 3,
      phase: 1,
      damagePerEdgeItem: 2,
    });
    expect(result.events).toContainEqual({
      kind: 'boss-edge-impact',
      atMs: 6500,
      itemInstanceIds: ['bottom-edge', 'left-edge', 'right-edge'],
      affectedItemCount: 3,
      damagePerEdgeItem: 2,
      phase: 1,
      totalDamage: 6,
      absorbedByShield: 2,
      healthDamage: 4,
    });
    expect(result.state.playerShield).toBe(0);
    expect(result.state.playerHp).toBe(96);
  });

  it('escalates Copycat Auditor from Duplicate Debt to a telegraphed Final Audit on cycle two', () => {
    const setup = duplicateSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 11200);
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-duplicate-telegraph',
      atMs: 10100,
      impactAtMs: 11200,
      phase: 2,
      damagePerExtraCopy: 6,
      extraCopyCount: 2,
    }));
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-duplicate-impact',
      atMs: 11200,
      phase: 2,
      damagePerExtraCopy: 6,
      totalDamage: 12,
    }));
  });

  it('escalates Border Shark from Edge Rent to a telegraphed Border Lockdown on cycle two', () => {
    const setup = edgeSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 13000);
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-edge-telegraph',
      atMs: 11700,
      impactAtMs: 13000,
      phase: 2,
      damagePerEdgeItem: 3,
      affectedItemCount: 3,
    }));
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-edge-impact',
      atMs: 13000,
      phase: 2,
      damagePerEdgeItem: 3,
      totalDamage: 9,
    }));
  });

  it('keeps both new boss clocks invariant to render/update chunk size', () => {
    const cases: Array<{ setup: CombatSetup; durationMs: number }> = [
      { setup: duplicateSetup(), durationMs: 12000 },
      { setup: edgeSetup(), durationMs: 14000 },
    ];

    for (const { setup, durationMs } of cases) {
      const single = advanceCombatWithBossRules(createCombatState(setup), setup, durationMs).state;
      let stepped: CombatState = createCombatState(setup);
      for (let elapsed = 0; elapsed < durationMs; elapsed += 100) {
        stepped = advanceCombatWithBossRules(stepped, setup, 100).state;
      }
      expect(stepped).toEqual(single);
    }
  });

  it('scales cadence in loops and exposes semantic audio cues for both families', () => {
    const debtBase = duplicateDebtDefinitionForEnemyId('copycat-auditor');
    const debtLoop2 = duplicateDebtDefinitionForEnemyId('loop-2-copycat-auditor');
    const rentBase = edgeRentDefinitionForEnemyId('border-shark');
    const rentLoop2 = edgeRentDefinitionForEnemyId('loop-2-border-shark');

    expect(debtLoop2!.intervalMs).toBeLessThan(debtBase!.intervalMs);
    expect(debtLoop2!.damagePerExtraCopy).toBe(debtBase!.damagePerExtraCopy);
    expect(rentLoop2!.intervalMs).toBeLessThan(rentBase!.intervalMs);
    expect(rentLoop2!.damagePerEdgeItem).toBe(rentBase!.damagePerEdgeItem);

    expect(audioCueForDuplicateDebtEvent({
      kind: 'boss-duplicate-telegraph',
      atMs: 4500,
      definitionId: 'laser-cat',
      itemInstanceIds: ['a', 'b'],
      impactAtMs: 5600,
      copyCount: 2,
      extraCopyCount: 1,
    })).toMatchObject({ id: 'boss.duplicate-debt.telegraph', priority: 3, group: 'boss', sourceId: 'laser-cat' });
    expect(audioCueForEdgeRentEvent({
      kind: 'boss-edge-impact',
      atMs: 6500,
      itemInstanceIds: ['a'],
      affectedItemCount: 1,
      damagePerEdgeItem: 2,
      totalDamage: 2,
      absorbedByShield: 0,
      healthDamage: 2,
    })).toMatchObject({ id: 'boss.edge-rent.impact', priority: 4, group: 'boss' });
  });
});
