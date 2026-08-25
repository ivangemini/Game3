import type { ItemDefinition } from '../domain/types';

export const WAVE4_BASE_ITEMS: readonly ItemDefinition[] = [
  { id: 'fermented-gamepad', name: 'Fermented Gamepad', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['device', 'food', 'chaos'], rarity: 'uncommon', description: 'A controller aged in a drawer until the buttons developed a culture.' },
  { id: 'magnet-croissant', name: 'Magnet Croissant', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['food', 'magnet', 'metal'], rarity: 'uncommon', description: 'Flaky, buttery and capable of stealing cutlery from three tables away.' },
  { id: 'slime-pager', name: 'Slime Pager', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }], tags: ['device', 'slime', 'antenna'], rarity: 'common', description: 'Beeps only when the slime has something urgent and sticky to say.' },
  { id: 'battery-pigeon', name: 'Battery Pigeon', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], tags: ['pet', 'battery', 'antenna'], rarity: 'rare', description: 'Returns home reliably as long as home has a charging cable.' },
  { id: 'duck-drill', name: 'Duck Drill', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], tags: ['pet', 'duck', 'weapon', 'metal'], rarity: 'rare', description: 'Quacks once, spins twice, voids every nearby warranty.' },
  { id: 'cat-battery-pack', name: 'Cat Battery Pack', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['pet', 'cat', 'battery', 'device'], rarity: 'rare', description: 'A rechargeable cat-shaped power bank that refuses to charge anything on command.' },
  { id: 'poison-printer', name: 'Poison Printer', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], tags: ['device', 'poison', 'metal'], rarity: 'uncommon', description: 'Prints twelve pages of warnings before printing one page of venom.' },
  { id: 'laser-kettle', name: 'Laser Kettle', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['device', 'laser', 'food', 'metal'], rarity: 'rare', description: 'Boils water by asking the water to stand directly in the beam.' },
  { id: 'chaos-stapler', name: 'Chaos Stapler', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }], tags: ['weapon', 'metal', 'chaos'], rarity: 'uncommon', description: 'Fastens documents, dimensions and occasionally the wrong timeline.' },
  { id: 'antenna-sausage', name: 'Antenna Sausage', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], tags: ['food', 'antenna', 'chaos'], rarity: 'uncommon', description: 'Receives breakfast television without owning a television.' },
  { id: 'slime-magnet', name: 'Slime Magnet', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['slime', 'magnet', 'metal', 'poison'], rarity: 'rare', description: 'Attracts screws, coins and every toxic puddle you meant to avoid.' },
  { id: 'feral-roomba', name: 'Feral Roomba', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['pet', 'device', 'metal', 'chaos'], rarity: 'rare', description: 'No longer cleans rooms. It clears territory.' },
];

export const WAVE4_SECOND_STAGE_ITEMS: readonly ItemDefinition[] = [
  { id: 'cataclysm-satellite', name: 'Cataclysm Satellite', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }], tags: ['pet', 'cat', 'antenna', 'device', 'laser', 'battery', 'metal', 'chaos'], rarity: 'epic', description: 'A second-stage cat communications platform with enough bandwidth to menace astronomy.' },
  { id: 'plague-picnic', name: 'Plague Picnic', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }], tags: ['food', 'slime', 'poison', 'device', 'metal', 'chaos'], rarity: 'epic', description: 'A complete outdoor meal for everyone except the local ecosystem.' },
  { id: 'thunder-rail-mop', name: 'Thunder Rail Mop', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }], tags: ['weapon', 'laser', 'metal', 'magnet', 'battery', 'chaos', 'device'], rarity: 'epic', description: 'A second-stage cleaning implement that arrives before its own thunder.' },
];
