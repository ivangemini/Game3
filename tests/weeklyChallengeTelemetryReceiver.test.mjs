import { describe, expect, it } from 'vitest';
import { validateTelemetryBatch } from '../services/telemetry-receiver.mjs';

function batch(name, payload) {
  return {
    version: 1,
    events: [{ name, payload, sessionId: 'weekly-session', timestampMs: 1_000 }],
  };
}

describe('weekly telemetry receiver', () => {
  it('accepts bounded weekly funnel events', () => {
    expect(validateTelemetryBatch(batch('weekly_board_opened', {
      bestTier: 'silver', attemptsBucket: '2-3',
    })).ok).toBe(true);
    expect(validateTelemetryBatch(batch('weekly_attempt_started', {
      constraintId: 'engineer-overclock', attemptsBucket: '1',
    })).ok).toBe(true);
    expect(validateTelemetryBatch(batch('weekly_attempt_finished', {
      tier: 'reality-broken', scoreBucket: '11000+', deepestLoop: 3, attemptsBucket: '4-7',
    })).ok).toBe(true);
    expect(validateTelemetryBatch(batch('run_started', { mode: 'weekly' })).ok).toBe(true);
  });

  it('rejects arbitrary constraint ids and unbounded weekly values', () => {
    expect(validateTelemetryBatch(batch('weekly_attempt_started', {
      constraintId: 'forged-loadout', attemptsBucket: '1',
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch('weekly_attempt_finished', {
      tier: 'diamond', scoreBucket: 'infinite', deepestLoop: -1, attemptsBucket: '99+',
    })).ok).toBe(false);
  });
});
