import { describe, expect, it } from 'vitest';
import { TelemetryClient } from '../src/analytics/Telemetry';

describe('weekly challenge telemetry', () => {
  it('buffers bounded board, attempt-start and attempt-finish events', () => {
    const client = new TelemetryClient({ sessionId: 'weekly-test', now: () => 1234 });

    client.track('weekly_board_opened', { bestTier: 'silver', attemptsBucket: '2-3' });
    client.track('weekly_attempt_started', { constraintId: 'engineer-overclock', attemptsBucket: '4-7' });
    client.track('weekly_attempt_finished', {
      tier: 'gold',
      scoreBucket: '8000-10999',
      deepestLoop: 2,
      attemptsBucket: '4-7',
    });
    client.track('run_started', { mode: 'weekly' });

    expect(client.getBufferedEvents().map((event) => event.name)).toEqual([
      'weekly_board_opened',
      'weekly_attempt_started',
      'weekly_attempt_finished',
      'run_started',
    ]);
  });
});
