import { describe, expect, it } from 'vitest';
import type { TelemetryEnvelope } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function event(name: string, sessionId: string, timestampMs: number, payload: Record<string, unknown>): TelemetryEnvelope {
  return { name, sessionId, timestampMs, payload } as TelemetryEnvelope;
}

describe('daily retention telemetry summary', () => {
  it('deduplicates session funnel reach while retaining event totals', () => {
    const events: TelemetryEnvelope[] = [
      event('session_start', 'daily-a', 0, { returning: true, platform: 'local', viewportMode: 'wide' }),
      event('session_start', 'daily-b', 0, { returning: true, platform: 'local', viewportMode: 'wide' }),
      event('session_start', 'standard-c', 0, { returning: false, platform: 'local', viewportMode: 'wide' }),
      event('run_started', 'daily-a', 10, { mode: 'daily' }),
      event('run_started', 'daily-b', 10, { mode: 'daily' }),
      event('run_started', 'standard-c', 10, { mode: 'standard' }),
      event('daily_board_opened', 'daily-a', 20, { ruleId: 'duck-amnesty', streakBucket: '1-2' }),
      event('daily_board_opened', 'daily-a', 21, { ruleId: 'duck-amnesty', streakBucket: '1-2' }),
      event('daily_board_opened', 'daily-b', 20, { ruleId: 'soft-static', streakBucket: '3-6' }),
      event('daily_contract_completed', 'daily-a', 30, { archetype: 'fusion', target: 1 }),
      event('daily_contract_completed', 'daily-a', 31, { archetype: 'shop', target: 2 }),
      event('daily_contract_completed', 'daily-b', 32, { archetype: 'boss', target: 1 }),
      event('daily_contract_claimed', 'daily-a', 40, { archetype: 'fusion', streakBucket: '1-2', rewardTrackDay: 2 }),
      event('daily_contract_claimed', 'daily-a', 41, { archetype: 'shop', streakBucket: '1-2', rewardTrackDay: 2 }),
      event('daily_track_claimed', 'daily-a', 50, { milestone: 3, cycle: 0, stampReward: 2 }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.dailyRetention).toEqual({
      sessionsStartingDaily: 2,
      dailyStartSessionRate: 2 / 3,
      sessionsOpeningBoard: 2,
      boardOpenRateAmongDailySessions: 1,
      sessionsCompletingContract: 2,
      contractCompletionRateAmongDailySessions: 1,
      sessionsClaimingContract: 1,
      contractClaimRateAmongCompletedSessions: 0.5,
      sessionsClaimingTrackReward: 1,
      contractCompletions: 3,
      contractClaims: 2,
      trackRewardClaims: 1,
      streakBuckets: { '1-2': 1, '3-6': 1 },
    });
  });

  it('does not manufacture rates when a partial export lacks a daily denominator', () => {
    const summary = summarizeTelemetry([
      event('session_start', 'partial', 0, { returning: true, platform: 'local', viewportMode: 'wide' }),
      event('daily_contract_completed', 'partial', 10, { archetype: 'boss', target: 1 }),
      event('daily_contract_claimed', 'partial', 11, { archetype: 'boss', streakBucket: '3-6', rewardTrackDay: 4 }),
    ]);

    expect(summary.dailyRetention.sessionsStartingDaily).toBe(0);
    expect(summary.dailyRetention.contractCompletionRateAmongDailySessions).toBe(0);
    expect(summary.dailyRetention.contractClaimRateAmongCompletedSessions).toBe(1);
  });
});
