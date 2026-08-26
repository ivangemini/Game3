import { dailyKeyFromSeed, dailyRunIdentityFromKey } from './dailyRun';
import { createSeededRng } from './rng';
import { completedCampaignWorldCount, type RunProgressState } from './runProgression';

export type DailyCounterKey = 'bossVictories' | 'fusionUses' | 'eventChoices' | 'shopPurchases' | 'perkChoices';
export type DailyContractArchetype = 'boss' | 'fusion' | 'event' | 'shop' | 'perk' | 'world' | 'score' | 'loop';
export type DailyContractMetric = DailyCounterKey | 'campaignWorlds' | 'score' | 'loopEntered';

export interface DailyProgressCounters {
  readonly bossVictories: number;
  readonly fusionUses: number;
  readonly eventChoices: number;
  readonly shopPurchases: number;
  readonly perkChoices: number;
}

export interface DailyDayProgress {
  readonly key: string | null;
  readonly counters: DailyProgressCounters;
  readonly completedContractIds: readonly string[];
  readonly claimedContractIds: readonly string[];
}

export interface DailyRetentionState {
  readonly day: DailyDayProgress;
  readonly streakCount: number;
  readonly lastQualifiedKey: string | null;
  readonly realityStamps: number;
  readonly rewardTrackCycle: number;
  readonly rewardTrackDay: number;
  readonly earnedTrackMilestoneIds: readonly string[];
  readonly claimedTrackMilestoneIds: readonly string[];
}

export interface DailyContractDefinition {
  readonly id: string;
  readonly templateId: string;
  readonly archetype: DailyContractArchetype;
  readonly metric: DailyContractMetric;
  readonly title: string;
  readonly description: string;
  readonly target: number;
}

export interface DailyContractProgressSnapshot extends DailyContractDefinition {
  readonly current: number;
  readonly completed: boolean;
  readonly claimed: boolean;
}

export interface DailyRealityRule {
  readonly id: string;
  readonly name: string;
  readonly kicker: string;
  readonly description: string;
  readonly enemyHpPct: number;
  readonly enemyDamagePct: number;
  readonly enemyAttackSpeedPct: number;
  readonly rewardPct: number;
  readonly startingCoinsDelta: number;
  readonly rerollCost: number;
  readonly perkChoiceCount: number;
  readonly bonusPocketUnlocks: number;
}

export interface DailyRunProgressSnapshot {
  readonly progress: RunProgressState;
}

export interface DailyContractEvaluationResult {
  readonly state: DailyRetentionState;
  readonly newlyCompleted: readonly DailyContractDefinition[];
}

export interface DailyContractClaimResult {
  readonly state: DailyRetentionState;
  readonly claimed: boolean;
  readonly contract: DailyContractDefinition | null;
  readonly streakAdvanced: boolean;
}

export interface DailyTrackRewardSnapshot {
  readonly id: string;
  readonly cycle: number;
  readonly milestone: 3 | 5 | 7;
  readonly stampReward: number;
  readonly claimed: boolean;
}

export interface DailyTrackClaimResult {
  readonly state: DailyRetentionState;
  readonly claimed: boolean;
  readonly reward: DailyTrackRewardSnapshot | null;
}

export interface DailyBoardSnapshot {
  readonly key: string;
  readonly rule: DailyRealityRule;
  readonly contracts: readonly DailyContractProgressSnapshot[];
  readonly streakCount: number;
  readonly realityStamps: number;
  readonly rewardTrackCycle: number;
  readonly rewardTrackDay: number;
  readonly trackRewards: readonly DailyTrackRewardSnapshot[];
}

export const EMPTY_DAILY_COUNTERS: DailyProgressCounters = {
  bossVictories: 0,
  fusionUses: 0,
  eventChoices: 0,
  shopPurchases: 0,
  perkChoices: 0,
};

export const DEFAULT_DAILY_RETENTION: DailyRetentionState = {
  day: {
    key: null,
    counters: EMPTY_DAILY_COUNTERS,
    completedContractIds: [],
    claimedContractIds: [],
  },
  streakCount: 0,
  lastQualifiedKey: null,
  realityStamps: 0,
  rewardTrackCycle: 0,
  rewardTrackDay: 0,
  earnedTrackMilestoneIds: [],
  claimedTrackMilestoneIds: [],
};

export const DAILY_TRACK_MILESTONES = [3, 5, 7] as const;

const TRACK_REWARD_STAMPS: Readonly<Record<(typeof DAILY_TRACK_MILESTONES)[number], number>> = {
  3: 2,
  5: 3,
  7: 5,
};

interface ContractTemplate {
  readonly id: string;
  readonly archetype: DailyContractArchetype;
  readonly metric: DailyContractMetric;
  readonly title: string;
  readonly description: string;
  readonly target: number;
}

const PROGRESSION_CONTRACTS: readonly ContractTemplate[] = [
  { id: 'boss-1', archetype: 'boss', metric: 'bossVictories', title: 'FIRST SIGNATURE', description: 'Defeat 1 boss in today\'s Daily Run.', target: 1 },
  { id: 'boss-2', archetype: 'boss', metric: 'bossVictories', title: 'MANAGEMENT PROBLEM', description: 'Defeat 2 bosses in today\'s Daily Run.', target: 2 },
  { id: 'world-2', archetype: 'world', metric: 'campaignWorlds', title: 'KEEP THE RECEIPT', description: 'Clear World 2 before cashing out.', target: 2 },
  { id: 'world-3', archetype: 'world', metric: 'campaignWorlds', title: 'THREE-WORLD WARRANTY', description: 'Clear World 3 in today\'s run.', target: 3 },
  { id: 'score-1200', archetype: 'score', metric: 'score', title: 'NUMBER GO UP', description: 'Reach 1,200 run score.', target: 1200 },
  { id: 'loop-entry', archetype: 'loop', metric: 'loopEntered', title: 'VOID OVERTIME', description: 'Clear the campaign and enter Corrupted Loop 2.', target: 1 },
];

const BUILD_CONTRACTS: readonly ContractTemplate[] = [
  { id: 'fusion-1', archetype: 'fusion', metric: 'fusionUses', title: 'WARRANTY VOIDED', description: 'Create 1 fusion.', target: 1 },
  { id: 'fusion-2', archetype: 'fusion', metric: 'fusionUses', title: 'DOUBLE ILLEGAL', description: 'Create 2 fusions in today\'s Daily Run.', target: 2 },
  { id: 'perk-1', archetype: 'perk', metric: 'perkChoices', title: 'SIGN THE WAIVER', description: 'Lock in 1 boss perk.', target: 1 },
  { id: 'perk-2', archetype: 'perk', metric: 'perkChoices', title: 'BAD IDEA, TWICE', description: 'Lock in 2 boss perks.', target: 2 },
];

const DISCOVERY_CONTRACTS: readonly ContractTemplate[] = [
  { id: 'event-1', archetype: 'event', metric: 'eventChoices', title: 'ANSWER THE WEIRD PHONE', description: 'Resolve 1 strange event.', target: 1 },
  { id: 'event-2', archetype: 'event', metric: 'eventChoices', title: 'LOCAL CUSTOMS', description: 'Resolve 2 strange events.', target: 2 },
  { id: 'shop-2', archetype: 'shop', metric: 'shopPurchases', title: 'RETAIL THERAPY', description: 'Buy 2 pieces of junk.', target: 2 },
  { id: 'shop-4', archetype: 'shop', metric: 'shopPurchases', title: 'BAG FULL OF MISTAKES', description: 'Buy 4 pieces of junk.', target: 4 },
];

export const DAILY_REALITY_RULES: readonly DailyRealityRule[] = [
  {
    id: 'executive-pocket', name: 'Executive Pocket', kicker: 'SPACE IS A CORPORATE BENEFIT',
    description: 'Start with one extra backpack pocket. Enemies have +14% HP, rewards +14%.',
    enemyHpPct: 14, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 14,
    startingCoinsDelta: 0, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 1,
  },
  {
    id: 'glass-receipt', name: 'Glass Receipt', kicker: 'EVERYTHING BREAKS FASTER',
    description: 'Enemies have -18% HP but deal +22% damage. Rewards +20%.',
    enemyHpPct: -18, enemyDamagePct: 22, enemyAttackSpeedPct: 0, rewardPct: 20,
    startingCoinsDelta: 0, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'budget-black-hole', name: 'Budget Black Hole', kicker: 'POOR, BUT VERY SELECTIVE',
    description: 'Start with 25 less Scrap, but paid rerolls cost only 3. Enemies -8% HP, rewards +15%.',
    enemyHpPct: -8, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 15,
    startingCoinsDelta: -25, rerollCost: 3, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'overtime-router', name: 'Overtime Router', kicker: 'THE WIFI HAS A KNIFE',
    description: 'Enemies attack 18% faster. Start with +15 Scrap and earn +18% rewards.',
    enemyHpPct: 0, enemyDamagePct: 0, enemyAttackSpeedPct: 18, rewardPct: 18,
    startingCoinsDelta: 15, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'thick-slime-market', name: 'Thick Slime Market', kicker: 'SLOW, STICKY, PROFITABLE',
    description: 'Enemies have +22% HP but deal -8% damage. Rewards +20%.',
    enemyHpPct: 22, enemyDamagePct: -8, enemyAttackSpeedPct: 0, rewardPct: 20,
    startingCoinsDelta: 0, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'perk-committee', name: 'Perk Committee', kicker: 'TOO MANY EXECUTIVES',
    description: 'Bosses offer 4 perk choices. Enemies have +10% HP, rewards +12%.',
    enemyHpPct: 10, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 12,
    startingCoinsDelta: 0, rerollCost: 7, perkChoiceCount: 4, bonusPocketUnlocks: 0,
  },
  {
    id: 'minimal-paperwork', name: 'Minimal Paperwork', kicker: 'TWO OPTIONS. CHOOSE BADLY.',
    description: 'Bosses offer only 2 perk choices. Enemies -5% HP, rewards +28%.',
    enemyHpPct: -5, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 28,
    startingCoinsDelta: 0, rerollCost: 7, perkChoiceCount: 2, bonusPocketUnlocks: 0,
  },
  {
    id: 'expensive-chaos', name: 'Expensive Chaos', kicker: 'RICH ONCE, CONFUSED FOREVER',
    description: 'Start with +35 Scrap, but paid rerolls cost 11. Enemies deal +8% damage, rewards +15%.',
    enemyHpPct: 0, enemyDamagePct: 8, enemyAttackSpeedPct: 0, rewardPct: 15,
    startingCoinsDelta: 35, rerollCost: 11, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'coupon-fever', name: 'Coupon Fever', kicker: 'EVERY RECEIPT IS A THREAT',
    description: 'Paid rerolls cost 5. Enemies have +10% HP, but rewards are +30%.',
    enemyHpPct: 10, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 30,
    startingCoinsDelta: -10, rerollCost: 5, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'soft-static', name: 'Soft Static', kicker: 'FAST HANDS, SOFTER HITS',
    description: 'Enemies attack 14% faster but deal -10% damage. Rewards +12%.',
    enemyHpPct: 0, enemyDamagePct: -10, enemyAttackSpeedPct: 14, rewardPct: 12,
    startingCoinsDelta: 0, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
  {
    id: 'moon-rent-holiday', name: 'Moon Rent Holiday', kicker: 'THE FLOOR PLAN IS TEMPORARILY LEGAL',
    description: 'Start with one extra pocket but 20 less Scrap. Enemies deal +10% damage, rewards +18%.',
    enemyHpPct: 0, enemyDamagePct: 10, enemyAttackSpeedPct: 0, rewardPct: 18,
    startingCoinsDelta: -20, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 1,
  },
  {
    id: 'duck-amnesty', name: 'Duck Amnesty', kicker: 'THE GOVERNMENT HAS STOPPED ASKING',
    description: 'Start with +20 Scrap. Enemies deal +6% damage and rewards are +10%.',
    enemyHpPct: 0, enemyDamagePct: 6, enemyAttackSpeedPct: 0, rewardPct: 10,
    startingCoinsDelta: 20, rerollCost: 7, perkChoiceCount: 3, bonusPocketUnlocks: 0,
  },
] as const;

export function generateDailyContracts(key: string): readonly DailyContractDefinition[] {
  dailyRunIdentityFromKey(key);
  const rng = createSeededRng(`daily-contracts:${key}`);
  const templates = [
    rng.pick(PROGRESSION_CONTRACTS),
    rng.pick(BUILD_CONTRACTS),
    rng.pick(DISCOVERY_CONTRACTS),
  ];
  return templates.map((template) => ({ ...template, id: `${key}:${template.id}`, templateId: template.id }));
}

export function dailyRealityRuleForKey(key: string): DailyRealityRule {
  dailyRunIdentityFromKey(key);
  return createSeededRng(`daily-reality:${key}`).pick(DAILY_REALITY_RULES);
}

export function dailyRealityRuleForSeed(seed: string | number): DailyRealityRule | null {
  if (typeof seed !== 'string') return null;
  const key = dailyKeyFromSeed(seed);
  return key ? dailyRealityRuleForKey(key) : null;
}

export function startingCoinsForRun(seed: string | number, baseCoins = 110): number {
  const rule = dailyRealityRuleForSeed(seed);
  return Math.max(0, Math.floor(baseCoins + (rule?.startingCoinsDelta ?? 0)));
}

export function rerollCostForRun(seed: string | number, fallback = 7): number {
  return dailyRealityRuleForSeed(seed)?.rerollCost ?? fallback;
}

export function perkChoiceCountForRun(seed: string | number, fallback = 3): number {
  return dailyRealityRuleForSeed(seed)?.perkChoiceCount ?? fallback;
}

export function bonusPocketUnlocksForRun(seed: string | number): number {
  return dailyRealityRuleForSeed(seed)?.bonusPocketUnlocks ?? 0;
}

export function isDailyRealityRuleSafe(rule: DailyRealityRule): boolean {
  const risk = Math.max(0, rule.enemyHpPct) + Math.max(0, rule.enemyDamagePct) + Math.max(0, rule.enemyAttackSpeedPct);
  return rule.enemyHpPct >= -20 && rule.enemyHpPct <= 25
    && rule.enemyDamagePct >= -15 && rule.enemyDamagePct <= 25
    && rule.enemyAttackSpeedPct >= -15 && rule.enemyAttackSpeedPct <= 20
    && rule.rewardPct >= 0 && rule.rewardPct <= 35
    && 110 + rule.startingCoinsDelta >= 70
    && 110 + rule.startingCoinsDelta <= 160
    && rule.rerollCost >= 3 && rule.rerollCost <= 12
    && rule.perkChoiceCount >= 2 && rule.perkChoiceCount <= 4
    && rule.bonusPocketUnlocks >= 0 && rule.bonusPocketUnlocks <= 1
    && risk <= 40;
}

export function ensureDailyRetentionDay(state: DailyRetentionState, key: string): DailyRetentionState {
  dailyRunIdentityFromKey(key);
  if (state.day.key === key) return state;
  return {
    ...state,
    day: {
      key,
      counters: EMPTY_DAILY_COUNTERS,
      completedContractIds: [],
      claimedContractIds: [],
    },
  };
}

export function incrementDailyCounter(
  state: DailyRetentionState,
  key: string,
  counter: DailyCounterKey,
  amount = 1,
): DailyRetentionState {
  const normalized = ensureDailyRetentionDay(state, key);
  const gain = Math.max(0, Math.floor(amount));
  if (gain === 0) return normalized;
  return {
    ...normalized,
    day: {
      ...normalized.day,
      counters: {
        ...normalized.day.counters,
        [counter]: normalized.day.counters[counter] + gain,
      },
    },
  };
}

export function evaluateDailyContracts(
  state: DailyRetentionState,
  key: string,
  snapshot: DailyRunProgressSnapshot,
): DailyContractEvaluationResult {
  const normalized = ensureDailyRetentionDay(state, key);
  const contracts = generateDailyContracts(key);
  const completed = new Set(normalized.day.completedContractIds);
  const newlyCompleted: DailyContractDefinition[] = [];
  for (const contract of contracts) {
    if (completed.has(contract.id)) continue;
    if (contractMetricValue(contract.metric, normalized, snapshot.progress) < contract.target) continue;
    completed.add(contract.id);
    newlyCompleted.push(contract);
  }
  if (newlyCompleted.length === 0) return { state: normalized, newlyCompleted };
  return {
    state: {
      ...normalized,
      day: { ...normalized.day, completedContractIds: [...completed].sort() },
    },
    newlyCompleted,
  };
}

export function claimDailyContract(
  state: DailyRetentionState,
  key: string,
  contractId: string,
): DailyContractClaimResult {
  let normalized = ensureDailyRetentionDay(state, key);
  const contract = generateDailyContracts(key).find((candidate) => candidate.id === contractId) ?? null;
  if (!contract || !normalized.day.completedContractIds.includes(contractId) || normalized.day.claimedContractIds.includes(contractId)) {
    return { state: normalized, claimed: false, contract, streakAdvanced: false };
  }

  const firstClaimToday = normalized.day.claimedContractIds.length === 0;
  normalized = {
    ...normalized,
    realityStamps: normalized.realityStamps + 1,
    day: {
      ...normalized.day,
      claimedContractIds: [...normalized.day.claimedContractIds, contractId].sort(),
    },
  };
  const beforeStreak = normalized.streakCount;
  if (firstClaimToday) normalized = qualifyDailyDay(normalized, key);
  return {
    state: normalized,
    claimed: true,
    contract,
    streakAdvanced: normalized.streakCount !== beforeStreak,
  };
}

export function claimDailyTrackReward(
  state: DailyRetentionState,
  rewardId: string,
): DailyTrackClaimResult {
  if (!state.earnedTrackMilestoneIds.includes(rewardId) || state.claimedTrackMilestoneIds.includes(rewardId)) {
    return { state, claimed: false, reward: rewardSnapshot(state, rewardId) };
  }
  const reward = rewardSnapshot(state, rewardId);
  if (!reward) return { state, claimed: false, reward: null };
  return {
    state: {
      ...state,
      realityStamps: state.realityStamps + reward.stampReward,
      claimedTrackMilestoneIds: [...state.claimedTrackMilestoneIds, rewardId].sort(),
    },
    claimed: true,
    reward,
  };
}

export function createDailyBoardSnapshot(
  state: DailyRetentionState,
  key: string,
  snapshot: DailyRunProgressSnapshot,
): DailyBoardSnapshot {
  const normalized = ensureDailyRetentionDay(state, key);
  const contracts = generateDailyContracts(key).map((contract): DailyContractProgressSnapshot => {
    const current = contractMetricValue(contract.metric, normalized, snapshot.progress);
    return {
      ...contract,
      current: Math.min(contract.target, current),
      completed: normalized.day.completedContractIds.includes(contract.id) || current >= contract.target,
      claimed: normalized.day.claimedContractIds.includes(contract.id),
    };
  });
  const trackRewards = normalized.earnedTrackMilestoneIds
    .map((id) => rewardSnapshot(normalized, id))
    .filter((entry): entry is DailyTrackRewardSnapshot => entry !== null)
    .sort((left, right) => left.cycle - right.cycle || left.milestone - right.milestone);
  return {
    key,
    rule: dailyRealityRuleForKey(key),
    contracts,
    streakCount: normalized.streakCount,
    realityStamps: normalized.realityStamps,
    rewardTrackCycle: normalized.rewardTrackCycle,
    rewardTrackDay: normalized.rewardTrackDay,
    trackRewards,
  };
}

export function streakBucket(streakCount: number): '0' | '1-2' | '3-6' | '7-13' | '14+' {
  const safe = Math.max(0, Math.floor(streakCount));
  if (safe === 0) return '0';
  if (safe <= 2) return '1-2';
  if (safe <= 6) return '3-6';
  if (safe <= 13) return '7-13';
  return '14+';
}

export function isDailyRetentionState(value: unknown): value is DailyRetentionState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<DailyRetentionState>;
  return isDailyDayProgress(state.day)
    && isNonNegativeInteger(state.streakCount)
    && (state.lastQualifiedKey === null || isValidDailyKey(state.lastQualifiedKey))
    && isNonNegativeInteger(state.realityStamps)
    && isNonNegativeInteger(state.rewardTrackCycle)
    && isIntegerInRange(state.rewardTrackDay, 0, 7)
    && isStringArray(state.earnedTrackMilestoneIds)
    && isStringArray(state.claimedTrackMilestoneIds);
}

function qualifyDailyDay(state: DailyRetentionState, key: string): DailyRetentionState {
  if (state.lastQualifiedKey === key) return state;
  let nextStreak = 1;
  if (state.lastQualifiedKey) {
    const gap = utcDayDifference(state.lastQualifiedKey, key);
    if (gap <= 0) return state;
    nextStreak = gap === 1
      ? state.streakCount + 1
      : Math.max(0, state.streakCount - (gap - 1)) + 1;
  }

  let cycle = state.rewardTrackCycle;
  let day = state.rewardTrackDay;
  if (day >= 7) {
    cycle += 1;
    day = 1;
  } else {
    day += 1;
  }
  const milestone = DAILY_TRACK_MILESTONES.find((value) => value === day);
  const earned = [...state.earnedTrackMilestoneIds];
  if (milestone) {
    const id = trackMilestoneId(cycle, milestone);
    if (!earned.includes(id)) earned.push(id);
  }

  return {
    ...state,
    streakCount: nextStreak,
    lastQualifiedKey: key,
    rewardTrackCycle: cycle,
    rewardTrackDay: day,
    earnedTrackMilestoneIds: earned.sort(),
  };
}

function contractMetricValue(
  metric: DailyContractMetric,
  state: DailyRetentionState,
  progress: RunProgressState,
): number {
  if (metric === 'campaignWorlds') return completedCampaignWorldCount(progress);
  if (metric === 'score') return progress.score;
  if (metric === 'loopEntered') return progress.loopNumber >= 2 ? 1 : 0;
  return state.day.counters[metric];
}

function rewardSnapshot(state: DailyRetentionState, id: string): DailyTrackRewardSnapshot | null {
  const match = /^(\d+):(3|5|7)$/.exec(id);
  if (!match) return null;
  const cycle = Number(match[1]);
  const milestone = Number(match[2]) as 3 | 5 | 7;
  if (!Number.isInteger(cycle) || cycle < 0) return null;
  return {
    id,
    cycle,
    milestone,
    stampReward: TRACK_REWARD_STAMPS[milestone],
    claimed: state.claimedTrackMilestoneIds.includes(id),
  };
}

function trackMilestoneId(cycle: number, milestone: 3 | 5 | 7): string {
  return `${cycle}:${milestone}`;
}

function utcDayDifference(fromKey: string, toKey: string): number {
  return Math.round((dateKeyToUtcMs(toKey) - dateKeyToUtcMs(fromKey)) / 86_400_000);
}

function dateKeyToUtcMs(key: string): number {
  dailyRunIdentityFromKey(key);
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

function isDailyDayProgress(value: unknown): value is DailyDayProgress {
  if (!value || typeof value !== 'object') return false;
  const day = value as Partial<DailyDayProgress>;
  return (day.key === null || isValidDailyKey(day.key))
    && isDailyCounters(day.counters)
    && isStringArray(day.completedContractIds)
    && isStringArray(day.claimedContractIds);
}

function isDailyCounters(value: unknown): value is DailyProgressCounters {
  if (!value || typeof value !== 'object') return false;
  const counters = value as Partial<DailyProgressCounters>;
  return isNonNegativeInteger(counters.bossVictories)
    && isNonNegativeInteger(counters.fusionUses)
    && isNonNegativeInteger(counters.eventChoices)
    && isNonNegativeInteger(counters.shopPurchases)
    && isNonNegativeInteger(counters.perkChoices);
}

function isValidDailyKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    dailyRunIdentityFromKey(value);
    return true;
  } catch {
    return false;
  }
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
