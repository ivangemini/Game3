import { describe, expect, it } from 'vitest';
import { validateTelemetryBatch } from '../services/telemetry-receiver.mjs';

function batch(payload) {
  return {
    version: 1,
    events: [{
      name: 'archive_tab_viewed',
      payload,
      sessionId: 'archive-session',
      timestampMs: 1234,
    }],
  };
}

describe('archive discovery telemetry receiver', () => {
  it('accepts bounded tab-level clue counts', () => {
    expect(validateTelemetryBatch(batch({
      tab: 'recipes', tracedRecipes: 7, almostSolvedRecipes: 3,
    })).ok).toBe(true);
    expect(validateTelemetryBatch(batch({
      tab: 'items', tracedRecipes: 0, almostSolvedRecipes: 0,
    })).ok).toBe(true);
  });

  it('rejects unknown tabs, out-of-catalog counts and extra identifying payload', () => {
    expect(validateTelemetryBatch(batch({
      tab: 'bosses', tracedRecipes: 1, almostSolvedRecipes: 0,
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch({
      tab: 'recipes', tracedRecipes: 24, almostSolvedRecipes: 1,
    })).ok).toBe(false);
    expect(validateTelemetryBatch(batch({
      tab: 'recipes', tracedRecipes: 1, almostSolvedRecipes: 1, recipeId: 'cyber-cat',
    })).ok).toBe(false);
  });
});
