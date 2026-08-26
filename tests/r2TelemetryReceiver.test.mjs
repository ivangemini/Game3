import { describe, expect, it } from 'vitest';
import { validateTelemetryBatch } from '../services/telemetry-receiver.mjs';

function batch(name, payload) {
  return {
    version: 1,
    events: [{ name, payload, sessionId: 'session-r2', timestampMs: 1234 }],
  };
}

describe('R2 telemetry receiver', () => {
  it('accepts bounded mastery and grudge transitions', () => {
    expect(validateTelemetryBatch(batch('hero_mastery_level_up', {
      heroId: 'beastfriend', level: 20, rewardCount: 7,
    })).ok).toBe(true);
    expect(validateTelemetryBatch(batch('boss_grudge_changed', {
      bossId: 'border-shark', state: 'resolved',
    })).ok).toBe(true);
  });

  it('rejects unknown heroes, bosses and out-of-range mastery levels', () => {
    expect(validateTelemetryBatch(batch('hero_mastery_level_up', {
      heroId: 'god-mode', level: 7, rewardCount: 1,
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch('hero_mastery_level_up', {
      heroId: 'engineer', level: 21, rewardCount: 1,
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch('boss_grudge_changed', {
      bossId: 'static-rats', state: 'started',
    })).ok).toBe(false);
  });
});
