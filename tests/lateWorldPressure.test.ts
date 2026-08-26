import { describe, expect, it } from 'vitest';
import type { CombatBuildItem, EnemyCombatDefinition } from '../src/game/domain/combat';
import {
  LATE_WORLD_PRESSURE_TEMPLATES,
  applyLateWorldPressure,
  evaluateLateWorldPressure,
  lateWorldPressureTemplateForEnemyId,
} from '../src/game/domain/lateWorldPressure';

const ENEMY: EnemyCombatDefinition = {
  id: 'carbon-copy-clerks',
  name: 'Carbon Copy Clerks',
  maxHp: 400,
  attackIntervalMs: 1600,
  attackDamage: 20,
};

function item(instanceId: string, definitionId: string, x: number, y: number): CombatBuildItem {
  return {
    instanceId,
    definitionId,
    triggerIntervalMs: 1000,
    damage: 10,
    poisonOnHit: 0,
    shieldOnTrigger: 0,
    bonusLaserShots: 0,
    extraLaserDamage: 10,
    chaosPower: 0,
    scrapArmor: 0,
    occupiedCells: [{ x, y }],
    magnetic: false,
    tags: [],
  };
}

function map(items: readonly CombatBuildItem[]): ReadonlyMap<string, CombatBuildItem> {
  return new Map(items.map((entry) => [entry.instanceId, entry]));
}

describe('late-world pressure', () => {
  it('defines four teach-before-boss pressure rules and ignores unrelated enemies', () => {
    expect(LATE_WORLD_PRESSURE_TEMPLATES).toHaveLength(4);
    expect(new Set(LATE_WORLD_PRESSURE_TEMPLATES.map((rule) => rule.id)).size).toBe(4);
    expect(lateWorldPressureTemplateForEnemyId('carbon-copy-clerks')?.world).toBe(5);
    expect(lateWorldPressureTemplateForEnemyId('edge-eel-syndicate')?.world).toBe(6);
    expect(evaluateLateWorldPressure('static-rats', map([]))).toBeNull();
  });

  it('makes Carbon Copy Clerks scale only from extra exact copies and caps the surcharge', () => {
    const clean = evaluateLateWorldPressure('carbon-copy-clerks', map([
      item('a', 'laser-cat', 1, 1),
      item('b', 'mutant-duck', 2, 1),
    ]));
    expect(clean).toMatchObject({ pressureCount: 0, enemyHpPct: 0, affectedItemInstanceIds: [] });

    const duplicate = evaluateLateWorldPressure('carbon-copy-clerks', map([
      item('a', 'laser-cat', 1, 1),
      item('b', 'laser-cat', 2, 1),
    ]));
    expect(duplicate).toMatchObject({ pressureCount: 1, enemyHpPct: 6 });
    expect(duplicate?.affectedItemInstanceIds).toEqual(['a', 'b']);

    const capped = evaluateLateWorldPressure('carbon-copy-clerks', map(
      Array.from({ length: 8 }, (_, index) => item(`cat-${index}`, 'laser-cat', index % 6, Math.floor(index / 6) + 1)),
    ));
    expect(capped).toMatchObject({ pressureCount: 7, enemyHpPct: 24 });
  });

  it('turns duplicate stacks into attack-speed pressure for Mirror Mule without adding direct damage', () => {
    const pressure = evaluateLateWorldPressure('mirror-mule', map([
      item('a', 'cursed-toaster', 1, 1),
      item('b', 'cursed-toaster', 2, 1),
      item('c', 'cursed-toaster', 3, 1),
      item('d', 'cursed-toaster', 4, 1),
      item('e', 'cursed-toaster', 5, 1),
    ]));
    expect(pressure).toMatchObject({ pressureCount: 4, enemyHpPct: 0, enemyDamagePct: 0, enemyAttackSpeedPct: 24 });
  });

  it('counts unique perimeter-touching items for World 6 and applies different lessons', () => {
    const build = map([
      item('left', 'laser-cat', 0, 2),
      item('right', 'mutant-duck', 5, 2),
      item('top', 'cursed-toaster', 3, 0),
      item('center', 'poison-flask', 3, 2),
    ]);
    const eels = evaluateLateWorldPressure('edge-eel-syndicate', build);
    const crab = evaluateLateWorldPressure('rent-collector-crab', build);
    expect(eels).toMatchObject({ pressureCount: 3, enemyAttackSpeedPct: 9, enemyHpPct: 0 });
    expect(crab).toMatchObject({ pressureCount: 3, enemyHpPct: 9, enemyAttackSpeedPct: 0 });
    expect(eels?.affectedItemInstanceIds).toEqual(['left', 'right', 'top']);
  });

  it('caps perimeter pressure and applies it without changing enemy identity', () => {
    const edgeBuild = map(Array.from({ length: 12 }, (_, index) => item(
      `edge-${index}`,
      `definition-${index}`,
      index < 6 ? index : index - 6,
      index < 6 ? 0 : 4,
    )));
    const eels = evaluateLateWorldPressure('edge-eel-syndicate', edgeBuild);
    expect(eels?.enemyAttackSpeedPct).toBe(21);

    const crab = evaluateLateWorldPressure('rent-collector-crab', edgeBuild);
    expect(crab?.enemyHpPct).toBe(30);

    const pressured = applyLateWorldPressure(ENEMY, evaluateLateWorldPressure('carbon-copy-clerks', map([
      item('a', 'laser-cat', 1, 1), item('b', 'laser-cat', 2, 1),
    ])));
    expect(pressured.id).toBe(ENEMY.id);
    expect(pressured.name).toBe(ENEMY.name);
    expect(pressured.maxHp).toBe(424);
    expect(pressured.attackDamage).toBe(20);
    expect(pressured.attackIntervalMs).toBe(1600);
  });
});
