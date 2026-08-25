import { describe, expect, it } from 'vitest';
import { buildReviewSignals, parseTelemetryText, renderMarkdown } from '../scripts/soft-launch-report.mjs';

function summary(overrides = {}) {
  return {
    sessions: 4,
    returningRate: 0.25,
    returnAgeBuckets: { new: 1, 'under-24h': 3 },
    sessionsWithAgeBucket: 4,
    sessionAgeCoverageRate: 1,
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
    medianBaseCampaignDurationMs: 2100000,
    p90BaseCampaignDurationMs: 2460000,
    campaignWorlds: [{
      world: 1,
      bossEncounterId: 'w1-tv-tyrant',
      sessionsCleared: 3,
      sessionClearRate: 0.75,
      previousWorldContinuationRate: null,
      medianTimeFromRunStartMs: 240000,
      p90TimeFromRunStartMs: 330000,
    }, {
      world: 2,
      bossEncounterId: 'w2-deadline-snail',
      sessionsCleared: 2,
      sessionClearRate: 0.5,
      previousWorldContinuationRate: 2 / 3,
      medianTimeFromRunStartMs: 600000,
      p90TimeFromRunStartMs: 720000,
    }],
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

  it('surfaces first-boss, six-world pacing and adjacent-world continuation', () => {
    const markdown = renderMarkdown(summary());
    expect(markdown).toContain('Return-age telemetry coverage: **100.0%** (4/4)');
    expect(markdown).toContain('## Review signals');
    expect(markdown).toContain('[DATA] First-boss pacing: 3/20 reached sessions');
    expect(markdown).toContain('not D1/D7 cohort-retention rates');
    expect(markdown).toContain('First boss reach');
    expect(markdown).toContain('p50 4.0 min, p90 5.5 min');
    expect(markdown).toContain('Target p50: **3–5 min**');
    expect(markdown).toContain('Base campaign completion');
    expect(markdown).toContain('p50 35.0 min, p90 41.0 min');
    expect(markdown).toContain('Target p50: **32–42 min**');
    expect(markdown).toContain('| w1-tv-tyrant | 3 | 66.7% | 50.0 s | 48.0 s | 1.1 min |');
    expect(markdown).toContain('## Campaign world funnel');
    expect(markdown).toContain('| 1 | w1-tv-tyrant | 3 | 75.0% | — | 4.0 min | 5.5 min |');
    expect(markdown).toContain('| 2 | w2-deadline-snail | 2 | 50.0% | 66.7% | 10.0 min | 12.0 min |');
  });

  it('marks pacing on target only after operational sample floors are met', () => {
    const signals = buildReviewSignals(summary({
      sessions: 40,
      sessionsWithAgeBucket: 39,
      sessionAgeCoverageRate: 39 / 40,
      sessionsWithFirstBoss: 24,
      medianTimeToFirstBossMs: 240000,
      sessionsCompletingBaseCampaign: 18,
      medianBaseCampaignDurationMs: 2160000,
    }));

    expect(signals).toContain('[ON TARGET] Return-age instrumentation coverage is 97.5%.');
    expect(signals).toContain('[ON TARGET] First-boss pacing p50 is 4.0 min within the 3.0 min–5.0 min target.');
    expect(signals).toContain('[ON TARGET] Base-campaign pacing p50 is 36.0 min within the 32.0 min–42.0 min target.');
  });

  it('flags instrumentation and pacing deviations once samples are large enough', () => {
    const signals = buildReviewSignals(summary({
      sessions: 40,
      sessionsWithAgeBucket: 32,
      sessionAgeCoverageRate: 0.8,
      sessionsWithFirstBoss: 24,
      medianTimeToFirstBossMs: 360000,
      sessionsCompletingBaseCampaign: 18,
      medianBaseCampaignDurationMs: 2640000,
    }));

    expect(signals).toContain('[WATCH] Return-age instrumentation coverage is 80.0%; target is at least 95.0% before interpreting age-bucket mix.');
    expect(signals).toContain('[WATCH] First-boss pacing p50 is 6.0 min, slower than the 3.0 min–5.0 min target.');
    expect(signals).toContain('[WATCH] Base-campaign pacing p50 is 44.0 min, slower than the 32.0 min–42.0 min target.');
  });
});
