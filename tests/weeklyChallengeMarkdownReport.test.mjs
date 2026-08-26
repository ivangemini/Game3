import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../scripts/soft-launch-report.mjs';

describe('weekly challenge markdown report', () => {
  it('surfaces the weekly replay funnel and bounded distributions', () => {
    const markdown = renderMarkdown({
      sessions: 4,
      returningRate: 0,
      returnAgeBuckets: {},
      sessionsWithAgeBucket: 0,
      standardRunsStarted: 1,
      dailyRunsStarted: 1,
      weeklyRunsStarted: 2,
      weeklyChallenge: {
        sessionsStartingWeekly: 2,
        weeklyStartSessionRate: 0.5,
        sessionsOpeningBoard: 1,
        boardOpenRateAmongWeeklySessions: 0.5,
        sessionsFinishingAttempt: 2,
        finishSessionRateAmongWeeklySessions: 1,
        attemptStarts: 3,
        attemptFinishes: 2,
        finishToStartVolumeRatio: 2 / 3,
        attemptsBuckets: { '1': 1, '2-3': 2 },
        scoreBuckets: { '5000-7999': 1, '8000-10999': 1 },
        tierDistribution: { silver: 1, gold: 1 },
      },
      combats: [],
      loopEntries: {},
    });

    expect(markdown).toContain('Standard/Daily/Weekly runs started: **1/1/2**');
    expect(markdown).toContain('## Weekly challenge replay');
    expect(markdown).toContain('Weekly start reach: **50.0%** (2/4 sessions)');
    expect(markdown).toContain('Weekly Board reach among Weekly sessions: **50.0%** (1/2)');
    expect(markdown).toContain('Attempt starts/finishes: **3/2**; finish/start volume ratio **66.7%**');
    expect(markdown).toContain('1 **1** · 2-3 **2**');
    expect(markdown).toContain('5000-7999 **1** · 8000-10999 **1**');
    expect(markdown).toContain('gold **1** · silver **1**');
    expect(markdown).toContain('without introducing a backend player identity or global leaderboard');
  });
});
