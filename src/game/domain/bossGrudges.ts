export const BOSS_FAMILY_IDS = [
  'tv-tyrant',
  'deadline-snail',
  'closet-monster',
  'baby-moon',
  'copycat-auditor',
  'border-shark',
] as const;

export type BossFamilyId = typeof BOSS_FAMILY_IDS[number];

export interface BossHistoryState {
  readonly bossId: string;
  readonly wins: number;
  readonly losses: number;
  readonly fastestVictoryMs: number | null;
  readonly currentWinStreak: number;
  readonly bestWinStreak: number;
  readonly revengePending: boolean;
}

export interface BossGrudgeUpdate {
  readonly history: readonly BossHistoryState[];
  readonly bossId: BossFamilyId | null;
  readonly tracked: boolean;
  readonly revengeStarted: boolean;
  readonly revengeResolved: boolean;
  readonly firstVictory: boolean;
  readonly newFastestVictory: boolean;
}

export interface BossGrudgeSnapshot extends BossHistoryState {
  readonly bossId: BossFamilyId;
  readonly masteryTier: 0 | 1 | 2 | 3;
  readonly nextGoal: string;
}

export function bossFamilyIdForEnemyId(enemyId: string): BossFamilyId | null {
  for (const bossId of BOSS_FAMILY_IDS) {
    if (enemyId === bossId || enemyId.endsWith(`-${bossId}`)) return bossId;
  }
  return null;
}

export function recordBossOutcome(
  history: readonly BossHistoryState[],
  enemyId: string,
  outcome: 'victory' | 'defeat',
  durationMs: number,
): BossGrudgeUpdate {
  const bossId = bossFamilyIdForEnemyId(enemyId);
  if (!bossId) return {
    history,
    bossId: null,
    tracked: false,
    revengeStarted: false,
    revengeResolved: false,
    firstVictory: false,
    newFastestVictory: false,
  };

  const current = history.find((entry) => entry.bossId === bossId) ?? emptyBossHistory(bossId);
  const safeDuration = Math.max(0, Math.round(Number.isFinite(durationMs) ? durationMs : 0));
  const revengeStarted = outcome === 'defeat' && !current.revengePending;
  const revengeResolved = outcome === 'victory' && current.revengePending;
  const firstVictory = outcome === 'victory' && current.wins === 0;
  const newFastestVictory = outcome === 'victory'
    && (current.fastestVictoryMs === null || safeDuration < current.fastestVictoryMs);

  const updated: BossHistoryState = outcome === 'victory'
    ? {
      ...current,
      wins: current.wins + 1,
      fastestVictoryMs: newFastestVictory ? safeDuration : current.fastestVictoryMs,
      currentWinStreak: current.currentWinStreak + 1,
      bestWinStreak: Math.max(current.bestWinStreak, current.currentWinStreak + 1),
      revengePending: false,
    }
    : {
      ...current,
      losses: current.losses + 1,
      currentWinStreak: 0,
      revengePending: true,
    };

  const historyById = new Map(history.map((entry) => [entry.bossId, entry]));
  historyById.set(bossId, updated);
  const normalized = [...historyById.values()].sort((a, b) => bossSort(a.bossId) - bossSort(b.bossId));
  return {
    history: normalized,
    bossId,
    tracked: true,
    revengeStarted,
    revengeResolved,
    firstVictory,
    newFastestVictory,
  };
}

export function createBossGrudgeSnapshots(history: readonly BossHistoryState[]): readonly BossGrudgeSnapshot[] {
  return BOSS_FAMILY_IDS.map((bossId) => {
    const state = history.find((entry) => entry.bossId === bossId) ?? emptyBossHistory(bossId);
    const masteryTier = bossMasteryTier(state);
    return {
      ...state,
      bossId,
      masteryTier,
      nextGoal: bossNextGoal(state, masteryTier),
    };
  });
}

export function bossMasteryTier(history: BossHistoryState): 0 | 1 | 2 | 3 {
  if (history.wins <= 0) return 0;
  if (history.wins < 3) return 1;
  if (history.bestWinStreak < 3) return 2;
  return 3;
}

export function revengeBossIds(history: readonly BossHistoryState[]): readonly BossFamilyId[] {
  const pending = new Set(history.filter((entry) => entry.revengePending).map((entry) => entry.bossId));
  return BOSS_FAMILY_IDS.filter((bossId) => pending.has(bossId));
}

function bossNextGoal(history: BossHistoryState, tier: 0 | 1 | 2 | 3): string {
  if (history.revengePending) return 'REVENGE ACTIVE • beat this boss again';
  if (tier === 0) return 'Defeat this boss once';
  if (tier === 1) return `${history.wins}/3 victories • reach 3 wins`;
  if (tier === 2) return `${history.bestWinStreak}/3 best streak • win 3 in a row`;
  return 'MASTERED • keep improving fastest victory';
}

function emptyBossHistory(bossId: BossFamilyId): BossHistoryState {
  return {
    bossId,
    wins: 0,
    losses: 0,
    fastestVictoryMs: null,
    currentWinStreak: 0,
    bestWinStreak: 0,
    revengePending: false,
  };
}

function bossSort(bossId: string): number {
  const index = BOSS_FAMILY_IDS.indexOf(bossId as BossFamilyId);
  return index >= 0 ? index : BOSS_FAMILY_IDS.length + bossId.localeCompare('zzzz');
}
