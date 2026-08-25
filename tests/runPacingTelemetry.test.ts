import { describe, expect, it } from 'vitest';
import type { TelemetryEnvelope, TelemetryEventName } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function event(
  sessionId: string,
  timestampMs: number,
  name: TelemetryEventName,
  payload: TelemetryEnvelope['payload'],
): TelemetryEnvelope {
  return { name, payload, sessionId, timestampMs } as TelemetryEnvelope;
}

describe('run pacing telemetry anchors', () => {
  it('measures first boss and six-world campaign completion from run_started when available', () => {
    const events: TelemetryEnvelope[] = [
      event('a', 0, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('a', 60_000, 'run_started', { mode: 'standard' }),
      event('a', 300_000, 'combat_started', { encounterId: 'w1-tv-tyrant', stage: 'World 1 · Boss' }),
      event('a', 1_440_000, 'combat_finished', { encounterId: 'w4-baby-moon', outcome: 'victory', durationMs: 60_000 }),
      event('a', 2_160_000, 'combat_finished', { encounterId: 'w6-border-shark', outcome: 'victory', durationMs: 75_000 }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.medianTimeToFirstBossMs).toBe(240_000);
    expect(summary.medianBaseCampaignDurationMs).toBe(2_100_000);
  });

  it('falls back to session_start for legacy exports without run_started', () => {
    const events: TelemetryEnvelope[] = [
      event('legacy', 10_000, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('legacy', 250_000, 'combat_started', { encounterId: 'w1-tv-tyrant', stage: 'World 1 · Boss' }),
      event('legacy', 1_510_000, 'combat_finished', { encounterId: 'w4-baby-moon', outcome: 'victory', durationMs: 60_000 }),
      event('legacy', 2_110_000, 'combat_finished', { encounterId: 'w6-border-shark', outcome: 'victory', durationMs: 75_000 }),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.medianTimeToFirstBossMs).toBe(240_000);
    expect(summary.medianBaseCampaignDurationMs).toBe(2_100_000);
  });
});
