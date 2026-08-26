import { edgeRentItems, duplicateDebtTarget } from './bossCombat';
import type { CombatBuildItem, EnemyCombatDefinition } from './combat';

export type LateWorldPressureId =
  | 'carbon-audit'
  | 'mirror-overtime'
  | 'perimeter-current'
  | 'security-deposit';

export interface LateWorldPressureTemplate {
  readonly id: LateWorldPressureId;
  readonly enemyId: string;
  readonly world: 5 | 6;
  readonly name: string;
  readonly kicker: string;
  readonly description: string;
  readonly metric: 'duplicate-stack' | 'edge-items';
  readonly enemyHpPctPerCount: number;
  readonly enemyDamagePctPerCount: number;
  readonly enemyAttackSpeedPctPerCount: number;
  readonly maxEnemyHpPct: number;
  readonly maxEnemyDamagePct: number;
  readonly maxEnemyAttackSpeedPct: number;
}

export interface LateWorldPressureResult extends LateWorldPressureTemplate {
  readonly pressureCount: number;
  readonly affectedItemInstanceIds: readonly string[];
  readonly enemyHpPct: number;
  readonly enemyDamagePct: number;
  readonly enemyAttackSpeedPct: number;
}

export const LATE_WORLD_PRESSURE_TEMPLATES: readonly LateWorldPressureTemplate[] = [
  {
    id: 'carbon-audit',
    enemyId: 'carbon-copy-clerks',
    world: 5,
    name: 'Carbon Audit',
    kicker: 'EXACT COPIES ADD PAPERWORK',
    description: 'Your largest exact-copy stack adds +6% enemy HP per extra copy, up to +24%.',
    metric: 'duplicate-stack',
    enemyHpPctPerCount: 6,
    enemyDamagePctPerCount: 0,
    enemyAttackSpeedPctPerCount: 0,
    maxEnemyHpPct: 24,
    maxEnemyDamagePct: 0,
    maxEnemyAttackSpeedPct: 0,
  },
  {
    id: 'mirror-overtime',
    enemyId: 'mirror-mule',
    world: 5,
    name: 'Mirror Overtime',
    kicker: 'COPIES MAKE THE MULE HURRY',
    description: 'Your largest exact-copy stack speeds enemy attacks by 8% per extra copy, up to +24%.',
    metric: 'duplicate-stack',
    enemyHpPctPerCount: 0,
    enemyDamagePctPerCount: 0,
    enemyAttackSpeedPctPerCount: 8,
    maxEnemyHpPct: 0,
    maxEnemyDamagePct: 0,
    maxEnemyAttackSpeedPct: 24,
  },
  {
    id: 'perimeter-current',
    enemyId: 'edge-eel-syndicate',
    world: 6,
    name: 'Perimeter Current',
    kicker: 'THE OUTER CELLS ARE LIVE',
    description: 'Each item touching the backpack perimeter speeds enemy attacks by 3%, up to +21%.',
    metric: 'edge-items',
    enemyHpPctPerCount: 0,
    enemyDamagePctPerCount: 0,
    enemyAttackSpeedPctPerCount: 3,
    maxEnemyHpPct: 0,
    maxEnemyDamagePct: 0,
    maxEnemyAttackSpeedPct: 21,
  },
  {
    id: 'security-deposit',
    enemyId: 'rent-collector-crab',
    world: 6,
    name: 'Security Deposit',
    kicker: 'EDGE SPACE HAS A DEPOSIT',
    description: 'Each item touching the backpack perimeter adds +3% enemy HP, up to +30%.',
    metric: 'edge-items',
    enemyHpPctPerCount: 3,
    enemyDamagePctPerCount: 0,
    enemyAttackSpeedPctPerCount: 0,
    maxEnemyHpPct: 30,
    maxEnemyDamagePct: 0,
    maxEnemyAttackSpeedPct: 0,
  },
] as const;

const TEMPLATE_BY_ENEMY_ID = new Map(LATE_WORLD_PRESSURE_TEMPLATES.map((template) => [template.enemyId, template]));

export function lateWorldPressureTemplateForEnemyId(enemyId: string): LateWorldPressureTemplate | null {
  return TEMPLATE_BY_ENEMY_ID.get(enemyId) ?? null;
}

export function evaluateLateWorldPressure(
  enemyId: string,
  items: ReadonlyMap<string, CombatBuildItem>,
): LateWorldPressureResult | null {
  const template = lateWorldPressureTemplateForEnemyId(enemyId);
  if (!template) return null;

  const target = pressureTarget(template.metric, items);
  const pressureCount = target.count;
  return {
    ...template,
    pressureCount,
    affectedItemInstanceIds: target.itemInstanceIds,
    enemyHpPct: cappedPercent(template.enemyHpPctPerCount, pressureCount, template.maxEnemyHpPct),
    enemyDamagePct: cappedPercent(template.enemyDamagePctPerCount, pressureCount, template.maxEnemyDamagePct),
    enemyAttackSpeedPct: cappedPercent(
      template.enemyAttackSpeedPctPerCount,
      pressureCount,
      template.maxEnemyAttackSpeedPct,
    ),
  };
}

export function applyLateWorldPressure(
  enemy: EnemyCombatDefinition,
  pressure: LateWorldPressureResult | null,
): EnemyCombatDefinition {
  if (!pressure) return enemy;
  const hpScale = 1 + pressure.enemyHpPct / 100;
  const damageScale = 1 + pressure.enemyDamagePct / 100;
  const speedScale = 1 + pressure.enemyAttackSpeedPct / 100;
  return {
    ...enemy,
    maxHp: Math.max(1, Math.round(enemy.maxHp * hpScale)),
    attackDamage: Math.max(0, Math.round(enemy.attackDamage * damageScale)),
    attackIntervalMs: Math.max(700, Math.round(enemy.attackIntervalMs / speedScale)),
  };
}

function pressureTarget(
  metric: LateWorldPressureTemplate['metric'],
  items: ReadonlyMap<string, CombatBuildItem>,
): { readonly count: number; readonly itemInstanceIds: readonly string[] } {
  if (metric === 'duplicate-stack') {
    const target = duplicateDebtTarget(items);
    return target
      ? { count: target.extraCopyCount, itemInstanceIds: target.itemInstanceIds }
      : { count: 0, itemInstanceIds: [] };
  }
  const edgeItems = edgeRentItems(items);
  return {
    count: edgeItems.length,
    itemInstanceIds: edgeItems.map((item) => item.instanceId),
  };
}

function cappedPercent(perCount: number, count: number, cap: number): number {
  if (perCount === 0 || cap === 0) return 0;
  return Math.min(cap, Math.max(0, Math.floor(count)) * perCount);
}
