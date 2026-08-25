import { describe, expect, it } from 'vitest';
import type { TelemetryEnvelope, TelemetryEventName } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function event(name: TelemetryEventName, payload: TelemetryEnvelope['payload'], index: number): TelemetryEnvelope {
  return { name, payload, sessionId: `s-${index}`, timestampMs: index } as TelemetryEnvelope;
}

function sessionEvent(
  sessionId: string,
  timestampMs: number,
  name: TelemetryEventName,
  payload: TelemetryEnvelope['payload'],
): TelemetryEnvelope {
  return { name, payload, sessionId, timestampMs } as TelemetryEnvelope;
}

describe('summarizeTelemetry', () => {
  it('aggregates funnel, economy, ads, run depth and combat metrics', () => {
    const events: TelemetryEnvelope[] = [
      event('session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }, 1),
      event('session_start', { returning: true, platform: 'yandex', viewportMode: 'compact-landscape' }, 2),
      event('run_started', { mode: 'standard' }, 3),
      event('run_started', { mode: 'daily' }, 4),
      event('tutorial_opened', { step: 1 }, 5),
      event('tutorial_completed', { stepCount: 5 }, 6),
      event('hero_selected', { heroId: 'engineer' }, 7),
      event('hero_selected', { heroId: 'engineer' }, 8),
      event('hero_selected', { heroId: 'scavenger' }, 9),
      event('shop_purchase', { definitionId: 'laser-cat', price: 12 }, 10),
      event('shop_reroll', { source: 'coins', shopIndex: 1 }, 11),
      event('shop_reroll', { source: 'rewarded', shopIndex: 2 }, 12),
      event('ad_result', { placement: 'shop-free-reroll', format: 'rewarded', result: 'rewarded' }, 13),
      event('ad_result', { placement: 'shop-free-reroll', format: 'rewarded', result: 'dismissed' }, 14),
      event('run_event_choice', { eventId: 'cat-courier', choiceId: 'pay' }, 15),
      event('fusion_used', { recipeId: 'cat-gun', resultDefinitionId: 'cat-gun' }, 16),
      event('loop_entered', { loopNumber: 2 }, 17),
      event('run_cashout', { loopNumber: 2, score: 4000 }, 18),
      event('run_cashout', { loopNumber: 3, score: 6000 }, 19),
      event('combat_finished', { encounterId: 'boss-a', outcome: 'victory', durationMs: 30000 }, 20),
      event('combat_finished', { encounterId: 'boss-a', outcome: 'defeat', durationMs: 50000 }, 21),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.sessions).toBe(2);
    expect(summary.returningRate).toBe(0.5);
    expect(summary.standardRunsStarted).toBe(1);
    expect(summary.dailyRunsStarted).toBe(1);
    expect(summary.tutorialCompletionRate).toBe(1);
    expect(summary.heroSelections).toEqual({ engineer: 2, scavenger: 1 });
    expect(summary.shopPurchases).toBe(1);
    expect(summary.paidRerolls).toBe(1);
    expect(summary.rewardedRerolls).toBe(1);
    expect(summary.rewardedAdCompletionRate).toBe(0.5);
    expect(summary.eventChoices).toBe(1);
    expect(summary.fusions).toBe(1);
    expect(summary.loopEntries).toEqual({ '2': 1 });
    expect(summary.averageCashoutScore).toBe(5000);
    expect(summary.combats).toEqual([{
      encounterId: 'boss-a',
      attempts: 2,
      victories: 1,
      defeats: 1,
      winRate: 0.5,
      averageDurationMs: 40000,
      medianDurationMs: 30000,
      p90DurationMs: 50000,
    }]);
  });

  it('deduplicates return-age buckets while keeping coverage tied to started sessions', () => {
    const events: TelemetryEnvelope[] = [
      sessionEvent('a', 1000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('a', 1001, 'session_age', { bucket: 'new' }),
      sessionEvent('a', 1002, 'session_age', { bucket: 'under-24h' }),
      sessionEvent('b', 2000, 'session_start', { returning: true, platform: 'yandex', viewportMode: 'compact-landscape' }),
      sessionEvent('b', 2001, 'session_age', { bucket: '3-7d' }),
      sessionEvent('c', 3000, 'session_start', { returning: true, platform: 'crazygames', viewportMode: 'compact-landscape' }),
      sessionEvent('orphan', 4000, 'session_age', { bucket: '30d-plus' }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.returnAgeBuckets).toEqual({ '3-7d': 1, '30d-plus': 1, new: 1 });
    expect(summary.sessionsWithAgeBucket).toBe(2);
    expect(summary.sessionAgeCoverageRate).toBeCloseTo(2 / 3);
  });

  it('derives time-to-hero and time-to-first-combat distributions from existing per-session timestamps', () => {
    const events: TelemetryEnvelope[] = [
      sessionEvent('a', 1000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('a', 4000, 'hero_selected', { heroId: 'engineer' }),
      sessionEvent('a', 9000, 'combat_started', { encounterId: 'w1-1', stage: 'World 1' }),
      sessionEvent('a', 12000, 'combat_started', { encounterId: 'w1-2', stage: 'World 1' }),
      sessionEvent('b', 2000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('b', 7000, 'hero_selected', { heroId: 'scavenger' }),
      sessionEvent('b', 15000, 'combat_started', { encounterId: 'w1-1', stage: 'World 1' }),
      sessionEvent('c', 3000, 'session_start', { returning: true, platform: 'yandex', viewportMode: 'compact-landscape' }),
      sessionEvent('c', 2500, 'hero_selected', { heroId: 'engineer' }),
      sessionEvent('d', 4000, 'session_start', { returning: false, platform: 'crazygames', viewportMode: 'compact-landscape' }),
      sessionEvent('d', 13000, 'hero_selected', { heroId: 'engineer' }),
      sessionEvent('d', 24000, 'combat_started', { encounterId: 'w1-1', stage: 'World 1' }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.sessions).toBe(4);
    expect(summary.sessionsWithHeroSelection).toBe(3);
    expect(summary.heroSelectionSessionRate).toBeCloseTo(3 / 4);
    expect(summary.averageTimeToHeroMs).toBeCloseTo((3000 + 5000 + 9000) / 3);
    expect(summary.medianTimeToHeroMs).toBe(5000);
    expect(summary.p90TimeToHeroMs).toBe(9000);
    expect(summary.sessionsWithFirstCombat).toBe(3);
    expect(summary.firstCombatSessionRate).toBeCloseTo(3 / 4);
    expect(summary.averageTimeToFirstCombatMs).toBeCloseTo((8000 + 13000 + 20000) / 3);
    expect(summary.medianTimeToFirstCombatMs).toBe(13000);
    expect(summary.p90TimeToFirstCombatMs).toBe(20000);
  });

  it('derives first-boss reach and base-campaign completion pacing from existing encounter events', () => {
    const events: TelemetryEnvelope[] = [
      sessionEvent('a', 0, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('a', 180_000, 'combat_started', { encounterId: 'w1-tv-tyrant', stage: 'World 1 · Boss' }),
      sessionEvent('a', 1_260_000, 'combat_finished', { encounterId: 'w4-baby-moon', outcome: 'victory', durationMs: 55_000 }),
      sessionEvent('b', 10_000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('b', 250_000, 'combat_started', { encounterId: 'w1-tv-tyrant', stage: 'World 1 · Boss' }),
      sessionEvent('b', 1_510_000, 'combat_finished', { encounterId: 'w4-baby-moon', outcome: 'victory', durationMs: 62_000 }),
      sessionEvent('c', 20_000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('c', 350_000, 'combat_started', { encounterId: 'w1-tv-tyrant', stage: 'World 1 · Boss' }),
      sessionEvent('d', 30_000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.sessionsWithFirstBoss).toBe(3);
    expect(summary.firstBossSessionRate).toBeCloseTo(3 / 4);
    expect(summary.averageTimeToFirstBossMs).toBeCloseTo((180_000 + 240_000 + 330_000) / 3);
    expect(summary.medianTimeToFirstBossMs).toBe(240_000);
    expect(summary.p90TimeToFirstBossMs).toBe(330_000);
    expect(summary.sessionsCompletingBaseCampaign).toBe(2);
    expect(summary.baseCampaignCompletionRate).toBe(0.5);
    expect(summary.averageBaseCampaignDurationMs).toBeCloseTo((1_260_000 + 1_500_000) / 2);
    expect(summary.medianBaseCampaignDurationMs).toBe(1_260_000);
    expect(summary.p90BaseCampaignDurationMs).toBe(1_500_000);
  });

  it('uses nearest-rank percentiles for skewed combat durations', () => {
    const events = [10_000, 12_000, 13_000, 15_000, 80_000].map((durationMs, index) =>
      event('combat_finished', {
        encounterId: 'boss-skewed',
        outcome: index === 4 ? 'defeat' : 'victory',
        durationMs,
      }, index + 1));

    const [metric] = summarizeTelemetry(events).combats;
    expect(metric).toMatchObject({
      attempts: 5,
      victories: 4,
      defeats: 1,
      medianDurationMs: 13000,
      p90DurationMs: 80000,
    });
  });

  it('returns stable zero rates and percentiles for an empty stream', () => {
    const summary = summarizeTelemetry([]);
    expect(summary.sessions).toBe(0);
    expect(summary.returningRate).toBe(0);
    expect(summary.returnAgeBuckets).toEqual({});
    expect(summary.sessionsWithAgeBucket).toBe(0);
    expect(summary.sessionAgeCoverageRate).toBe(0);
    expect(summary.heroSelectionSessionRate).toBe(0);
    expect(summary.averageTimeToHeroMs).toBe(0);
    expect(summary.medianTimeToHeroMs).toBe(0);
    expect(summary.p90TimeToHeroMs).toBe(0);
    expect(summary.firstCombatSessionRate).toBe(0);
    expect(summary.averageTimeToFirstCombatMs).toBe(0);
    expect(summary.medianTimeToFirstCombatMs).toBe(0);
    expect(summary.p90TimeToFirstCombatMs).toBe(0);
    expect(summary.firstBossSessionRate).toBe(0);
    expect(summary.averageTimeToFirstBossMs).toBe(0);
    expect(summary.medianTimeToFirstBossMs).toBe(0);
    expect(summary.p90TimeToFirstBossMs).toBe(0);
    expect(summary.baseCampaignCompletionRate).toBe(0);
    expect(summary.averageBaseCampaignDurationMs).toBe(0);
    expect(summary.medianBaseCampaignDurationMs).toBe(0);
    expect(summary.p90BaseCampaignDurationMs).toBe(0);
    expect(summary.tutorialCompletionRate).toBe(0);
    expect(summary.rewardedAdCompletionRate).toBe(0);
    expect(summary.averageCashoutScore).toBe(0);
    expect(summary.combats).toEqual([]);
  });
});
