import type { ItemDefinition } from '../domain/types';

export const PROTOTYPE_BASE_ITEMS: readonly ItemDefinition[] = [
  {
    id: 'laser-cat',
    name: 'Laser Cat',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    tags: ['pet', 'cat', 'laser'],
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
    tags: ['pet', 'duck', 'chaos'],
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
    tags: ['weapon', 'laser', 'chaos'],
    rarity: 'uncommon',
    description: 'A laser-compatible fish weapon. Nobody remembers who armed it.',
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
    tags: ['metal', 'device', 'magnet'],
    rarity: 'common',
    description: 'Metal loves it. Inventory planners do not always agree.',
  },
];

export const PROTOTYPE_FUSION_ITEMS: readonly ItemDefinition[] = [
  {
    id: 'shock-toaster',
    name: 'Shock Toaster',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    tags: ['device', 'metal', 'laser', 'chaos'],
    rarity: 'epic',
    description: 'Toast has become a high-voltage combat doctrine.',
  },
  {
    id: 'cyber-cat',
    name: 'Cyber Cat',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    tags: ['pet', 'cat', 'laser', 'device', 'metal'],
    rarity: 'epic',
    description: 'The battery was installed where common sense used to be.',
  },
  {
    id: 'biohazard-turbine',
    name: 'Biohazard Turbine',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    tags: ['device', 'poison', 'metal'],
    rarity: 'epic',
    description: 'Industrial ventilation for people who hate breathable air.',
  },
  {
    id: 'polarity-duck',
    name: 'Polarity Duck',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    tags: ['pet', 'duck', 'chaos', 'magnet', 'metal'],
    rarity: 'epic',
    description: 'Quacks north. Bites south. Attracts cutlery.',
  },
  {
    id: 'toxic-fish-cannon',
    name: 'Toxic Fish Cannon',
    shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }],
    tags: ['weapon', 'laser', 'poison', 'chaos'],
    rarity: 'epic',
    description: 'A fish weapon that now violates several environmental treaties.',
  },
  {
    id: 'gravity-toaster',
    name: 'Gravity Toaster',
    shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    tags: ['device', 'metal', 'magnet', 'chaos'],
    rarity: 'epic',
    description: 'Breakfast bends nearby metal and occasionally local spacetime.',
  },
];

export const PROTOTYPE_ITEMS: readonly ItemDefinition[] = [
  ...PROTOTYPE_BASE_ITEMS,
  ...PROTOTYPE_FUSION_ITEMS,
];

export const PROTOTYPE_SHOP_ITEMS = PROTOTYPE_BASE_ITEMS;

export const PROTOTYPE_ITEM_MAP = new Map(PROTOTYPE_ITEMS.map((item) => [item.id, item]));
