import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../scripts/soft-launch-report.mjs';

function summary() {
  return {
    sessions: 10,
    returningRate: 0.4,
    returnAgeBuckets: {},
    sessionsWithAgeBucket: 0,
    sessionAgeCoverageRate: 0,
    sessionsWithHeroSelection: 0,
    heroSelectionSessionRate: 0,
    medianTimeToHeroMs: 0,
    p90TimeToHeroMs: 0,
    sessionsWithFirstCombat: 0,
    firstCombatSessionRate: 0,
    medianTimeToFirstCombatMs: 0,
    p90TimeToFirstCombatMs: 0,
    sessionsWithFirstBoss: 0,
    firstBossSessionRate: 0,
    medianTimeToFirstBossMs: 0,
    p90TimeToFirstBossMs: 0,
    sessionsCompletingBaseCampaign: 0,
    baseCampaignCompletionRate: 0,
    medianBaseCampaignDurationMs: 0,
    p90BaseCampaignDurationMs: 0,
    campaignWorlds: [],
    tutorialOpened: 0,
    tutorialCompleted: 0,
    tutorialSkipped: 0,
    tutorialCompletionRate: 0,
    standardRunsStarted: 8,
    dailyRunsStarted: 2,
    dailyRetention: {
      sessionsStartingDaily: 0,
      dailyStartSessionRate: 0,
      sessionsOpeningBoard: 0,
      boardOpenRateAmongDailySessions: 0,
      sessionsCompletingContract: 0,
      contractCompletionRateAmongDailySessions: 0,
      sessionsClaimingContract: 0,
      contractClaimRateAmongCompletedSessions: 0,
      sessionsClaimingTrackReward: 0,
      contractCompletions: 0,
      contractClaims: 0,
      trackRewardClaims: 0,
      streakBuckets: {},
    },
    heroMastery: {
      sessionsLevelingUp: 4,
      sessionLevelUpRate: 0.4,
      levelUpEvents: 7,
      cosmeticRewardUnlocks: 3,
      maxObservedLevel: 13,
      levelUpsByHero: { engineer: 4, scavenger: 3 },
      maxObservedLevelByHero: { engineer: 13, scavenger: 7 },
    },
    bossGrudges: {
      sessionsStartingGrudge: 3,
      grudgeStartSessionRate: 0.3,
      sessionsResolvingGrudge: 2,
      grudgeResolveSessionRate: 0.2,
      grudgeStarts: 4,
      grudgeResolutions: 2,
      aggregateResolveToStartRatio: 0.5,
      startsByBoss: { 'deadline-snail': 1, 'tv-tyrant': 3 },
      resolutionsByBoss: { 'tv-tyrant': 2 },
    },
    shopPurchases: 0,
    paidRerolls: 0,
    rewardedRerolls: 0,
    eventChoices: 0,
    fusions: 0,
    cashouts: 0,
    averageCashoutScore: 0,
    rewardedAdCompletionRate: 0,
    rewardedAdCompletions: 0,
    rewardedAdAttempts: 0,
    combats: [],
    loopEntries: {},
  };
}

describe('R2 soft-launch report', () => {
  it('renders mastery reach, cosmetic milestones and privacy-safe grudge volume', () => {
    const markdown = renderMarkdown(summary());
    expect(markdown).toContain('## Mastery & revenge retention');
    expect(markdown).toContain('Sessions with a Hero Mastery level-up: **40.0%** (4/10)');
    expect(markdown).toContain('Mastery level-ups: **7** · cosmetic milestones crossed: **3** · max observed emitted level: **13**');
    expect(markdown).toContain('engineer **4** · scavenger **3**');
    expect(markdown).toContain('Grudge start reach: **30.0%** (3/10 sessions; 4 starts)');
    expect(markdown).toContain('Grudge resolve reach: **20.0%** (2/10 sessions; 2 resolutions)');
    expect(markdown).toContain('Aggregate resolve/start volume ratio: **50.0%** (2/4)');
    expect(markdown).toContain('not a player-level revenge conversion rate');
    expect(markdown).toContain('| tv-tyrant | 3 | 2 | 66.7% |');
    expect(markdown).toContain('| deadline-snail | 1 | 0 | 0.0% |');
  });

  it('keeps the section stable for legacy summaries without R2 fields', () => {
    const legacy = summary();
    delete legacy.heroMastery;
    delete legacy.bossGrudges;
    const markdown = renderMarkdown(legacy);
    expect(markdown).toContain('Sessions with a Hero Mastery level-up: **0.0%** (0/10)');
    expect(markdown).toContain('No boss-grudge transitions in this export.');
  });
});
