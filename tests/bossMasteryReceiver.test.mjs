import { describe, expect, it } from 'vitest';
import { validateTelemetryBatch } from '../services/telemetry-receiver.mjs';

function batch(payload) {
  return {
    version: 1,
    events: [{
      name: 'boss_mastery_challenge_completed',
      sessionId: 'session-boss-1',
      timestampMs: 1000,
      payload,
    }],
  };
}

describe('boss mastery telemetry receiver', () => {
  it('accepts an exact known boss/challenge/star tuple', () => {
    expect(validateTelemetryBatch(batch({
      bossId: 'deadline-snail',
      challengeId: 'snail-clock-union',
      star: 3,
    })).ok).toBe(true);
  });

  it('rejects unknown challenges and mismatched boss/star tuples', () => {
    expect(validateTelemetryBatch(batch({
      bossId: 'deadline-snail',
      challengeId: 'not-real',
      star: 3,
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch({
      bossId: 'tv-tyrant',
      challengeId: 'snail-clock-union',
      star: 3,
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch({
      bossId: 'deadline-snail',
      challengeId: 'snail-clock-union',
      star: 2,
    })).ok).toBe(false);
  });

  it('rejects extra layout or identity payload fields', () => {
    expect(validateTelemetryBatch(batch({
      bossId: 'border-shark',
      challengeId: 'shark-rent-control',
      star: 3,
      backpackItems: ['secret-layout'],
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch({
      bossId: 'border-shark',
      challengeId: 'shark-rent-control',
      star: 3,
      playerId: 'persistent-user',
    })).ok).toBe(false);
  });
});
