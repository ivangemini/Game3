import { describe, expect, it } from 'vitest';
import { validateTelemetryBatch } from '../services/telemetry-receiver.mjs';

function batch(bucket) {
  return {
    version: 1,
    events: [{
      name: 'session_age',
      payload: { bucket },
      sessionId: 'session-age-test',
      timestampMs: 1000,
    }],
  };
}

describe('session_age receiver contract', () => {
  it('accepts known coarse buckets and rejects arbitrary values or extra payload fields', () => {
    for (const bucket of ['new', 'under-24h', '1-2d', '3-7d', '8-30d', '30d-plus', 'unknown']) {
      expect(validateTelemetryBatch(batch(bucket)).ok, bucket).toBe(true);
    }
    expect(validateTelemetryBatch(batch('exact-37-hours'))).toMatchObject({ ok: false });
    const withExtra = batch('1-2d');
    withExtra.events[0].payload.exactAgeMs = 123456789;
    expect(validateTelemetryBatch(withExtra)).toMatchObject({ ok: false });
  });
});
