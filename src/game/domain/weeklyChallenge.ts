import { createSeededRng } from './rng';
import type { HeroId } from './heroes';

export type WeeklyTier = 'none' | 'bronze' | 'silver' | 'gold' | 'reality-broken';
export type WeeklyRewardKind = 'sticker' | 'title' | 'frame' | 'vfx';

export interface WeeklyChallengeIdentity {
  readonly key: string;
  readonly seed: string;
}

export interface WeeklyLoadoutConstraint {
  readonly id: string;
  readonly name: string;
  readonly kicker: string;
  readonly description: string;
  readonly heroId: HeroId;
  readonly startingPerkId: string;
}

export interface WeeklyTierThresholds {
  readonly bronze: number;
  readonly silver: number;
  readonly gold: number;
  readonly realityBroken: number;
}

export interface WeeklyChallengeDefinition extends WeeklyChallengeIdentity {
  readonly constraint: WeeklyLoadoutConstraint;
  readonly thresholds: WeeklyTierThresholds;
}

export interface WeeklyHistoryEntry {
  readonly key: string;
  readonly attempts: number;
  readonly bestScore: number;
  readonly deepestLoop: number;
  readonly bestTier: WeeklyTier;
  readonly heroId: HeroId;
  readonly startingPerkId: string;
  readonly earnedRewardIds: readonly string[];
}

export interface WeeklyChallengeState {
  readonly history: readonly WeeklyHistoryEntry[];
}

export interface WeeklyRewardDefinition {
  readonly id: string;
  readonly tier: Exclude<WeeklyTier, 'none'>;
  readonly kind: WeeklyRewardKind;
  readonly name: string;
}

export interface WeeklyProgressUpdate {
  readonly state: WeeklyChallengeState;
  readonly entry: WeeklyHistoryEntry;
  readonly previousTier: WeeklyTier;
  readonly tierImproved: boolean;
  readonly scoreImproved: boolean;
}

export interface WeeklyBoardSnapshot extends WeeklyChallengeDefinition {
  readonly attempts: number;
  readonly bestScore: number;
  readonly deepestLoop: number;
  readonly bestTier: WeeklyTier;
  readonly rewards: readonly WeeklyRewardDefinition[];
  readonly recentHistory: readonly WeeklyHistoryEntry[];
}

export const DEFAULT_WEEKLY_CHALLENGE: WeeklyChallengeState = { history: [] };
export const WEEKLY_HISTORY_LIMIT = 12;

export const WEEKLY_LOADOUTS: readonly WeeklyLoadoutConstraint[] = [
  {
    id: 'salvage-plating', name: 'Salvage Plating', kicker: 'MAKE THE TRASH SURVIVE ITS OWN PLAN',
    description: 'Scavenger starts with Scrap Plating. Build around metal durability and spatial value.',
    heroId: 'scavenger', startingPerkId: 'scrap-plating',
  },
  {
    id: 'engineer-overclock', name: 'Overclock Permit', kicker: 'THE WARRANTY ENDS ON MONDAY',
    description: 'Engineer starts with Overclock. Device timing is your weekly routing puzzle.',
    heroId: 'engineer', startingPerkId: 'overclock',
  },
  {
    id: 'toxic-warranty', name: 'Toxic Warranty', kicker: 'EVERY WEAPON NOW HAS PAPERWORK',
    description: 'Alchemist starts with Toxic Warranty. Weapons become poison delivery systems from fight one.',
    heroId: 'alchemist', startingPerkId: 'toxic-warranty',
  },
  {
    id: 'pet-laser-license', name: 'Pet Laser License', kicker: 'THE ANIMAL HAS BEEN ARMED LEGALLY ENOUGH',
    description: 'Beastfriend starts with Laser Pet. Route pets into a repeatable trigger engine.',
    heroId: 'beastfriend', startingPerkId: 'laser-pet',
  },
  {
    id: 'salvage-bad-idea', name: 'Bad Idea Salvage', kicker: 'FASTER TRASH, SAME INSURANCE',
    description: 'Scavenger starts with Bad Idea Energy. Every trigger speeds up, so layout quality matters earlier.',
    heroId: 'scavenger', startingPerkId: 'bad-idea-energy',
  },
  {
    id: 'signal-engineer', name: 'Signal Engineer', kicker: 'ANTENNAS ARE NOW A LABOR REQUIREMENT',
    description: 'Engineer starts with Signal Booster. Antenna tempo is the fixed weekly constraint.',
    heroId: 'engineer', startingPerkId: 'signal-booster',
  },
  {
    id: 'slime-alchemist', name: 'Slime Rights', kicker: 'THE OOZE HAS UNIONIZED',
    description: 'Alchemist starts with Slime Rights. Slime items become high-priority poison anchors.',
    heroId: 'alchemist', startingPerkId: 'slime-rights',
  },
  {
    id: 'catnip-beastfriend', name: 'Catnip Optics', kicker: 'CATS HAVE ENTERED THE ARMS RACE',
    description: 'Beastfriend starts with Catnip Optics. Cat placement defines the weekly damage ceiling.',
    heroId: 'beastfriend', startingPerkId: 'catnip-optics',
  },
] as const;

export const WEEKLY_TIER_THRESHOLDS: WeeklyTierThresholds = {
  bronze: 2500,
  silver: 5000,
  gold: 8000,
  realityBroken: 11000,
};

export function weeklyChallengeIdentity(nowMs = Date.now()): WeeklyChallengeIdentity {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const key = isoWeekKey(safeNow);
  return weeklyChallengeIdentityFromKey(key);
}

export function weeklyChallengeIdentityFromKey(key: string): WeeklyChallengeIdentity {
  assertWeeklyKey(key);
  return { key, seed: `weekly:${key}` };
}

export function weeklyKeyFromSeed(seed: string | number): string | null {
  if (typeof seed !== 'string' || !seed.startsWith('weekly:')) return null;
  const key = seed.slice('weekly:'.length);
  try {
    assertWeeklyKey(key);
    return key;
  } catch {
    return null;
  }
}

export function weeklyChallengeForKey(key: string): WeeklyChallengeDefinition {
  const identity = weeklyChallengeIdentityFromKey(key);
  const constraint = createSeededRng(`weekly-loadout:${key}`).pick(WEEKLY_LOADOUTS);
  return { ...identity, constraint, thresholds: WEEKLY_TIER_THRESHOLDS };
}

export function weeklyTierForScore(score: number, thresholds: WeeklyTierThresholds = WEEKLY_TIER_THRESHOLDS): WeeklyTier {
  const safeScore = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
  if (safeScore >= thresholds.realityBroken) return 'reality-broken';
  if (safeScore >= thresholds.gold) return 'gold';
  if (safeScore >= thresholds.silver) return 'silver';
  if (safeScore >= thresholds.bronze) return 'bronze';
  return 'none';
}

export function weeklyTierRank(tier: WeeklyTier): number {
  if (tier === 'bronze') return 1;
  if (tier === 'silver') return 2;
  if (tier === 'gold') return 3;
  if (tier === 'reality-broken') return 4;
  return 0;
}

export function weeklyAttemptsBucket(attempts: number): '0' | '1' | '2-3' | '4-7' | '8+' {
  const safe = Math.max(0, Math.floor(Number.isFinite(attempts) ? attempts : 0));
  if (safe === 0) return '0';
  if (safe === 1) return '1';
  if (safe <= 3) return '2-3';
  if (safe <= 7) return '4-7';
  return '8+';
}

export function weeklyScoreBucket(score: number): 'under-2500' | '2500-4999' | '5000-7999' | '8000-10999' | '11000+' {
  const safe = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
  if (safe < 2500) return 'under-2500';
  if (safe < 5000) return '2500-4999';
  if (safe < 8000) return '5000-7999';
  if (safe < 11000) return '8000-10999';
  return '11000+';
}

export function recordWeeklyAttempt(state: WeeklyChallengeState, key: string): WeeklyChallengeState {
  const challenge = weeklyChallengeForKey(key);
  const current = state.history.find((entry) => entry.key === key) ?? emptyHistory(challenge);
  return withHistoryEntry(state, { ...current, attempts: current.attempts + 1 });
}

export function recordWeeklyProgress(
  state: WeeklyChallengeState,
  key: string,
  score: number,
  deepestLoop: number,
): WeeklyProgressUpdate {
  const challenge = weeklyChallengeForKey(key);
  const current = state.history.find((entry) => entry.key === key) ?? emptyHistory(challenge);
  const safeScore = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
  const safeLoop = Math.max(0, Math.floor(Number.isFinite(deepestLoop) ? deepestLoop : 0));
  const earnedTier = weeklyTierForScore(safeScore, challenge.thresholds);
  const previousTier = current.bestTier;
  const bestTier = weeklyTierRank(earnedTier) > weeklyTierRank(previousTier) ? earnedTier : previousTier;
  const bestScore = Math.max(current.bestScore, safeScore);
  const nextRewards = new Set(current.earnedRewardIds);
  for (const reward of weeklyRewardsForKey(key)) {
    if (weeklyTierRank(bestTier) >= weeklyTierRank(reward.tier)) nextRewards.add(reward.id);
  }
  const updated: WeeklyHistoryEntry = {
    ...current,
    bestScore,
    deepestLoop: Math.max(current.deepestLoop, safeLoop),
    bestTier,
    earnedRewardIds: [...nextRewards].sort(),
  };
  return {
    state: withHistoryEntry(state, updated),
    entry: updated,
    previousTier,
    tierImproved: weeklyTierRank(bestTier) > weeklyTierRank(previousTier),
    scoreImproved: bestScore > current.bestScore,
  };
}

export function weeklyRewardsForKey(key: string): readonly WeeklyRewardDefinition[] {
  assertWeeklyKey(key);
  return [
    { id: `${key}:bronze`, tier: 'bronze', kind: 'sticker', name: 'Weekly Scrap Sticker' },
    { id: `${key}:silver`, tier: 'silver', kind: 'title', name: 'Deadline Survivor' },
    { id: `${key}:gold`, tier: 'gold', kind: 'frame', name: 'Gold Reality Frame' },
    { id: `${key}:reality-broken`, tier: 'reality-broken', kind: 'vfx', name: 'Broken Calendar VFX' },
  ];
}

export function createWeeklyBoardSnapshot(
  state: WeeklyChallengeState,
  key: string,
): WeeklyBoardSnapshot {
  const challenge = weeklyChallengeForKey(key);
  const current = state.history.find((entry) => entry.key === key) ?? emptyHistory(challenge);
  const recentHistory = [...state.history]
    .filter((entry) => entry.key !== key)
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 5);
  return {
    ...challenge,
    attempts: current.attempts,
    bestScore: current.bestScore,
    deepestLoop: current.deepestLoop,
    bestTier: current.bestTier,
    rewards: weeklyRewardsForKey(key),
    recentHistory,
  };
}

export function isWeeklyChallengeState(value: unknown): value is WeeklyChallengeState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<WeeklyChallengeState>;
  return Array.isArray(state.history)
    && state.history.length <= WEEKLY_HISTORY_LIMIT
    && state.history.every(isWeeklyHistoryEntry)
    && new Set(state.history.map((entry) => entry.key)).size === state.history.length;
}

function withHistoryEntry(state: WeeklyChallengeState, entry: WeeklyHistoryEntry): WeeklyChallengeState {
  const historyByKey = new Map(state.history.map((candidate) => [candidate.key, candidate]));
  historyByKey.set(entry.key, entry);
  const history = [...historyByKey.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, WEEKLY_HISTORY_LIMIT);
  return { history };
}

function emptyHistory(challenge: WeeklyChallengeDefinition): WeeklyHistoryEntry {
  return {
    key: challenge.key,
    attempts: 0,
    bestScore: 0,
    deepestLoop: 0,
    bestTier: 'none',
    heroId: challenge.constraint.heroId,
    startingPerkId: challenge.constraint.startingPerkId,
    earnedRewardIds: [],
  };
}

function isWeeklyHistoryEntry(value: unknown): value is WeeklyHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<WeeklyHistoryEntry>;
  if (typeof entry.key !== 'string') return false;
  try { assertWeeklyKey(entry.key); } catch { return false; }
  const challenge = weeklyChallengeForKey(entry.key);
  return isNonNegativeInteger(entry.attempts)
    && isNonNegativeInteger(entry.bestScore)
    && isNonNegativeInteger(entry.deepestLoop)
    && isWeeklyTier(entry.bestTier)
    && entry.heroId === challenge.constraint.heroId
    && entry.startingPerkId === challenge.constraint.startingPerkId
    && Array.isArray(entry.earnedRewardIds)
    && entry.earnedRewardIds.every((id) => typeof id === 'string' && weeklyRewardsForKey(entry.key!).some((reward) => reward.id === id));
}

function isWeeklyTier(value: unknown): value is WeeklyTier {
  return value === 'none' || value === 'bronze' || value === 'silver' || value === 'gold' || value === 'reality-broken';
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isoWeekKey(nowMs: number): string {
  const date = new Date(nowMs);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function assertWeeklyKey(key: string): void {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) throw new Error(`Invalid weekly key: ${key}`);
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isInteger(year) || year < 2000 || year > 9999 || week < 1 || week > 53) {
    throw new Error(`Invalid weekly key: ${key}`);
  }
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = Date.UTC(year, 0, 4 - (jan4Day - 1));
  const requestedMonday = week1Monday + (week - 1) * 7 * 86_400_000;
  if (isoWeekKey(requestedMonday) !== key) throw new Error(`Invalid weekly key: ${key}`);
}
