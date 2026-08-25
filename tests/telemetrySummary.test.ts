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
      encounterId: 'boss-a', attempts: 2, victories: 1, defeats: 1, winRate: 0.5, averageDurationMs: 40000,
    }]);
  });

  it('derives time-to-hero and time-to-first-combat from existing per-session timestamps', () => {
    const events: TelemetryEnvelope[] = [
      sessionEvent('a', 1000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('a', 4000, 'hero_selected', { heroId: 'engineer' }),
      sessionEvent('a', 9000, 'combat_started', { encounterId: 'w1-1', stage: 'World 1' }),
      sessionEvent('a', 12000, 'combat_started', { encounterId: 'w1-2', stage: 'World 1' }),
      sessionEvent('b', 2000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      sessionEvent('b', 7000, 'hero_selected', { heroId: 'scavenger' }),
      sessionEvent('c', 3000, 'session_start', { returning: true, platform: 'yandex', viewportMode: 'compact-landscape' }),
      sessionEvent('c', 2500, 'hero_selected', { heroId: 'engineer' }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.sessions).toBe(3);
    expect(summary.sessionsWithHeroSelection).toBe(2);
    expect(summary.heroSelectionSessionRate).toBeCloseTo(2 / 3);
    expect(summary.averageTimeToHeroMs).toBe(4000);
    expect(summary.sessionsWithFirstCombat).toBe(1);
    expect(summary.firstCombatSessionRate).toBeCloseTo(1 / 3);
    expect(summary.averageTimeToFirstCombatMs).toBe(8000);
  });

  it('returns stable zero rates for an empty stream', () => {
    const summary = summarizeTelemetry([]);
    expect(summary.sessions).toBe(0);
    expect(summary.returningRate).toBe(0);
    expect(summary.heroSelectionSessionRate).toBe(0);
    expect(summary.averageTimeToHeroMs).toBe(0);
    expect(summary.firstCombatSessionRate).toBe(0);
    expect(summary.averageTimeToFirstCombatMs).toBe(0);
    expect(summary.tutorialCompletionRate).toBe(0);
    expect(summary.rewardedAdCompletionRate).toBe(0);
    expect(summary.averageCashoutScore).toBe(0);
    expect(summary.combats).toEqual([]);
  });
});
