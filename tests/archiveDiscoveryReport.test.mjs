import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../scripts/soft-launch-report.mjs';

function baseSummary() {
  return {
    sessions: 10,
    returningRate: 0,
    returnAgeBuckets: {}, sessionsWithAgeBucket: 0, sessionAgeCoverageRate: 0,
    sessionsWithHeroSelection: 0, heroSelectionSessionRate: 0, medianTimeToHeroMs: 0, p90TimeToHeroMs: 0,
    sessionsWithFirstCombat: 0, firstCombatSessionRate: 0, medianTimeToFirstCombatMs: 0, p90TimeToFirstCombatMs: 0,
    sessionsWithFirstBoss: 0, firstBossSessionRate: 0, medianTimeToFirstBossMs: 0, p90TimeToFirstBossMs: 0,
    sessionsCompletingBaseCampaign: 0, baseCampaignCompletionRate: 0, medianBaseCampaignDurationMs: 0, p90BaseCampaignDurationMs: 0,
    campaignWorlds: [], standardRunsStarted: 0, dailyRunsStarted: 0,
    dailyRetention: undefined, heroMastery: undefined, bossGrudges: undefined,
    tutorialOpened: 0, tutorialCompleted: 0, tutorialSkipped: 0, tutorialCompletionRate: 0,
    shopPurchases: 0, paidRerolls: 0, rewardedRerolls: 0,
    rewardedAdAttempts: 0, rewardedAdCompletions: 0, rewardedAdCompletionRate: 0,
    eventChoices: 0, fusions: 0, cashouts: 0, averageCashoutScore: 0, combats: [], loopEntries: {},
  };
}

describe('archive discovery report', () => {
  it('renders archive reach and almost-solved exposure without identities', () => {
    const markdown = renderMarkdown({
      ...baseSummary(),
      archiveDiscovery: {
        sessionsViewingArchive: 6,
        archiveViewSessionRate: 0.6,
        sessionsViewingRecipes: 4,
        recipeViewSessionRate: 0.4,
        recipeTabViews: 7,
        sessionsViewingAlmostSolved: 3,
        almostSolvedExposureRateAmongRecipeViewers: 0.75,
        maxTracedRecipesObserved: 8,
        maxAlmostSolvedRecipesObserved: 3,
      },
    });

    expect(markdown).toContain('## Archive discovery');
    expect(markdown).toContain('Junk Archive reach: **60.0%** (6/10 sessions)');
    expect(markdown).toContain('Recipe Book reach: **40.0%** (4/10 sessions; 7 recipe-tab views)');
    expect(markdown).toContain('ALMOST SOLVED recipe: **75.0%** (3/4 Recipe Book sessions)');
    expect(markdown).toContain('**8 traced** · **3 almost solved**');
    expect(markdown).toContain('do not transmit recipe IDs, item IDs or the hidden result');
  });

  it('keeps legacy summaries renderable before archive telemetry exists', () => {
    const markdown = renderMarkdown(baseSummary());
    expect(markdown).toContain('Junk Archive reach: **0.0%** (0/10 sessions)');
    expect(markdown).toContain('Recipe Book reach: **0.0%** (0/10 sessions; 0 recipe-tab views)');
  });
});
