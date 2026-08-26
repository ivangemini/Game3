import { describe, expect, it } from 'vitest';
import { TelemetryClient, type TelemetryEnvelope } from '../src/analytics/Telemetry';
import { summarizeTelemetry } from '../src/analytics/TelemetrySummary';

function event(
  sessionId: string,
  timestampMs: number,
  name: TelemetryEnvelope['name'],
  payload: TelemetryEnvelope['payload'],
): TelemetryEnvelope {
  return { sessionId, timestampMs, name, payload } as TelemetryEnvelope;
}

describe('archive discovery telemetry', () => {
  it('buffers only bounded aggregate clue counts, not recipe/item identities', () => {
    const client = new TelemetryClient({ sessionId: 'archive-session', now: () => 44 });
    client.track('archive_tab_viewed', { tab: 'recipes', tracedRecipes: 5, almostSolvedRecipes: 2 });
    expect(client.getBufferedEvents()).toEqual([{
      name: 'archive_tab_viewed',
      payload: { tab: 'recipes', tracedRecipes: 5, almostSolvedRecipes: 2 },
      sessionId: 'archive-session',
      timestampMs: 44,
    }]);
  });

  it('aggregates archive reach and almost-solved exposure per ephemeral session', () => {
    const summary = summarizeTelemetry([
      event('a', 1, 'session_start', { returning: false, platform: 'local', viewportMode: 'standard-landscape' }),
      event('b', 2, 'session_start', { returning: true, platform: 'local', viewportMode: 'standard-landscape' }),
      event('c', 3, 'session_start', { returning: true, platform: 'local', viewportMode: 'standard-landscape' }),
      event('a', 10, 'archive_tab_viewed', { tab: 'items', tracedRecipes: 2, almostSolvedRecipes: 0 }),
      event('a', 20, 'archive_tab_viewed', { tab: 'recipes', tracedRecipes: 2, almostSolvedRecipes: 0 }),
      event('a', 30, 'archive_tab_viewed', { tab: 'recipes', tracedRecipes: 3, almostSolvedRecipes: 1 }),
      event('b', 40, 'archive_tab_viewed', { tab: 'recipes', tracedRecipes: 7, almostSolvedRecipes: 4 }),
    ]);

    expect(summary.archiveDiscovery).toEqual({
      sessionsViewingArchive: 2,
      archiveViewSessionRate: 2 / 3,
      sessionsViewingRecipes: 2,
      recipeViewSessionRate: 2 / 3,
      recipeTabViews: 3,
      sessionsViewingAlmostSolved: 2,
      almostSolvedExposureRateAmongRecipeViewers: 1,
      maxTracedRecipesObserved: 7,
      maxAlmostSolvedRecipesObserved: 4,
    });
  });

  it('keeps legacy exports stable with an empty archive metric', () => {
    expect(summarizeTelemetry([]).archiveDiscovery).toEqual({
      sessionsViewingArchive: 0,
      archiveViewSessionRate: 0,
      sessionsViewingRecipes: 0,
      recipeViewSessionRate: 0,
      recipeTabViews: 0,
      sessionsViewingAlmostSolved: 0,
      almostSolvedExposureRateAmongRecipeViewers: 0,
      maxTracedRecipesObserved: 0,
      maxAlmostSolvedRecipesObserved: 0,
    });
  });
});
