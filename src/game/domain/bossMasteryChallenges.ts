import { duplicateDebtTarget, edgeRentItems, looseClutterItems } from './bossCombat';
import { bossFamilyIdForEnemyId, type BossChallengeStars, type BossFamilyId } from './bossGrudges';
import type { CombatBuildItem } from './combat';

export interface BossMasteryChallengeDefinition {
  readonly bossId: BossFamilyId;
  readonly title: string;
  readonly goals: readonly [string, string, string];
}

export interface BossMasteryChallengeEvaluation {
  readonly bossId: BossFamilyId;
  readonly stars: BossChallengeStars;
  readonly title: string;
  readonly result: string;
  readonly nextGoal: string;
}

export const BOSS_MASTERY_CHALLENGES: Readonly<Record<BossFamilyId, BossMasteryChallengeDefinition>> = {
  'tv-tyrant': {
    bossId: 'tv-tyrant',
    title: 'Signal Split',
    goals: [
      '3 active combat items across 3 rows',
      '4 active combat items across 4 rows',
      '5 active combat items across all 5 rows',
    ],
  },
  'deadline-snail': {
    bossId: 'deadline-snail',
    title: 'No Single Deadline',
    goals: [
      '2 combat items within 25% of your fastest trigger',
      '3 combat items within 25% of your fastest trigger',
      '4 combat items within 25% of your fastest trigger',
    ],
  },
  'closet-monster': {
    bossId: 'closet-monster',
    title: 'Anchor the Clutter',
    goals: [
      'Win with at most 2 loose items',
      'Win with at most 1 loose item',
      'Win with zero loose items',
    ],
  },
  'baby-moon': {
    bossId: 'baby-moon',
    title: 'Family Diversification',
    goals: [
      'Keep the dominant tag on at most 4 items',
      'Keep the dominant tag on at most 3 items',
      'Keep the dominant tag on at most 2 items',
    ],
  },
  'copycat-auditor': {
    bossId: 'copycat-auditor',
    title: 'Original Receipts',
    goals: [
      'Largest duplicate group has at most 2 extra copies',
      'Largest duplicate group has at most 1 extra copy',
      'Win with no exact duplicate items',
    ],
  },
  'border-shark': {
    bossId: 'border-shark',
    title: 'Own the Center',
    goals: [
      'Expose at most 4 items to Edge Rent',
      'Expose at most 2 items to Edge Rent',
      'Expose zero items to Edge Rent',
    ],
  },
};

export function bossMasteryChallengeTitle(bossId: BossFamilyId): string {
  return BOSS_MASTERY_CHALLENGES[bossId].title;
}

export function bossMasteryChallengeNextGoal(bossId: BossFamilyId, bestStars: number): string {
  const stars = normalizeStars(bestStars);
  if (stars === 3) return 'COUNTERPLAY MASTERED • replay for cleaner/faster wins';
  const next = BOSS_MASTERY_CHALLENGES[bossId].goals[stars];
  return `NEXT ★${stars + 1} • ${next}`;
}

export function evaluateBossMasteryChallenge(
  enemyId: string,
  items: ReadonlyMap<string, CombatBuildItem>,
): BossMasteryChallengeEvaluation | null {
  const bossId = bossFamilyIdForEnemyId(enemyId);
  if (!bossId) return null;

  const definition = BOSS_MASTERY_CHALLENGES[bossId];
  const evaluation = evaluateFamily(bossId, items);
  return {
    bossId,
    stars: evaluation.stars,
    title: definition.title,
    result: evaluation.result,
    nextGoal: bossMasteryChallengeNextGoal(bossId, evaluation.stars),
  };
}

function evaluateFamily(
  bossId: BossFamilyId,
  items: ReadonlyMap<string, CombatBuildItem>,
): { readonly stars: BossChallengeStars; readonly result: string } {
  if (bossId === 'tv-tyrant') return evaluateTvTyrant(items);
  if (bossId === 'deadline-snail') return evaluateDeadlineSnail(items);
  if (bossId === 'closet-monster') return evaluateClosetMonster(items);
  if (bossId === 'baby-moon') return evaluateBabyMoon(items);
  if (bossId === 'copycat-auditor') return evaluateCopycatAuditor(items);
  return evaluateBorderShark(items);
}

function evaluateTvTyrant(items: ReadonlyMap<string, CombatBuildItem>) {
  const active = meaningfulCombatItems(items);
  const rows = new Set<number>();
  for (const item of active) for (const cell of item.occupiedCells) rows.add(cell.y);
  const stars = tier(
    active.length >= 3 && rows.size >= 3,
    active.length >= 4 && rows.size >= 4,
    active.length >= 5 && rows.size >= 5,
  );
  return { stars, result: `${active.length} active items • ${rows.size}/5 rows` };
}

function evaluateDeadlineSnail(items: ReadonlyMap<string, CombatBuildItem>) {
  const active = meaningfulCombatItems(items);
  const fastest = active.reduce((best, item) => Math.min(best, item.triggerIntervalMs), Number.POSITIVE_INFINITY);
  const backups = Number.isFinite(fastest)
    ? active.filter((item) => item.triggerIntervalMs <= fastest * 1.25).length
    : 0;
  const stars = tier(backups >= 2, backups >= 3, backups >= 4);
  return { stars, result: `${backups} near-fastest threats` };
}

function evaluateClosetMonster(items: ReadonlyMap<string, CombatBuildItem>) {
  const loose = looseClutterItems(items).length;
  const stars = tier(loose <= 2, loose <= 1, loose === 0);
  return { stars, result: `${loose} loose item${loose === 1 ? '' : 's'}` };
}

function evaluateBabyMoon(items: ReadonlyMap<string, CombatBuildItem>) {
  const counts = new Map<string, number>();
  for (const item of items.values()) {
    for (const tag of new Set(item.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const dominant = Math.max(0, ...counts.values());
  const stars = tier(dominant <= 4, dominant <= 3, dominant <= 2);
  return { stars, result: `dominant tag hits ${dominant} item${dominant === 1 ? '' : 's'}` };
}

function evaluateCopycatAuditor(items: ReadonlyMap<string, CombatBuildItem>) {
  const extras = duplicateDebtTarget(items)?.extraCopyCount ?? 0;
  const stars = tier(extras <= 2, extras <= 1, extras === 0);
  return { stars, result: `${extras} extra exact cop${extras === 1 ? 'y' : 'ies'}` };
}

function evaluateBorderShark(items: ReadonlyMap<string, CombatBuildItem>) {
  const exposed = edgeRentItems(items).length;
  const stars = tier(exposed <= 4, exposed <= 2, exposed === 0);
  return { stars, result: `${exposed} Edge Rent item${exposed === 1 ? '' : 's'}` };
}

function meaningfulCombatItems(items: ReadonlyMap<string, CombatBuildItem>): readonly CombatBuildItem[] {
  return [...items.values()]
    .filter((item) => item.damage > 0
      || item.poisonOnHit > 0
      || item.shieldOnTrigger > 0
      || item.bonusLaserShots > 0
      || item.chaosPower > 0)
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId));
}

function tier(one: boolean, two: boolean, three: boolean): BossChallengeStars {
  if (three) return 3;
  if (two) return 2;
  if (one) return 1;
  return 0;
}

function normalizeStars(value: number): BossChallengeStars {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(3, Math.floor(value))) as BossChallengeStars;
}
