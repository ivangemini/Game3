import { duplicateDebtTarget, edgeRentItems, looseClutterItems } from './bossCombat';
import { BOSS_FAMILY_IDS, type BossFamilyId } from './bossGrudges';
import type { CombatBuildItem } from './combat';

export const BOSS_MASTERY_CHALLENGES = [
  {
    id: 'tv-backup-channel',
    bossId: 'tv-tyrant',
    star: 1,
    name: 'Backup Channel',
    description: 'Win with at least 4 combat-capable junk items so one Channel Jam cannot erase the whole plan.',
  },
  {
    id: 'tv-split-signal',
    bossId: 'tv-tyrant',
    star: 2,
    name: 'Split Signal',
    description: 'Win with no backpack row carrying more than 80% of your combat items.',
  },
  {
    id: 'tv-mesh-network',
    bossId: 'tv-tyrant',
    star: 3,
    name: 'Mesh Network',
    description: 'Win with at least 4 active spatial synergy links.',
  },
  {
    id: 'snail-twin-clocks',
    bossId: 'deadline-snail',
    star: 1,
    name: 'Twin Clocks',
    description: 'Win with at least 2 meaningful items triggering within 25% of your fastest item.',
  },
  {
    id: 'snail-triple-shift',
    bossId: 'deadline-snail',
    star: 2,
    name: 'Triple Shift',
    description: 'Win with at least 3 meaningful items triggering within 40% of your fastest item.',
  },
  {
    id: 'snail-clock-union',
    bossId: 'deadline-snail',
    star: 3,
    name: 'Clock Union',
    description: 'Win with at least 4 meaningful items triggering within 55% of your fastest item.',
  },
  {
    id: 'closet-tidy-enough',
    bossId: 'closet-monster',
    star: 1,
    name: 'Tidy Enough',
    description: 'Win with no more than 2 loose, unanchored junk items.',
  },
  {
    id: 'closet-neat-freak',
    bossId: 'closet-monster',
    star: 2,
    name: 'Neat Freak',
    description: 'Win with no more than 1 loose, unanchored junk item.',
  },
  {
    id: 'closet-zero-clutter',
    bossId: 'closet-monster',
    star: 3,
    name: 'Zero Clutter',
    description: 'Win with every combat item side-anchored to another item.',
  },
  {
    id: 'moon-mixed-sky',
    bossId: 'baby-moon',
    star: 1,
    name: 'Mixed Sky',
    description: 'Win with 4+ items and your most common tag on at most 75% of them.',
  },
  {
    id: 'moon-split-eclipse',
    bossId: 'baby-moon',
    star: 2,
    name: 'Split Eclipse',
    description: 'Win with 4+ items and your most common tag on at most 60% of them.',
  },
  {
    id: 'moon-no-majority',
    bossId: 'baby-moon',
    star: 3,
    name: 'No Majority',
    description: 'Win with 4+ items and no tag present on more than half the build.',
  },
  {
    id: 'auditor-light-paperwork',
    bossId: 'copycat-auditor',
    star: 1,
    name: 'Light Paperwork',
    description: 'Win with at most 2 extra exact copies in your largest duplicate stack.',
  },
  {
    id: 'auditor-single-copy',
    bossId: 'copycat-auditor',
    star: 2,
    name: 'Single Copy',
    description: 'Win with at most 1 extra exact copy in your largest duplicate stack.',
  },
  {
    id: 'auditor-originals-only',
    bossId: 'copycat-auditor',
    star: 3,
    name: 'Originals Only',
    description: 'Win with no exact duplicate item definitions in the backpack.',
  },
  {
    id: 'shark-cheap-rent',
    bossId: 'border-shark',
    star: 1,
    name: 'Cheap Rent',
    description: 'Win with at most 6 items touching the backpack perimeter.',
  },
  {
    id: 'shark-inner-district',
    bossId: 'border-shark',
    star: 2,
    name: 'Inner District',
    description: 'Win with at most 4 items touching the backpack perimeter.',
  },
  {
    id: 'shark-rent-control',
    bossId: 'border-shark',
    star: 3,
    name: 'Rent Control',
    description: 'Win with at most 2 items touching the backpack perimeter.',
  },
] as const;

export type BossMasteryChallengeId = typeof BOSS_MASTERY_CHALLENGES[number]['id'];
export type BossMasteryStar = 1 | 2 | 3;

export interface BossMasteryChallengeDefinition {
  readonly id: BossMasteryChallengeId;
  readonly bossId: BossFamilyId;
  readonly star: BossMasteryStar;
  readonly name: string;
  readonly description: string;
}

export interface BossMasteryChallengeContext {
  readonly items: ReadonlyMap<string, CombatBuildItem>;
  readonly synergyConnectionCount: number;
}

export interface BossMasteryMetrics {
  readonly itemCount: number;
  readonly meaningfulItemCount: number;
  readonly maxRowItemShare: number;
  readonly synergyConnectionCount: number;
  readonly nearFast25Count: number;
  readonly nearFast40Count: number;
  readonly nearFast55Count: number;
  readonly looseItemCount: number;
  readonly dominantTagShare: number;
  readonly duplicateExtraCopyCount: number;
  readonly edgeItemCount: number;
}

export interface BossMasteryChallengeResult extends BossMasteryChallengeDefinition {
  readonly passed: boolean;
  readonly progressText: string;
}

export interface BossMasteryEvaluation {
  readonly bossId: BossFamilyId;
  readonly metrics: BossMasteryMetrics;
  readonly challenges: readonly BossMasteryChallengeResult[];
  readonly passedChallengeIds: readonly BossMasteryChallengeId[];
}

export interface BossMasteryCompletionUpdate {
  readonly completedChallengeIds: readonly BossMasteryChallengeId[];
  readonly newlyCompletedChallengeIds: readonly BossMasteryChallengeId[];
}

const CHALLENGE_ID_SET = new Set<string>(BOSS_MASTERY_CHALLENGES.map((challenge) => challenge.id));

export function isBossMasteryChallengeId(value: unknown): value is BossMasteryChallengeId {
  return typeof value === 'string' && CHALLENGE_ID_SET.has(value);
}

export function normalizeBossMasteryChallengeIds(values: readonly string[]): readonly BossMasteryChallengeId[] {
  const unique = new Set(values.filter(isBossMasteryChallengeId));
  return BOSS_MASTERY_CHALLENGES
    .map((challenge) => challenge.id)
    .filter((id) => unique.has(id));
}

export function bossMasteryChallengesForBoss(bossId: BossFamilyId): readonly BossMasteryChallengeDefinition[] {
  return BOSS_MASTERY_CHALLENGES.filter((challenge) => challenge.bossId === bossId);
}

export function bossMasteryChallengeStarCount(
  completedChallengeIds: readonly string[],
  bossId: BossFamilyId,
): 0 | 1 | 2 | 3 {
  const completed = new Set(normalizeBossMasteryChallengeIds(completedChallengeIds));
  const count = bossMasteryChallengesForBoss(bossId).filter((challenge) => completed.has(challenge.id)).length;
  return Math.max(0, Math.min(3, count)) as 0 | 1 | 2 | 3;
}

export function evaluateBossMasteryChallenges(
  bossId: BossFamilyId,
  context: BossMasteryChallengeContext,
): BossMasteryEvaluation {
  const metrics = bossMasteryMetrics(context);
  const challenges = bossMasteryChallengesForBoss(bossId).map((challenge) => ({
    ...challenge,
    passed: challengePassed(challenge.id, metrics),
    progressText: challengeProgressText(challenge.id, metrics),
  }));
  return {
    bossId,
    metrics,
    challenges,
    passedChallengeIds: challenges.filter((challenge) => challenge.passed).map((challenge) => challenge.id),
  };
}

export function completeBossMasteryChallenges(
  completedChallengeIds: readonly string[],
  evaluation: BossMasteryEvaluation,
): BossMasteryCompletionUpdate {
  const current = new Set(normalizeBossMasteryChallengeIds(completedChallengeIds));
  const newlyCompletedChallengeIds = evaluation.passedChallengeIds.filter((id) => !current.has(id));
  for (const id of newlyCompletedChallengeIds) current.add(id);
  return {
    completedChallengeIds: BOSS_MASTERY_CHALLENGES
      .map((challenge) => challenge.id)
      .filter((id) => current.has(id)),
    newlyCompletedChallengeIds,
  };
}

export function bossMasteryMetrics(context: BossMasteryChallengeContext): BossMasteryMetrics {
  const orderedItems = [...context.items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  const meaningful = orderedItems.filter(isMeaningfulCombatItem);
  const fastest = meaningful.reduce((min, item) => Math.min(min, item.triggerIntervalMs), Number.POSITIVE_INFINITY);
  const nearFastCount = (multiplier: number): number => Number.isFinite(fastest)
    ? meaningful.filter((item) => item.triggerIntervalMs <= fastest * multiplier).length
    : 0;
  const duplicate = duplicateDebtTarget(context.items);
  return {
    itemCount: orderedItems.length,
    meaningfulItemCount: meaningful.length,
    maxRowItemShare: maximumRowItemShare(orderedItems),
    synergyConnectionCount: Math.max(0, Math.floor(context.synergyConnectionCount)),
    nearFast25Count: nearFastCount(1.25),
    nearFast40Count: nearFastCount(1.4),
    nearFast55Count: nearFastCount(1.55),
    looseItemCount: looseClutterItems(context.items).length,
    dominantTagShare: dominantTagShare(orderedItems),
    duplicateExtraCopyCount: duplicate?.extraCopyCount ?? 0,
    edgeItemCount: edgeRentItems(context.items).length,
  };
}

function challengePassed(id: BossMasteryChallengeId, metrics: BossMasteryMetrics): boolean {
  switch (id) {
    case 'tv-backup-channel': return metrics.meaningfulItemCount >= 4;
    case 'tv-split-signal': return metrics.meaningfulItemCount >= 4 && metrics.maxRowItemShare <= 0.8;
    case 'tv-mesh-network': return metrics.synergyConnectionCount >= 4;
    case 'snail-twin-clocks': return metrics.nearFast25Count >= 2;
    case 'snail-triple-shift': return metrics.nearFast40Count >= 3;
    case 'snail-clock-union': return metrics.nearFast55Count >= 4;
    case 'closet-tidy-enough': return metrics.looseItemCount <= 2;
    case 'closet-neat-freak': return metrics.looseItemCount <= 1;
    case 'closet-zero-clutter': return metrics.looseItemCount === 0;
    case 'moon-mixed-sky': return metrics.itemCount >= 4 && metrics.dominantTagShare <= 0.75;
    case 'moon-split-eclipse': return metrics.itemCount >= 4 && metrics.dominantTagShare <= 0.6;
    case 'moon-no-majority': return metrics.itemCount >= 4 && metrics.dominantTagShare <= 0.5;
    case 'auditor-light-paperwork': return metrics.duplicateExtraCopyCount <= 2;
    case 'auditor-single-copy': return metrics.duplicateExtraCopyCount <= 1;
    case 'auditor-originals-only': return metrics.duplicateExtraCopyCount === 0;
    case 'shark-cheap-rent': return metrics.edgeItemCount <= 6;
    case 'shark-inner-district': return metrics.edgeItemCount <= 4;
    case 'shark-rent-control': return metrics.edgeItemCount <= 2;
  }
}

function challengeProgressText(id: BossMasteryChallengeId, metrics: BossMasteryMetrics): string {
  switch (id) {
    case 'tv-backup-channel': return `${metrics.meaningfulItemCount}/4 combat items`;
    case 'tv-split-signal': return `busiest row ${Math.round(metrics.maxRowItemShare * 100)}% / 80% max`;
    case 'tv-mesh-network': return `${metrics.synergyConnectionCount}/4 active links`;
    case 'snail-twin-clocks': return `${metrics.nearFast25Count}/2 near-fast items`;
    case 'snail-triple-shift': return `${metrics.nearFast40Count}/3 near-fast items`;
    case 'snail-clock-union': return `${metrics.nearFast55Count}/4 near-fast items`;
    case 'closet-tidy-enough': return `${metrics.looseItemCount} loose / 2 max`;
    case 'closet-neat-freak': return `${metrics.looseItemCount} loose / 1 max`;
    case 'closet-zero-clutter': return `${metrics.looseItemCount} loose / 0 target`;
    case 'moon-mixed-sky': return `dominant tag ${Math.round(metrics.dominantTagShare * 100)}% / 75% max`;
    case 'moon-split-eclipse': return `dominant tag ${Math.round(metrics.dominantTagShare * 100)}% / 60% max`;
    case 'moon-no-majority': return `dominant tag ${Math.round(metrics.dominantTagShare * 100)}% / 50% max`;
    case 'auditor-light-paperwork': return `${metrics.duplicateExtraCopyCount} extra copies / 2 max`;
    case 'auditor-single-copy': return `${metrics.duplicateExtraCopyCount} extra copies / 1 max`;
    case 'auditor-originals-only': return `${metrics.duplicateExtraCopyCount} extra copies / 0 target`;
    case 'shark-cheap-rent': return `${metrics.edgeItemCount} edge items / 6 max`;
    case 'shark-inner-district': return `${metrics.edgeItemCount} edge items / 4 max`;
    case 'shark-rent-control': return `${metrics.edgeItemCount} edge items / 2 max`;
  }
}

function isMeaningfulCombatItem(item: CombatBuildItem): boolean {
  return item.damage > 0
    || item.poisonOnHit > 0
    || item.shieldOnTrigger > 0
    || item.bonusLaserShots > 0
    || item.chaosPower > 0;
}

function maximumRowItemShare(items: readonly CombatBuildItem[]): number {
  if (items.length === 0) return 1;
  const counts = new Map<number, number>();
  for (const item of items) {
    const rows = new Set(item.occupiedCells.map((cell) => cell.y));
    for (const row of rows) counts.set(row, (counts.get(row) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...counts.values());
  return maxCount / items.length;
}

function dominantTagShare(items: readonly CombatBuildItem[]): number {
  if (items.length === 0) return 1;
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of new Set(item.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values()) / items.length;
}

export function bossMasteryChallengeCountsByBoss(
  completedChallengeIds: readonly string[],
): Readonly<Record<BossFamilyId, number>> {
  return Object.fromEntries(BOSS_FAMILY_IDS.map((bossId) => [
    bossId,
    bossMasteryChallengeStarCount(completedChallengeIds, bossId),
  ])) as Readonly<Record<BossFamilyId, number>>;
}
