import type { TelemetryEnvelope } from './Telemetry';

const CAMPAIGN_BOSS_ENCOUNTER_IDS = [
  'w1-tv-tyrant',
  'w2-deadline-snail',
  'w3-closet-monster',
  'w4-baby-moon',
  'w5-copycat-auditor',
  'w6-border-shark',
] as const;
const FIRST_BOSS_ENCOUNTER_ID = CAMPAIGN_BOSS_ENCOUNTER_IDS[0];
const FINAL_CAMPAIGN_BOSS_ENCOUNTER_ID = CAMPAIGN_BOSS_ENCOUNTER_IDS[CAMPAIGN_BOSS_ENCOUNTER_IDS.length - 1];

export interface CombatMetric {
  readonly encounterId: string;
  readonly attempts: number;
  readonly victories: number;
  readonly defeats: number;
  readonly winRate: number;
  readonly averageDurationMs: number;
  readonly medianDurationMs: number;
  readonly p90DurationMs: number;
}

export interface CampaignWorldMetric {
  readonly world: number;
  readonly bossEncounterId: string;
  readonly sessionsCleared: number;
  readonly sessionClearRate: number;
  readonly previousWorldContinuationRate: number | null;
  readonly averageTimeFromRunStartMs: number;
  readonly medianTimeFromRunStartMs: number;
  readonly p90TimeFromRunStartMs: number;
}

export interface DailyRetentionMetric {
  readonly sessionsStartingDaily: number;
  readonly dailyStartSessionRate: number;
  readonly sessionsOpeningBoard: number;
  readonly boardOpenRateAmongDailySessions: number;
  readonly sessionsCompletingContract: number;
  readonly contractCompletionRateAmongDailySessions: number;
  readonly sessionsClaimingContract: number;
  readonly contractClaimRateAmongCompletedSessions: number;
  readonly sessionsClaimingTrackReward: number;
  readonly contractCompletions: number;
  readonly contractClaims: number;
  readonly trackRewardClaims: number;
  readonly streakBuckets: Readonly<Record<string, number>>;
}

export interface HeroMasteryMetric {
  readonly sessionsLevelingUp: number;
  readonly sessionLevelUpRate: number;
  readonly levelUpEvents: number;
  readonly cosmeticRewardUnlocks: number;
  readonly maxObservedLevel: number;
  readonly levelUpsByHero: Readonly<Record<string, number>>;
  readonly maxObservedLevelByHero: Readonly<Record<string, number>>;
}

export interface BossGrudgeMetric {
  readonly sessionsStartingGrudge: number;
  readonly grudgeStartSessionRate: number;
  readonly sessionsResolvingGrudge: number;
  readonly grudgeResolveSessionRate: number;
  readonly grudgeStarts: number;
  readonly grudgeResolutions: number;
  readonly aggregateResolveToStartRatio: number;
  readonly startsByBoss: Readonly<Record<string, number>>;
  readonly resolutionsByBoss: Readonly<Record<string, number>>;
}

export interface SoftLaunchSummary {
  readonly sessions: number;
  readonly returningSessions: number;
  readonly returningRate: number;
  readonly returnAgeBuckets: Readonly<Record<string, number>>;
  readonly sessionsWithAgeBucket: number;
  readonly sessionAgeCoverageRate: number;
  readonly sessionsWithHeroSelection: number;
  readonly heroSelectionSessionRate: number;
  readonly averageTimeToHeroMs: number;
  readonly medianTimeToHeroMs: number;
  readonly p90TimeToHeroMs: number;
  readonly sessionsWithFirstCombat: number;
  readonly firstCombatSessionRate: number;
  readonly averageTimeToFirstCombatMs: number;
  readonly medianTimeToFirstCombatMs: number;
  readonly p90TimeToFirstCombatMs: number;
  readonly sessionsWithFirstBoss: number;
  readonly firstBossSessionRate: number;
  readonly averageTimeToFirstBossMs: number;
  readonly medianTimeToFirstBossMs: number;
  readonly p90TimeToFirstBossMs: number;
  readonly sessionsCompletingBaseCampaign: number;
  readonly baseCampaignCompletionRate: number;
  readonly averageBaseCampaignDurationMs: number;
  readonly medianBaseCampaignDurationMs: number;
  readonly p90BaseCampaignDurationMs: number;
  readonly campaignWorlds: readonly CampaignWorldMetric[];
  readonly standardRunsStarted: number;
  readonly dailyRunsStarted: number;
  readonly dailyRetention: DailyRetentionMetric;
  readonly heroMastery: HeroMasteryMetric;
  readonly bossGrudges: BossGrudgeMetric;
  readonly tutorialOpened: number;
  readonly tutorialCompleted: number;
  readonly tutorialSkipped: number;
  readonly tutorialCompletionRate: number;
  readonly heroSelections: Readonly<Record<string, number>>;
  readonly shopPurchases: number;
  readonly paidRerolls: number;
  readonly rewardedRerolls: number;
  readonly rewardedAdAttempts: number;
  readonly rewardedAdCompletions: number;
  readonly rewardedAdCompletionRate: number;
  readonly eventChoices: number;
  readonly fusions: number;
  readonly loopEntries: Readonly<Record<string, number>>;
  readonly cashouts: number;
  readonly averageCashoutScore: number;
  readonly combats: readonly CombatMetric[];
}

interface CombatAccumulator {
  attempts: number;
  victories: number;
  defeats: number;
  durationTotal: number;
  durations: number[];
}

export function summarizeTelemetry(events: readonly TelemetryEnvelope[]): SoftLaunchSummary {
  let sessions = 0;
  let returningSessions = 0;
  let standardRunsStarted = 0;
  let dailyRunsStarted = 0;
  let dailyContractCompletions = 0;
  let dailyContractClaims = 0;
  let dailyTrackRewardClaims = 0;
  let masteryLevelUpEvents = 0;
  let masteryCosmeticRewardUnlocks = 0;
  let maxObservedMasteryLevel = 0;
  let bossGrudgeStarts = 0;
  let bossGrudgeResolutions = 0;
  let tutorialOpened = 0;
  let tutorialCompleted = 0;
  let tutorialSkipped = 0;
  let shopPurchases = 0;
  let paidRerolls = 0;
  let rewardedRerolls = 0;
  let rewardedAdAttempts = 0;
  let rewardedAdCompletions = 0;
  let eventChoices = 0;
  let fusions = 0;
  let cashouts = 0;
  let cashoutScoreTotal = 0;
  const sessionAgeBySession = new Map<string, string>();
  const heroSelections: Record<string, number> = {};
  const masteryLevelUpsByHero: Record<string, number> = {};
  const masteryMaxLevelByHero: Record<string, number> = {};
  const grudgeStartsByBoss: Record<string, number> = {};
  const grudgeResolutionsByBoss: Record<string, number> = {};
  const loopEntries: Record<string, number> = {};
  const combats = new Map<string, CombatAccumulator>();
  const sessionStartedAt = new Map<string, number>();
  const runStartedAt = new Map<string, number>();
  const dailyRunSessions = new Set<string>();
  const dailyBoardSessions = new Set<string>();
  const dailyContractCompletedSessions = new Set<string>();
  const dailyContractClaimedSessions = new Set<string>();
  const dailyTrackClaimedSessions = new Set<string>();
  const dailyStreakBucketBySession = new Map<string, string>();
  const masteryLevelUpSessions = new Set<string>();
  const grudgeStartSessions = new Set<string>();
  const grudgeResolveSessions = new Set<string>();
  const firstHeroAt = new Map<string, number>();
  const firstCombatAt = new Map<string, number>();
  const firstBossAt = new Map<string, number>();
  const baseCampaignCompletedAt = new Map<string, number>();
  const campaignWorldCompletedAt = CAMPAIGN_BOSS_ENCOUNTER_IDS.map(() => new Map<string, number>());

  for (const event of events) {
    switch (event.name) {
      case 'session_start': {
        sessions += 1;
        const payload = event.payload as { returning: boolean };
        if (payload.returning) returningSessions += 1;
        rememberEarliest(sessionStartedAt, event.sessionId, event.timestampMs);
        break;
      }
      case 'session_age': {
        const payload = event.payload as { bucket: string };
        if (!sessionAgeBySession.has(event.sessionId)) sessionAgeBySession.set(event.sessionId, payload.bucket);
        break;
      }
      case 'run_started': {
        const payload = event.payload as { mode: 'standard' | 'daily' };
        if (payload.mode === 'daily') {
          dailyRunsStarted += 1;
          dailyRunSessions.add(event.sessionId);
        } else standardRunsStarted += 1;
        rememberEarliest(runStartedAt, event.sessionId, event.timestampMs);
        break;
      }
      case 'daily_board_opened': {
        const payload = event.payload as { streakBucket: string };
        dailyBoardSessions.add(event.sessionId);
        if (!dailyStreakBucketBySession.has(event.sessionId)) {
          dailyStreakBucketBySession.set(event.sessionId, payload.streakBucket);
        }
        break;
      }
      case 'daily_contract_completed': {
        dailyContractCompletions += 1;
        dailyContractCompletedSessions.add(event.sessionId);
        break;
      }
      case 'daily_contract_claimed': {
        dailyContractClaims += 1;
        dailyContractClaimedSessions.add(event.sessionId);
        break;
      }
      case 'daily_track_claimed': {
        dailyTrackRewardClaims += 1;
        dailyTrackClaimedSessions.add(event.sessionId);
        break;
      }
      case 'hero_mastery_level_up': {
        const payload = event.payload as { heroId: string; level: number; rewardCount: number };
        const level = Math.max(0, Math.floor(finiteNonNegative(payload.level)));
        masteryLevelUpEvents += 1;
        masteryCosmeticRewardUnlocks += Math.max(0, Math.floor(finiteNonNegative(payload.rewardCount)));
        maxObservedMasteryLevel = Math.max(maxObservedMasteryLevel, level);
        masteryLevelUpsByHero[payload.heroId] = (masteryLevelUpsByHero[payload.heroId] ?? 0) + 1;
        masteryMaxLevelByHero[payload.heroId] = Math.max(masteryMaxLevelByHero[payload.heroId] ?? 0, level);
        masteryLevelUpSessions.add(event.sessionId);
        break;
      }
      case 'boss_grudge_changed': {
        const payload = event.payload as { bossId: string; state: 'started' | 'resolved' };
        if (payload.state === 'started') {
          bossGrudgeStarts += 1;
          grudgeStartsByBoss[payload.bossId] = (grudgeStartsByBoss[payload.bossId] ?? 0) + 1;
          grudgeStartSessions.add(event.sessionId);
        } else {
          bossGrudgeResolutions += 1;
          grudgeResolutionsByBoss[payload.bossId] = (grudgeResolutionsByBoss[payload.bossId] ?? 0) + 1;
          grudgeResolveSessions.add(event.sessionId);
        }
        break;
      }
      case 'tutorial_opened': tutorialOpened += 1; break;
      case 'tutorial_completed': tutorialCompleted += 1; break;
      case 'tutorial_skipped': tutorialSkipped += 1; break;
      case 'hero_selected': {
        const payload = event.payload as { heroId: string };
        heroSelections[payload.heroId] = (heroSelections[payload.heroId] ?? 0) + 1;
        rememberEarliest(firstHeroAt, event.sessionId, event.timestampMs);
        break;
      }
      case 'shop_purchase': shopPurchases += 1; break;
      case 'shop_reroll': {
        const payload = event.payload as { source: 'coins' | 'rewarded' };
        if (payload.source === 'rewarded') rewardedRerolls += 1;
        else paidRerolls += 1;
        break;
      }
      case 'ad_result': {
        const payload = event.payload as { placement: string; format: string; result: string };
        if (payload.placement === 'shop-free-reroll' && payload.format === 'rewarded') {
          rewardedAdAttempts += 1;
          if (payload.result === 'rewarded') rewardedAdCompletions += 1;
        }
        break;
      }
      case 'combat_started': {
        const payload = event.payload as { encounterId: string };
        rememberEarliest(firstCombatAt, event.sessionId, event.timestampMs);
        if (payload.encounterId === FIRST_BOSS_ENCOUNTER_ID) rememberEarliest(firstBossAt, event.sessionId, event.timestampMs);
        break;
      }
      case 'run_event_choice': eventChoices += 1; break;
      case 'fusion_used': fusions += 1; break;
      case 'loop_entered': {
        const payload = event.payload as { loopNumber: number };
        const key = String(payload.loopNumber);
        loopEntries[key] = (loopEntries[key] ?? 0) + 1;
        break;
      }
      case 'run_cashout': {
        const payload = event.payload as { score: number };
        cashouts += 1;
        cashoutScoreTotal += finiteNonNegative(payload.score);
        break;
      }
      case 'combat_finished': {
        const payload = event.payload as { encounterId: string; outcome: 'victory' | 'defeat'; durationMs: number };
        const duration = finiteNonNegative(payload.durationMs);
        const metric = combats.get(payload.encounterId) ?? {
          attempts: 0,
          victories: 0,
          defeats: 0,
          durationTotal: 0,
          durations: [],
        };
        metric.attempts += 1;
        if (payload.outcome === 'victory') metric.victories += 1;
        else metric.defeats += 1;
        metric.durationTotal += duration;
        metric.durations.push(duration);
        combats.set(payload.encounterId, metric);

        if (payload.outcome === 'victory') {
          const campaignWorldIndex = CAMPAIGN_BOSS_ENCOUNTER_IDS.findIndex((encounterId) => encounterId === payload.encounterId);
          if (campaignWorldIndex >= 0) {
            const completedAt = campaignWorldCompletedAt[campaignWorldIndex];
            if (completedAt) rememberEarliest(completedAt, event.sessionId, event.timestampMs);
          }
          if (payload.encounterId === FINAL_CAMPAIGN_BOSS_ENCOUNTER_ID) {
            rememberEarliest(baseCampaignCompletedAt, event.sessionId, event.timestampMs);
          }
        }
        break;
      }
      default: break;
    }
  }

  const returnAgeBuckets: Record<string, number> = {};
  for (const bucket of sessionAgeBySession.values()) returnAgeBuckets[bucket] = (returnAgeBuckets[bucket] ?? 0) + 1;

  let sessionsWithAgeBucket = 0;
  for (const sessionId of sessionStartedAt.keys()) {
    if (sessionAgeBySession.has(sessionId)) sessionsWithAgeBucket += 1;
  }

  const dailyStreakBuckets: Record<string, number> = {};
  for (const bucket of dailyStreakBucketBySession.values()) {
    dailyStreakBuckets[bucket] = (dailyStreakBuckets[bucket] ?? 0) + 1;
  }

  const timeToHero = sessionLatencies(sessionStartedAt, firstHeroAt);
  const timeToFirstCombat = sessionLatencies(sessionStartedAt, firstCombatAt);
  const timeToFirstBoss = milestoneLatencies(runStartedAt, sessionStartedAt, firstBossAt);
  const baseCampaignDurations = milestoneLatencies(runStartedAt, sessionStartedAt, baseCampaignCompletedAt);
  const campaignWorldDurations = campaignWorldCompletedAt.map((completedAt) =>
    milestoneLatencies(runStartedAt, sessionStartedAt, completedAt));
  const campaignWorlds: CampaignWorldMetric[] = campaignWorldDurations.map((durations, index) => {
    const previousCount = index > 0 ? (campaignWorldDurations[index - 1]?.length ?? 0) : 0;
    return {
      world: index + 1,
      bossEncounterId: CAMPAIGN_BOSS_ENCOUNTER_IDS[index] ?? `world-${index + 1}`,
      sessionsCleared: durations.length,
      sessionClearRate: ratio(durations.length, sessions),
      previousWorldContinuationRate: index === 0 || previousCount === 0
        ? null
        : ratio(durations.length, previousCount),
      averageTimeFromRunStartMs: average(durations),
      medianTimeFromRunStartMs: percentile(durations, 0.5),
      p90TimeFromRunStartMs: percentile(durations, 0.9),
    };
  });

  return {
    sessions,
    returningSessions,
    returningRate: ratio(returningSessions, sessions),
    returnAgeBuckets: sortRecord(returnAgeBuckets),
    sessionsWithAgeBucket,
    sessionAgeCoverageRate: ratio(sessionsWithAgeBucket, sessionStartedAt.size),
    sessionsWithHeroSelection: timeToHero.length,
    heroSelectionSessionRate: ratio(timeToHero.length, sessions),
    averageTimeToHeroMs: average(timeToHero),
    medianTimeToHeroMs: percentile(timeToHero, 0.5),
    p90TimeToHeroMs: percentile(timeToHero, 0.9),
    sessionsWithFirstCombat: timeToFirstCombat.length,
    firstCombatSessionRate: ratio(timeToFirstCombat.length, sessions),
    averageTimeToFirstCombatMs: average(timeToFirstCombat),
    medianTimeToFirstCombatMs: percentile(timeToFirstCombat, 0.5),
    p90TimeToFirstCombatMs: percentile(timeToFirstCombat, 0.9),
    sessionsWithFirstBoss: timeToFirstBoss.length,
    firstBossSessionRate: ratio(timeToFirstBoss.length, sessions),
    averageTimeToFirstBossMs: average(timeToFirstBoss),
    medianTimeToFirstBossMs: percentile(timeToFirstBoss, 0.5),
    p90TimeToFirstBossMs: percentile(timeToFirstBoss, 0.9),
    sessionsCompletingBaseCampaign: baseCampaignDurations.length,
    baseCampaignCompletionRate: ratio(baseCampaignDurations.length, sessions),
    averageBaseCampaignDurationMs: average(baseCampaignDurations),
    medianBaseCampaignDurationMs: percentile(baseCampaignDurations, 0.5),
    p90BaseCampaignDurationMs: percentile(baseCampaignDurations, 0.9),
    campaignWorlds,
    standardRunsStarted,
    dailyRunsStarted,
    dailyRetention: {
      sessionsStartingDaily: dailyRunSessions.size,
      dailyStartSessionRate: ratio(dailyRunSessions.size, sessions),
      sessionsOpeningBoard: dailyBoardSessions.size,
      boardOpenRateAmongDailySessions: ratio(dailyBoardSessions.size, dailyRunSessions.size),
      sessionsCompletingContract: dailyContractCompletedSessions.size,
      contractCompletionRateAmongDailySessions: ratio(dailyContractCompletedSessions.size, dailyRunSessions.size),
      sessionsClaimingContract: dailyContractClaimedSessions.size,
      contractClaimRateAmongCompletedSessions: ratio(dailyContractClaimedSessions.size, dailyContractCompletedSessions.size),
      sessionsClaimingTrackReward: dailyTrackClaimedSessions.size,
      contractCompletions: dailyContractCompletions,
      contractClaims: dailyContractClaims,
      trackRewardClaims: dailyTrackRewardClaims,
      streakBuckets: sortRecord(dailyStreakBuckets),
    },
    heroMastery: {
      sessionsLevelingUp: masteryLevelUpSessions.size,
      sessionLevelUpRate: ratio(masteryLevelUpSessions.size, sessions),
      levelUpEvents: masteryLevelUpEvents,
      cosmeticRewardUnlocks: masteryCosmeticRewardUnlocks,
      maxObservedLevel: maxObservedMasteryLevel,
      levelUpsByHero: sortRecord(masteryLevelUpsByHero),
      maxObservedLevelByHero: sortRecord(masteryMaxLevelByHero),
    },
    bossGrudges: {
      sessionsStartingGrudge: grudgeStartSessions.size,
      grudgeStartSessionRate: ratio(grudgeStartSessions.size, sessions),
      sessionsResolvingGrudge: grudgeResolveSessions.size,
      grudgeResolveSessionRate: ratio(grudgeResolveSessions.size, sessions),
      grudgeStarts: bossGrudgeStarts,
      grudgeResolutions: bossGrudgeResolutions,
      aggregateResolveToStartRatio: ratio(bossGrudgeResolutions, bossGrudgeStarts),
      startsByBoss: sortRecord(grudgeStartsByBoss),
      resolutionsByBoss: sortRecord(grudgeResolutionsByBoss),
    },
    tutorialOpened,
    tutorialCompleted,
    tutorialSkipped,
    tutorialCompletionRate: ratio(tutorialCompleted, tutorialOpened),
    heroSelections: sortRecord(heroSelections),
    shopPurchases,
    paidRerolls,
    rewardedRerolls,
    rewardedAdAttempts,
    rewardedAdCompletions,
    rewardedAdCompletionRate: ratio(rewardedAdCompletions, rewardedAdAttempts),
    eventChoices,
    fusions,
    loopEntries: sortRecord(loopEntries),
    cashouts,
    averageCashoutScore: cashouts > 0 ? cashoutScoreTotal / cashouts : 0,
    combats: [...combats.entries()]
      .map(([encounterId, metric]) => ({
        encounterId,
        attempts: metric.attempts,
        victories: metric.victories,
        defeats: metric.defeats,
        winRate: ratio(metric.victories, metric.attempts),
        averageDurationMs: metric.attempts > 0 ? metric.durationTotal / metric.attempts : 0,
        medianDurationMs: percentile(metric.durations, 0.5),
        p90DurationMs: percentile(metric.durations, 0.9),
      }))
      .sort((a, b) => a.encounterId.localeCompare(b.encounterId)),
  };
}

function sessionLatencies(starts: ReadonlyMap<string, number>, milestones: ReadonlyMap<string, number>): number[] {
  const latencies: number[] = [];
  for (const [sessionId, startAt] of starts) {
    const milestoneAt = milestones.get(sessionId);
    if (milestoneAt === undefined || milestoneAt < startAt) continue;
    latencies.push(milestoneAt - startAt);
  }
  return latencies;
}

function milestoneLatencies(
  preferredStarts: ReadonlyMap<string, number>,
  fallbackStarts: ReadonlyMap<string, number>,
  milestones: ReadonlyMap<string, number>,
): number[] {
  const latencies: number[] = [];
  for (const [sessionId, milestoneAt] of milestones) {
    const startAt = preferredStarts.get(sessionId) ?? fallbackStarts.get(sessionId);
    if (startAt === undefined || milestoneAt < startAt) continue;
    latencies.push(milestoneAt - startAt);
  }
  return latencies;
}

function rememberEarliest(target: Map<string, number>, sessionId: string, timestampMs: number): void {
  if (!Number.isFinite(timestampMs)) return;
  const existing = target.get(sessionId);
  if (existing === undefined || timestampMs < existing) target.set(sessionId, timestampMs);
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: readonly number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function sortRecord(record: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}
