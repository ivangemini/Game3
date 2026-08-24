import type { ItemDefinition } from '../domain/types';

export const PROTOTYPE_ITEMS: readonly ItemDefinition[] = [
  {
    id: 'laser-cat',
    name: 'Laser Cat',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    tags: ['pet', 'laser'],
    rarity: 'rare',
    description: 'A cat with deeply irresponsible eye-laser privileges.',
  },
  {
    id: 'angry-battery',
    name: 'Angry Battery',
    shape: [{ x: 0, y: 0 }],
    tags: ['battery', 'device'],
    rarity: 'common',
    description: 'Powers adjacent devices. Hates being ignored.',
  },
  {
    id: 'cursed-toaster',
    name: 'Cursed Toaster',
    shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    tags: ['device', 'metal', 'chaos'],
    rarity: 'uncommon',
    description: 'Produces toast, sparks and occasional bad decisions.',
  },
  {
    id: 'mutant-duck',
    name: 'Mutant Duck',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    tags: ['pet', 'chaos'],
    rarity: 'epic',
    description: 'Every respectable strategy eventually contains a duck.',
  },
  {
    id: 'toxic-fan',
    name: 'Toxic Fan',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    tags: ['device', 'poison', 'metal'],
    rarity: 'rare',
    description: 'Pushes questionable air through an entire row.',
  },
  {
    id: 'fish-blaster',
    name: 'Fish Blaster',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    tags: ['weapon', 'chaos'],
    rarity: 'uncommon',
    description: 'Nobody remembers who armed the fish.',
  },
  {
    id: 'poison-flask',
    name: 'Suspicious Flask',
    shape: [{ x: 0, y: 0 }],
    tags: ['poison'],
    rarity: 'common',
    description: 'Applies poison to a compatible neighboring weapon.',
  },
  {
    id: 'scrap-magnet',
    name: 'Scrap Magnet',
    shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    tags: ['metal', 'device'],
    rarity: 'common',
    description: 'Metal loves it. Inventory planners do not always agree.',
  },
];

export const PROTOTYPE_ITEM_MAP = new Map(PROTOTYPE_ITEMS.map((item) => [item.id, item]));
