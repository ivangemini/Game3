import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { evaluateSynergies } from '../src/game/domain/synergies';
import type { PlacedItem } from '../src/game/domain/types';

const prototypeLayout: readonly PlacedItem[] = [
  { instanceId: 'battery-1', definitionId: 'angry-battery', origin: { x: 3, y: 0 }, rotation: 0 },
  { instanceId: 'toaster-1', definitionId: 'cursed-toaster', origin: { x: 2, y: 0 }, rotation: 0 },
  { instanceId: 'cat-1', definitionId: 'laser-cat', origin: { x: 4, y: 0 }, rotation: 0 },
  { instanceId: 'duck-1', definitionId: 'mutant-duck', origin: { x: 0, y: 1 }, rotation: 0 },
  { instanceId: 'poison-1', definitionId: 'poison-flask', origin: { x: 4, y: 2 }, rotation: 0 },
  { instanceId: 'fish-1', definitionId: 'fish-blaster', origin: { x: 4, y: 1 }, rotation: 0 },
  { instanceId: 'magnet-1', definitionId: 'scrap-magnet', origin: { x: 2, y: 2 }, rotation: 0 },
  { instanceId: 'fan-1', definitionId: 'toxic-fan', origin: { x: 0, y: 4 }, rotation: 0 },
];

const stateFor = (items: readonly PlacedItem[]) => ({
  width: 6,
  height: 5,
  blockedCells: [] as const,
  items,
});

describe('inventory synergies', () => {
  it('creates side-contact links and deterministic derived bonuses', () => {
    const snapshot = evaluateSynergies(stateFor(prototypeLayout), PROTOTYPE_ITEM_MAP);

    expect(snapshot.connections.map((connection) => connection.ruleId)).toEqual([
      'cat-laser',
      'battery-device',
      'poison-weapon',
      'duck-chaos',
      'magnet-metal',
      'magnet-metal',
    ]);
    expect(snapshot.bonusesByInstanceId['cat-1']?.bonusLaserShots).toBe(1);
    expect(snapshot.bonusesByInstanceId['toaster-1']?.triggerSpeedPct).toBe(25);
    expect(snapshot.bonusesByInstanceId['fish-1']?.poisonOnHit).toBe(2);
    expect(snapshot.bonusesByInstanceId['duck-1']?.chaosPower).toBe(1);
    expect(snapshot.bonusesByInstanceId['magnet-1']?.scrapArmor).toBe(2);
  });

  it('does not count diagonal proximity as a synergy', () => {
    const items: readonly PlacedItem[] = [
      { instanceId: 'battery', definitionId: 'angry-battery', origin: { x: 0, y: 0 }, rotation: 0 },
      { instanceId: 'toaster', definitionId: 'cursed-toaster', origin: { x: 1, y: 1 }, rotation: 0 },
    ];

    expect(evaluateSynergies(stateFor(items), PROTOTYPE_ITEM_MAP).connections).toEqual([]);
  });

  it('returns the same connection order when state item order changes', () => {
    const forward = evaluateSynergies(stateFor(prototypeLayout), PROTOTYPE_ITEM_MAP);
    const reversed = evaluateSynergies(stateFor([...prototypeLayout].reverse()), PROTOTYPE_ITEM_MAP);

    expect(reversed.connections).toEqual(forward.connections);
    expect(reversed.bonusesByInstanceId).toEqual(forward.bonusesByInstanceId);
  });
});
