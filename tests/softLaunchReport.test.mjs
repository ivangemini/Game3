import { describe, expect, it } from 'vitest';
import { parseTelemetryText, renderMarkdown } from '../scripts/soft-launch-report.mjs';

function summary(overrides = {}) {
  return {
    sessions: 4,
    returningRate: 0.25,
    sessionsWithHeroSelection: 4,
    heroSelectionSessionRate: 1,
    medianTimeToHeroMs: 3000,
    p90TimeToHeroMs: 8000,
    sessionsWithFirstCombat: 3,
    firstCombatSessionRate: 0.75,
    medianTimeToFirstCombatMs: 12000,
    p90TimeToFirstCombatMs: 30000,
    sessionsWithFirstBoss: 3,
    firstBossSessionRate: 0.75,
    medianTimeToFirstBossMs: 240000,
    p90TimeToFirstBossMs: 330000,
    sessionsCompletingBaseCampaign: 2,
    baseCampaignCompletionRate: 0.5,
    medianBaseCampaignDurationMs: 1320000,
    p90BaseCampaignDurationMs: 1500000,
    tutorialOpened: 2,
    tutorialCompleted: 1,
    tutorialSkipped: 0,
    tutorialCompletionRate: 0.5,
    standardRunsStarted: 4,
    dailyRunsStarted: 0,
    shopPurchases: 8,
    paidRerolls: 2,
    rewardedRerolls: 1,
    eventChoices: 3,
    fusions: 4,
    cashouts: 1,
    averageCashoutScore: 4200,
    rewardedAdCompletionRate: 0.5,
    rewardedAdCompletions: 1,
    rewardedAdAttempts: 2,
    combats: [{
      encounterId: 'w1-tv-tyrant',
      attempts: 3,
      winRate: 2 / 3,
      averageDurationMs: 50000,
      medianDurationMs: 48000,
      p90DurationMs: 65000,
    }],
    loopEntries: { '2': 1 },
    ...overrides,
  };
}

describe('soft-launch report', () => {
  it('parses versioned batches and NDJSON envelopes', () => {
    const event = { name: 'session_start', payload: {}, sessionId: 's-a', timestampMs: 1 };
    expect(parseTelemetryText(JSON.stringify({ version: 1, events: [event] }))).toEqual([event]);
    expect(parseTelemetryText(`${JSON.stringify(event)}\n${JSON.stringify({ events: [event] })}`)).toEqual([event, event]);
  });

  it('surfaces first-boss and base-campaign pacing targets alongside p50/p90', () => {
    const markdown = renderMarkdown(summary());
    expect(markdown).toContain('First boss reach');
    expect(markdown).toContain('p50 4.0 min, p90 5.5 min');
    expect(markdown).toContain('Target p50: **3–5 min**');
    expect(markdown).toContain('Base campaign completion');
    expect(markdown).toContain('p50 22.0 min, p90 25.0 min');
    expect(markdown).toContain('Target p50: **20–25 min**');
    expect(markdown).toContain('| w1-tv-tyrant | 3 | 66.7% | 50.0 s | 48.0 s | 1.1 min |');
  });
});
