import { describe, expect, it } from 'vitest';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';
import type { TelemetryEnvelope } from '../src/analytics/Telemetry';

function event(name: TelemetryEnvelope['name'], payload: unknown, sessionId: string, timestampMs: number): TelemetryEnvelope {
  return { name, payload, sessionId, timestampMs } as TelemetryEnvelope;
}

describe('weekly soft-launch aggregation', () => {
  it('aggregates entry, board reach, finishes, retries, scores and tiers without player identity', () => {
    const events: TelemetryEnvelope[] = [
      event('session_start', { returning: false, platform: 'web', viewportMode: 'wide' }, 's1', 0),
      event('session_start', { returning: true, platform: 'web', viewportMode: 'wide' }, 's2', 0),
      event('run_started', { mode: 'weekly' }, 's1', 10),
      event('weekly_board_opened', { bestTier: 'none', attemptsBucket: '0' }, 's1', 20),
      event('weekly_attempt_started', { constraintId: 'engineer-overclock', attemptsBucket: '1' }, 's1', 30),
      event('weekly_attempt_finished', { tier: 'silver', scoreBucket: '5000-7999', deepestLoop: 1, attemptsBucket: '1' }, 's1', 40),
      event('run_started', { mode: 'weekly' }, 's2', 50),
      event('weekly_attempt_started', { constraintId: 'engineer-overclock', attemptsBucket: '2-3' }, 's2', 60),
      event('weekly_attempt_finished', { tier: 'gold', scoreBucket: '8000-10999', deepestLoop: 2, attemptsBucket: '2-3' }, 's2', 70),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.weeklyRunsStarted).toBe(2);
    expect(summary.weeklyChallenge).toMatchObject({
      sessionsStartingWeekly: 2,
      weeklyStartSessionRate: 1,
      sessionsOpeningBoard: 1,
      boardOpenRateAmongWeeklySessions: 0.5,
      sessionsFinishingAttempt: 2,
      finishSessionRateAmongWeeklySessions: 1,
      attemptStarts: 2,
      attemptFinishes: 2,
      finishToStartVolumeRatio: 1,
      attemptsBuckets: { '1': 1, '2-3': 1 },
      scoreBuckets: { '5000-7999': 1, '8000-10999': 1 },
      tierDistribution: { gold: 1, silver: 1 },
    });
  });
});
