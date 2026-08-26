import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEEKLY_CHALLENGE,
  WEEKLY_HISTORY_LIMIT,
  WEEKLY_LOADOUTS,
  createWeeklyBoardSnapshot,
  isWeeklyChallengeState,
  recordWeeklyAttempt,
  recordWeeklyProgress,
  weeklyChallengeForKey,
  weeklyChallengeIdentity,
  weeklyChallengeIdentityFromKey,
  weeklyKeyFromSeed,
  weeklyLateWorldFocusForConstraint,
  weeklyTierForScore,
} from '../src/game/domain/weeklyChallenge';

describe('weekly challenge', () => {
  it('uses stable ISO UTC week identities across a year boundary', () => {
    expect(weeklyChallengeIdentity(Date.UTC(2026, 0, 1))).toEqual({ key: '2026-W01', seed: 'weekly:2026-W01' });
    expect(weeklyChallengeIdentity(Date.UTC(2026, 11, 31))).toEqual({ key: '2026-W53', seed: 'weekly:2026-W53' });
    expect(weeklyChallengeIdentityFromKey('2027-W01').seed).toBe('weekly:2027-W01');
    expect(weeklyKeyFromSeed('weekly:2027-W01')).toBe('2027-W01');
    expect(weeklyKeyFromSeed('daily:2027-01-04')).toBeNull();
  });

  it('rejects impossible ISO week keys', () => {
    expect(() => weeklyChallengeIdentityFromKey('2025-W53')).toThrow();
    expect(weeklyKeyFromSeed('weekly:2025-W53')).toBeNull();
  });

  it('creates one deterministic curated hero and starting-perk constraint per week', () => {
    const first = weeklyChallengeForKey('2026-W35');
    const second = weeklyChallengeForKey('2026-W35');
    expect(first).toEqual(second);
    expect(first.seed).toBe('weekly:2026-W35');
    expect(first.constraint.heroId).toMatch(/^(scavenger|engineer|alchemist|beastfriend)$/);
    expect(first.constraint.startingPerkId.length).toBeGreaterThan(0);
    expect(['duplicate-district', 'perimeter-district']).toContain(first.constraint.lateWorldFocus);
  });

  it('reuses both late-world counterplay families across the fixed Weekly loadout pool', () => {
    const focuses = WEEKLY_LOADOUTS.map((constraint) => weeklyLateWorldFocusForConstraint(constraint));
    expect(focuses.filter((focus) => focus.world === 5)).toHaveLength(4);
    expect(focuses.filter((focus) => focus.world === 6)).toHaveLength(4);
    expect(new Set(focuses.map((focus) => focus.id))).toEqual(new Set(['duplicate-district', 'perimeter-district']));
  });

  it('maps scores into monotonic Bronze/Silver/Gold/Reality-Broken tiers', () => {
    expect(weeklyTierForScore(2499)).toBe('none');
    expect(weeklyTierForScore(2500)).toBe('bronze');
    expect(weeklyTierForScore(5000)).toBe('silver');
    expect(weeklyTierForScore(8000)).toBe('gold');
    expect(weeklyTierForScore(11000)).toBe('reality-broken');
  });

  it('tracks attempts separately from best progress and never downgrades tier or score', () => {
    let state = recordWeeklyAttempt(DEFAULT_WEEKLY_CHALLENGE, '2026-W35');
    state = recordWeeklyAttempt(state, '2026-W35');
    const gold = recordWeeklyProgress(state, '2026-W35', 8200, 1);
    expect(gold.entry).toMatchObject({ attempts: 2, bestScore: 8200, bestTier: 'gold', deepestLoop: 1 });
    expect(gold.tierImproved).toBe(true);
    expect(gold.entry.earnedRewardIds).toHaveLength(3);

    const lower = recordWeeklyProgress(gold.state, '2026-W35', 3000, 0);
    expect(lower.entry).toMatchObject({ attempts: 2, bestScore: 8200, bestTier: 'gold', deepestLoop: 1 });
    expect(lower.tierImproved).toBe(false);
    expect(lower.scoreImproved).toBe(false);
  });

  it('keeps a bounded recent personal history with the current week surfaced separately', () => {
    let state = DEFAULT_WEEKLY_CHALLENGE;
    const keys = [
      '2026-W23', '2026-W24', '2026-W25', '2026-W26', '2026-W27', '2026-W28', '2026-W29',
      '2026-W30', '2026-W31', '2026-W32', '2026-W33', '2026-W34', '2026-W35',
    ];
    for (const key of keys) state = recordWeeklyProgress(recordWeeklyAttempt(state, key), key, 5000, 1).state;
    expect(state.history).toHaveLength(WEEKLY_HISTORY_LIMIT);
    expect(state.history.some((entry) => entry.key === '2026-W23')).toBe(false);

    const board = createWeeklyBoardSnapshot(state, '2026-W35');
    expect(board.bestTier).toBe('silver');
    expect(board.recentHistory).toHaveLength(5);
    expect(board.recentHistory[0]?.key).toBe('2026-W34');
  });

  it('validates deterministic history shape and rejects forged loadout/reward state', () => {
    const valid = recordWeeklyProgress(recordWeeklyAttempt(DEFAULT_WEEKLY_CHALLENGE, '2026-W35'), '2026-W35', 12000, 2).state;
    expect(isWeeklyChallengeState(valid)).toBe(true);
    expect(isWeeklyChallengeState({
      history: valid.history.map((entry) => ({ ...entry, startingPerkId: 'forged-perk' })),
    })).toBe(false);
  });
});
