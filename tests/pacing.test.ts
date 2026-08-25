import { describe, expect, it } from 'vitest';
import {
  createPacingReport,
  simulatePacingSession,
} from '../src/game/simulation/pacing';

describe('seeded pacing simulation', () => {
  it('is deterministic and models an 18-fight campaign followed by 12-fight loops', () => {
    const first = simulatePacingSession('pacing-seed-17', 3);
    const second = simulatePacingSession('pacing-seed-17', 3);

    expect(first).toEqual(second);
    expect(first.cycles).toHaveLength(3);
    expect(first.cycles.map((cycle) => cycle.encounterCount)).toEqual([18, 12, 12]);
    expect(first.cycles.map((cycle) => cycle.eventCount)).toEqual([6, 4, 4]);
    expect(first.cycles.map((cycle) => cycle.perkCount)).toEqual([6, 4, 4]);
  });

  it('keeps session checkpoints ordered and makes deeper play materially longer', () => {
    const result = simulatePacingSession('long-session-check', 3);

    expect(result.firstBossSeconds).toBeGreaterThan(0);
    expect(result.campaignCompleteSeconds).toBeGreaterThan(result.firstBossSeconds);
    expect(result.loop2CompleteSeconds).not.toBeNull();
    expect(result.loop3CompleteSeconds).not.toBeNull();
    expect(result.loop2CompleteSeconds!).toBeGreaterThan(result.campaignCompleteSeconds);
    expect(result.loop3CompleteSeconds!).toBeGreaterThan(result.loop2CompleteSeconds!);
  });

  it('holds the extended-session target envelope across a broad deterministic seed sample', () => {
    const report = createPacingReport(512, 'regression-pacing');

    expect(report.firstBoss.p50Minutes).toBeGreaterThanOrEqual(3);
    expect(report.firstBoss.p50Minutes).toBeLessThanOrEqual(5);
    expect(report.campaign.p50Minutes).toBeGreaterThanOrEqual(32);
    expect(report.campaign.p50Minutes).toBeLessThanOrEqual(42);
    expect(report.loop2Complete.p50Minutes).toBeGreaterThanOrEqual(55);
    expect(report.loop2Complete.p50Minutes).toBeLessThanOrEqual(75);
    expect(report.loop3Complete.p50Minutes).toBeGreaterThanOrEqual(80);

    expect(report.targetHitRates.firstBoss3To5Pct).toBeGreaterThanOrEqual(95);
    expect(report.targetHitRates.campaign32To42Pct).toBeGreaterThanOrEqual(90);
    expect(report.targetHitRates.loop2FiftyFiveToSeventyFivePct).toBeGreaterThanOrEqual(90);
    expect(report.targetHitRates.loop3EightyPlusPct).toBeGreaterThanOrEqual(95);
  });
});
