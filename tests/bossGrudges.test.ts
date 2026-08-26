import { describe, expect, it } from 'vitest';
import {
  BOSS_FAMILY_IDS,
  bossFamilyIdForEnemyId,
  bossMasteryTier,
  createBossGrudgeSnapshots,
  recordBossOutcome,
  revengeBossIds,
} from '../src/game/domain/bossGrudges';

describe('boss grudges', () => {
  it('recognizes all campaign and corrupted boss family ids without tracking normal enemies', () => {
    for (const bossId of BOSS_FAMILY_IDS) {
      expect(bossFamilyIdForEnemyId(bossId)).toBe(bossId);
      expect(bossFamilyIdForEnemyId(`loop-7-${bossId}`)).toBe(bossId);
    }
    expect(bossFamilyIdForEnemyId('carbon-copy-clerks')).toBeNull();
  });

  it('starts revenge on defeat and resolves it on the next victory over the same family', () => {
    const defeat = recordBossOutcome([], 'copycat-auditor', 'defeat', 61_000);
    expect(defeat.revengeStarted).toBe(true);
    expect(defeat.history[0]).toMatchObject({ bossId: 'copycat-auditor', losses: 1, wins: 0, revengePending: true });
    expect(revengeBossIds(defeat.history)).toEqual(['copycat-auditor']);

    const victory = recordBossOutcome(defeat.history, 'loop-3-copycat-auditor', 'victory', 47_000);
    expect(victory.revengeResolved).toBe(true);
    expect(victory.firstVictory).toBe(true);
    expect(victory.newFastestVictory).toBe(true);
    expect(victory.history[0]).toMatchObject({ wins: 1, losses: 1, revengePending: false, currentWinStreak: 1, bestWinStreak: 1, fastestVictoryMs: 47_000 });
  });

  it('updates fastest victory only when faster and resets current streak on a loss', () => {
    let history = recordBossOutcome([], 'border-shark', 'victory', 70_000).history;
    history = recordBossOutcome(history, 'border-shark', 'victory', 74_000).history;
    expect(history[0]).toMatchObject({ wins: 2, fastestVictoryMs: 70_000, currentWinStreak: 2, bestWinStreak: 2 });
    history = recordBossOutcome(history, 'border-shark', 'victory', 54_000).history;
    expect(history[0]).toMatchObject({ wins: 3, fastestVictoryMs: 54_000, currentWinStreak: 3, bestWinStreak: 3 });
    history = recordBossOutcome(history, 'border-shark', 'defeat', 80_000).history;
    expect(history[0]).toMatchObject({ losses: 1, currentWinStreak: 0, bestWinStreak: 3, revengePending: true });
  });

  it('derives three bounded mastery tiers from real boss history', () => {
    expect(bossMasteryTier({ bossId: 'tv-tyrant', wins: 0, losses: 0, fastestVictoryMs: null, currentWinStreak: 0, bestWinStreak: 0, revengePending: false })).toBe(0);
    expect(bossMasteryTier({ bossId: 'tv-tyrant', wins: 1, losses: 0, fastestVictoryMs: 20_000, currentWinStreak: 1, bestWinStreak: 1, revengePending: false })).toBe(1);
    expect(bossMasteryTier({ bossId: 'tv-tyrant', wins: 3, losses: 0, fastestVictoryMs: 20_000, currentWinStreak: 1, bestWinStreak: 2, revengePending: false })).toBe(2);
    expect(bossMasteryTier({ bossId: 'tv-tyrant', wins: 4, losses: 0, fastestVictoryMs: 20_000, currentWinStreak: 3, bestWinStreak: 3, revengePending: false })).toBe(3);
  });

  it('always exposes six shelf slots and highlights revenge as the next goal', () => {
    const history = recordBossOutcome([], 'deadline-snail', 'defeat', 50_000).history;
    const snapshots = createBossGrudgeSnapshots(history);
    expect(snapshots).toHaveLength(6);
    expect(snapshots.find((boss) => boss.bossId === 'deadline-snail')?.nextGoal).toContain('REVENGE ACTIVE');
    expect(snapshots.find((boss) => boss.bossId === 'tv-tyrant')).toMatchObject({ wins: 0, losses: 0, masteryTier: 0 });
  });

  it('leaves history untouched for non-boss outcomes', () => {
    const existing = recordBossOutcome([], 'tv-tyrant', 'victory', 30_000).history;
    const ignored = recordBossOutcome(existing, 'static-rats', 'victory', 10_000);
    expect(ignored.tracked).toBe(false);
    expect(ignored.history).toBe(existing);
  });
});
