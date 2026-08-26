import { describe, expect, it } from 'vitest';
import { audioCueForCombatEvent } from '../src/game/audio/audioCues';

describe('Tag Eclipse audio cues', () => {
  it('maps Eclipse telegraph, impact and suppressed-item feedback to semantic cues', () => {
    expect(audioCueForCombatEvent({
      kind: 'boss-tag-telegraph',
      atMs: 1000,
      tag: 'device',
      impactAtMs: 2200,
      affectedItemCount: 3,
    })).toMatchObject({ id: 'boss.eclipse.telegraph', priority: 4, group: 'boss', sourceId: 'device' });

    expect(audioCueForCombatEvent({
      kind: 'boss-tag-eclipsed',
      atMs: 2200,
      tag: 'device',
      durationMs: 3000,
      affectedItemCount: 3,
    })).toMatchObject({ id: 'boss.eclipse.impact', priority: 4, group: 'boss', sourceId: 'device' });

    expect(audioCueForCombatEvent({
      kind: 'item-eclipsed',
      atMs: 2500,
      itemInstanceId: 'toaster-1',
      tag: 'device',
    })).toMatchObject({ id: 'item.eclipsed', priority: 2, group: 'status', sourceId: 'toaster-1' });
  });
});
