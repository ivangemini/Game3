import { describe, expect, it } from 'vitest';
import type { TelemetryEnvelope } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function event(
  sessionId: string,
  timestampMs: number,
  name: TelemetryEnvelope['name'],
  payload: TelemetryEnvelope['payload'],
): TelemetryEnvelope {
  return { sessionId, timestampMs, name, payload } as TelemetryEnvelope;
}

describe('R2 telemetry summary', () => {
  it('aggregates mastery level-ups and cosmetic milestones without raw XP telemetry', () => {
    const summary = summarizeTelemetry([
      event('a', 1, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('b', 2, 'session_start', { returning: true, platform: 'local', viewportMode: 'standard-landscape' }),
      event('c', 3, 'session_start', { returning: true, platform: 'local', viewportMode: 'standard-landscape' }),
      event('a', 10, 'hero_mastery_level_up', { heroId: 'engineer', level: 2, rewardCount: 1 }),
      event('a', 20, 'hero_mastery_level_up', { heroId: 'engineer', level: 3, rewardCount: 0 }),
      event('b', 30, 'hero_mastery_level_up', { heroId: 'scavenger', level: 7, rewardCount: 1 }),
    ]);

    expect(summary.heroMastery).toEqual({
      sessionsLevelingUp: 2,
      sessionLevelUpRate: 2 / 3,
      levelUpEvents: 3,
      cosmeticRewardUnlocks: 2,
      maxObservedLevel: 7,
      levelUpsByHero: { engineer: 2, scavenger: 1 },
      maxObservedLevelByHero: { engineer: 3, scavenger: 7 },
    });
  });

  it('keeps grudge start and resolution volumes separate because sessions are ephemeral', () => {
    const summary = summarizeTelemetry([
      event('a', 1, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('b', 2, 'session_start', { returning: true, platform: 'local', viewportMode: 'standard-landscape' }),
      event('c', 3, 'session_start', { returning: true, platform: 'local', viewportMode: 'standard-landscape' }),
      event('a', 10, 'boss_grudge_changed', { bossId: 'tv-tyrant', state: 'started' }),
      event('a', 20, 'boss_grudge_changed', { bossId: 'deadline-snail', state: 'started' }),
      event('b', 30, 'boss_grudge_changed', { bossId: 'tv-tyrant', state: 'resolved' }),
    ]);

    expect(summary.bossGrudges).toEqual({
      sessionsStartingGrudge: 1,
      grudgeStartSessionRate: 1 / 3,
      sessionsResolvingGrudge: 1,
      grudgeResolveSessionRate: 1 / 3,
      grudgeStarts: 2,
      grudgeResolutions: 1,
      aggregateResolveToStartRatio: 0.5,
      startsByBoss: { 'deadline-snail': 1, 'tv-tyrant': 1 },
      resolutionsByBoss: { 'tv-tyrant': 1 },
    });
  });

  it('returns stable empty R2 metrics when an export predates R2', () => {
    const summary = summarizeTelemetry([]);
    expect(summary.heroMastery).toEqual({
      sessionsLevelingUp: 0,
      sessionLevelUpRate: 0,
      levelUpEvents: 0,
      cosmeticRewardUnlocks: 0,
      maxObservedLevel: 0,
      levelUpsByHero: {},
      maxObservedLevelByHero: {},
    });
    expect(summary.bossGrudges).toEqual({
      sessionsStartingGrudge: 0,
      grudgeStartSessionRate: 0,
      sessionsResolvingGrudge: 0,
      grudgeResolveSessionRate: 0,
      grudgeStarts: 0,
      grudgeResolutions: 0,
      aggregateResolveToStartRatio: 0,
      startsByBoss: {},
      resolutionsByBoss: {},
    });
  });
});
