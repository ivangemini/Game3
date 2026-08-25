import { describe, expect, it } from 'vitest';
import type { TelemetryEnvelope, TelemetryEventName } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

const CAMPAIGN_BOSSES = [
  'w1-tv-tyrant',
  'w2-deadline-snail',
  'w3-closet-monster',
  'w4-baby-moon',
  'w5-copycat-auditor',
  'w6-border-shark',
] as const;

function event(
  sessionId: string,
  timestampMs: number,
  name: TelemetryEventName,
  payload: TelemetryEnvelope['payload'],
): TelemetryEnvelope {
  return { name, payload, sessionId, timestampMs } as TelemetryEnvelope;
}

function sessionStart(sessionId: string): TelemetryEnvelope[] {
  return [
    event(sessionId, 0, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
    event(sessionId, 0, 'run_started', { mode: 'standard' }),
  ];
}

function bossVictory(sessionId: string, worldIndex: number, timestampMs: number): TelemetryEnvelope {
  return event(sessionId, timestampMs, 'combat_finished', {
    encounterId: CAMPAIGN_BOSSES[worldIndex]!,
    outcome: 'victory',
    durationMs: 60_000,
  });
}

describe('six-world campaign telemetry funnel', () => {
  it('derives per-world reach, continuation and timing from existing boss victories', () => {
    const events: TelemetryEnvelope[] = [
      ...sessionStart('a'),
      ...sessionStart('b'),
      ...sessionStart('c'),
      ...sessionStart('d'),
      ...CAMPAIGN_BOSSES.map((_, index) => bossVictory('a', index, (index + 1) * 240_000)),
      ...CAMPAIGN_BOSSES.slice(0, 4).map((_, index) => bossVictory('b', index, (index + 1) * 300_000)),
      bossVictory('c', 0, 360_000),
    ];

    const summary = summarizeTelemetry(events);
    expect(summary.campaignWorlds).toHaveLength(6);

    expect(summary.campaignWorlds[0]).toMatchObject({
      world: 1,
      bossEncounterId: 'w1-tv-tyrant',
      sessionsCleared: 3,
      sessionClearRate: 0.75,
      previousWorldContinuationRate: null,
      medianTimeFromRunStartMs: 300_000,
    });
    expect(summary.campaignWorlds[1]?.sessionsCleared).toBe(2);
    expect(summary.campaignWorlds[1]?.previousWorldContinuationRate).toBeCloseTo(2 / 3);
    expect(summary.campaignWorlds[2]?.previousWorldContinuationRate).toBe(1);
    expect(summary.campaignWorlds[3]?.previousWorldContinuationRate).toBe(1);
    expect(summary.campaignWorlds[4]?.sessionsCleared).toBe(1);
    expect(summary.campaignWorlds[4]?.previousWorldContinuationRate).toBe(0.5);
    expect(summary.campaignWorlds[5]).toMatchObject({
      world: 6,
      bossEncounterId: 'w6-border-shark',
      sessionsCleared: 1,
      sessionClearRate: 0.25,
      previousWorldContinuationRate: 1,
      p90TimeFromRunStartMs: 1_440_000,
    });
  });
});
