import { describe, expect, it } from 'vitest';
import { dailyBoardProgressForRun } from '../src/game/domain/dailyRetention';
import { createInitialRunProgress } from '../src/game/domain/runProgression';

describe('Challenges hub Daily progress isolation', () => {
  const progressed = {
    ...createInitialRunProgress(),
    campaignEncounterIndex: 11,
    score: 9_999,
  };

  it('uses the live run progress only for the matching Daily seed', () => {
    expect(dailyBoardProgressForRun('daily:2026-08-26', '2026-08-26', progressed)).toBe(progressed);
  });

  it('does not project Standard or Weekly score/world progress onto Daily contracts', () => {
    for (const seed of ['standard:abc', 'weekly:2026-W35']) {
      const isolated = dailyBoardProgressForRun(seed, '2026-08-26', progressed);
      expect(isolated).not.toBe(progressed);
      expect(isolated.score).toBe(0);
      expect(isolated.campaignEncounterIndex).toBe(0);
      expect(isolated.loopNumber).toBe(1);
    }
  });
});
