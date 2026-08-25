import { describe, expect, it } from 'vitest';
import type { TelemetryEnvelope } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function age(sessionId: string, bucket: 'new' | 'under-24h' | '1-2d' | '3-7d' | '8-30d' | '30d-plus' | 'unknown'): TelemetryEnvelope {
  return { name: 'session_age', payload: { bucket }, sessionId, timestampMs: 1 } as TelemetryEnvelope;
}

describe('return age summary', () => {
  it('counts coarse local return-age buckets without a persistent user id', () => {
    const summary = summarizeTelemetry([
      age('a', 'new'),
      age('b', '1-2d'),
      age('c', '1-2d'),
      age('d', '3-7d'),
      age('e', '30d-plus'),
    ]);
    expect(summary.returnAgeBuckets).toEqual({
      '1-2d': 2,
      '3-7d': 1,
      '30d-plus': 1,
      new: 1,
    });
  });
});
