import { describe, expect, it } from 'vitest';
import { PROTOTYPE_RUN_EVENTS } from '../src/game/data/runEvents';
import { resolveRunEventChoice, selectRunEvent } from '../src/game/domain/runEvents';

describe('run events', () => {
  it('selects the same event for the same run seed and event index', () => {
    const first = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'event-seed', 3);
    const second = selectRunEvent([...PROTOTYPE_RUN_EVENTS].reverse(), 'event-seed', 3);
    expect(second.id).toBe(first.id);
  });

  it('avoids immediately repeating the previous event when alternatives exist', () => {
    const previous = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'repeat-seed', 0);
    const next = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'repeat-seed', 1, previous.id);
    expect(next.id).not.toBe(previous.id);
  });

  it('resolves item rewards deterministically without depending on UI state', () => {
    const event = PROTOTYPE_RUN_EVENTS.find((candidate) => candidate.id === 'cursed-vending-machine');
    if (!event) throw new Error('Missing vending event');
    const first = resolveRunEventChoice(event, 'buy-mystery-junk', 'item-seed', 2);
    const second = resolveRunEventChoice(event, 'buy-mystery-junk', 'item-seed', 2);
    expect(second).toEqual(first);
    expect(first.costCoins).toBe(12);
    expect(first.rewardDefinitionId).toBeTruthy();
  });

  it('resolves gambles deterministically and never produces a negative payout', () => {
    const event = PROTOTYPE_RUN_EVENTS.find((candidate) => candidate.id === 'cursed-vending-machine');
    if (!event) throw new Error('Missing vending event');
    const result = resolveRunEventChoice(event, 'kick-machine', 'gamble-seed', 5);
    expect(result.costCoins).toBe(4);
    expect(result.rewardCoins).toBeGreaterThanOrEqual(0);
    expect(resolveRunEventChoice(event, 'kick-machine', 'gamble-seed', 5)).toEqual(result);
  });
});
