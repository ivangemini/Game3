import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ITEM_MAP, PROTOTYPE_SHOP_ITEMS } from '../src/game/data/items';
import { PROTOTYPE_RUN_EVENTS } from '../src/game/data/runEvents';
import { resolveRunEventChoice, selectRunEvent } from '../src/game/domain/runEvents';

describe('run events', () => {
  it('expands to fifteen unique events and keeps every item reward inside known shop content', () => {
    expect(PROTOTYPE_RUN_EVENTS).toHaveLength(15);
    expect(new Set(PROTOTYPE_RUN_EVENTS.map((event) => event.id)).size).toBe(15);
    const shopIds = new Set(PROTOTYPE_SHOP_ITEMS.map((item) => item.id));

    for (const event of PROTOTYPE_RUN_EVENTS) {
      expect(event.choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(event.choices.map((choice) => choice.id)).size).toBe(event.choices.length);
      for (const choice of event.choices) {
        expect(choice.costCoins).toBeGreaterThanOrEqual(0);
        if (choice.reward.kind === 'gamble') {
          expect(choice.reward.winChancePct).toBeGreaterThanOrEqual(0);
          expect(choice.reward.winChancePct).toBeLessThanOrEqual(100);
          expect(choice.reward.winCoins).toBeGreaterThanOrEqual(0);
          expect(choice.reward.loseCoins).toBeGreaterThanOrEqual(0);
        }
        if (choice.reward.kind !== 'item') continue;
        expect(choice.reward.definitionIds.length).toBeGreaterThan(0);
        for (const definitionId of choice.reward.definitionIds) {
          expect(PROTOTYPE_ITEM_MAP.has(definitionId), `unknown event item ${definitionId}`).toBe(true);
          expect(shopIds.has(definitionId), `event leaks fusion-only item ${definitionId}`).toBe(true);
        }
      }
    }
  });

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

  it('resolves new wave-4 item rewards deterministically', () => {
    const event = PROTOTYPE_RUN_EVENTS.find((candidate) => candidate.id === 'illegal-brunch-lab');
    if (!event) throw new Error('Missing brunch event');
    const first = resolveRunEventChoice(event, 'taste-prototype', 'brunch-seed', 8);
    const second = resolveRunEventChoice(event, 'taste-prototype', 'brunch-seed', 8);
    expect(second).toEqual(first);
    expect(first.costCoins).toBe(10);
    expect(['magnet-croissant', 'antenna-sausage', 'fermented-gamepad', 'slime-donut']).toContain(first.rewardDefinitionId);
  });

  it('resolves wave-5 themed item pools deterministically', () => {
    const event = PROTOTYPE_RUN_EVENTS.find((candidate) => candidate.id === 'hamster-power-exchange');
    if (!event) throw new Error('Missing hamster exchange event');
    const first = resolveRunEventChoice(event, 'buy-energy-asset', 'power-seed', 11);
    const second = resolveRunEventChoice(event, 'buy-energy-asset', 'power-seed', 11);
    expect(second).toEqual(first);
    expect(first.costCoins).toBe(14);
    expect(['alarm-hamster', 'angry-battery', 'battery-pigeon', 'cat-battery-pack']).toContain(first.rewardDefinitionId);
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
