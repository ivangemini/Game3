import { describe, expect, it } from 'vitest';
import { TelemetryClient } from '../src/analytics/Telemetry';

describe('R2 telemetry client', () => {
  it('buffers bounded mastery and grudge transition events', () => {
    const client = new TelemetryClient({ sessionId: 'session-r2', now: () => 1234 });
    client.track('hero_mastery_level_up', { heroId: 'engineer', level: 7, rewardCount: 1 });
    client.track('boss_grudge_changed', { bossId: 'copycat-auditor', state: 'started' });
    client.track('boss_grudge_changed', { bossId: 'copycat-auditor', state: 'resolved' });

    expect(client.getBufferedEvents()).toEqual([
      {
        name: 'hero_mastery_level_up',
        payload: { heroId: 'engineer', level: 7, rewardCount: 1 },
        sessionId: 'session-r2', timestampMs: 1234,
      },
      {
        name: 'boss_grudge_changed',
        payload: { bossId: 'copycat-auditor', state: 'started' },
        sessionId: 'session-r2', timestampMs: 1234,
      },
      {
        name: 'boss_grudge_changed',
        payload: { bossId: 'copycat-auditor', state: 'resolved' },
        sessionId: 'session-r2', timestampMs: 1234,
      },
    ]);
  });
});
