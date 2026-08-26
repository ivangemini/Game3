import { describe, expect, it } from 'vitest';
import { TelemetryClient, type TelemetryEnvelope } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function event(sessionId: string, timestampMs: number, name: TelemetryEnvelope['name'], payload: TelemetryEnvelope['payload']): TelemetryEnvelope {
  return { sessionId, timestampMs, name, payload } as TelemetryEnvelope;
}

describe('boss counterplay telemetry', () => {
  it('buffers only bounded completion identity, not backpack state', () => {
    const client = new TelemetryClient({ sessionId: 'session-boss-mastery', now: () => 1234 });
    client.track('boss_mastery_challenge_completed', {
      bossId: 'copycat-auditor',
      challengeId: 'auditor-originals-only',
      star: 3,
    });

    expect(client.getBufferedEvents()).toEqual([{
      sessionId: 'session-boss-mastery',
      timestampMs: 1234,
      name: 'boss_mastery_challenge_completed',
      payload: {
        bossId: 'copycat-auditor',
        challengeId: 'auditor-originals-only',
        star: 3,
      },
    }]);
  });

  it('aggregates session reach, per-boss completions and highest emitted star', () => {
    const events: TelemetryEnvelope[] = [
      event('a', 1, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('b', 2, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('c', 3, 'session_start', { returning: true, platform: 'yandex', viewportMode: 'compact-landscape' }),
      event('a', 10, 'boss_mastery_challenge_completed', { bossId: 'tv-tyrant', challengeId: 'tv-backup-channel', star: 1 }),
      event('a', 11, 'boss_mastery_challenge_completed', { bossId: 'tv-tyrant', challengeId: 'tv-split-signal', star: 2 }),
      event('b', 12, 'boss_mastery_challenge_completed', { bossId: 'border-shark', challengeId: 'shark-cheap-rent', star: 1 }),
    ];

    const summary = summarizeTelemetry(events).bossCounterplay;
    expect(summary.sessionsCompletingChallenge).toBe(2);
    expect(summary.challengeCompletionSessionRate).toBeCloseTo(2 / 3);
    expect(summary.challengeCompletions).toBe(3);
    expect(summary.completionsByBoss).toEqual({ 'border-shark': 1, 'tv-tyrant': 2 });
    expect(summary.completionsByChallenge).toEqual({
      'shark-cheap-rent': 1,
      'tv-backup-channel': 1,
      'tv-split-signal': 1,
    });
    expect(summary.maxStarObservedByBoss).toEqual({ 'border-shark': 1, 'tv-tyrant': 2 });
  });

  it('returns stable zero counterplay metrics for old exports', () => {
    expect(summarizeTelemetry([]).bossCounterplay).toEqual({
      sessionsCompletingChallenge: 0,
      challengeCompletionSessionRate: 0,
      challengeCompletions: 0,
      completionsByBoss: {},
      completionsByChallenge: {},
      maxStarObservedByBoss: {},
    });
  });
});
