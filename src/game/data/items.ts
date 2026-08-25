import type { ItemDefinition } from '../domain/types';
import { WAVE4_BASE_ITEMS, WAVE4_SECOND_STAGE_ITEMS } from './items.wave4';

export const PROTOTYPE_BASE_ITEMS: readonly ItemDefinition[] = [
  { id: 'laser-cat', name: 'Laser Cat', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['pet', 'cat', 'laser'], rarity: 'rare', description: 'A cat with deeply irresponsible eye-laser privileges.' },
  { id: 'angry-battery', name: 'Angry Battery', shape: [{ x: 0, y: 0 }], tags: ['battery', 'device'], rarity: 'common', description: 'Powers adjacent devices. Hates being ignored.' },
  { id: 'cursed-toaster', name: 'Cursed Toaster', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }], tags: ['device', 'metal', 'chaos'], rarity: 'uncommon', description: 'Produces toast, sparks and occasional bad decisions.' },
  { id: 'mutant-duck', name: 'Mutant Duck', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['pet', 'duck', 'chaos'], rarity: 'epic', description: 'Every respectable strategy eventually contains a duck.' },
  { id: 'toxic-fan', name: 'Toxic Fan', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], tags: ['device', 'poison', 'metal'], rarity: 'rare', description: 'Pushes questionable air through an entire row.' },
  { id: 'fish-blaster', name: 'Fish Blaster', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], tags: ['weapon', 'laser', 'chaos'], rarity: 'uncommon', description: 'A laser-compatible fish weapon. Nobody remembers who armed it.' },
  { id: 'poison-flask', name: 'Suspicious Flask', shape: [{ x: 0, y: 0 }], tags: ['poison'], rarity: 'common', description: 'Applies poison to a compatible neighboring weapon.' },
  { id: 'scrap-magnet', name: 'Scrap Magnet', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }], tags: ['metal', 'device', 'magnet'], rarity: 'common', description: 'Metal loves it. Inventory planners do not always agree.' },
  { id: 'tactical-banana', name: 'Tactical Banana', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['food', 'chaos'], rarity: 'common', description: 'A regulation-grade banana with absolutely no regulations.' },
  { id: 'pocket-radio', name: 'Pocket Radio', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }], tags: ['device', 'metal', 'antenna'], rarity: 'common', description: 'Receives stations from several realities at once.' },
  { id: 'slime-can', name: 'Slime Can', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['slime', 'poison'], rarity: 'uncommon', description: 'Do not shake. It is already shaking itself.' },
  { id: 'wrench-sword', name: 'Wrench Sword', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], tags: ['weapon', 'metal'], rarity: 'uncommon', description: 'Repairs machinery by threatening it with violence.' },
  { id: 'battery-snail', name: 'Battery Snail', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['pet', 'battery'], rarity: 'rare', description: 'Slow animal. Fast electrical opinions.' },
  { id: 'disco-orb', name: 'Disco Orb', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['device', 'laser', 'chaos'], rarity: 'rare', description: 'Turns every emergency into a poorly supervised dance floor.' },
  { id: 'panic-noodles', name: 'Panic Noodles', shape: [{ x: 0, y: 0 }], tags: ['food', 'poison'], rarity: 'common', description: 'Instant noodles with a very delayed list of side effects.' },
  { id: 'feral-router', name: 'Feral Router', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], tags: ['device', 'metal', 'antenna', 'chaos'], rarity: 'rare', description: 'The Wi-Fi password changes whenever it senses fear.' },
  { id: 'alarm-hamster', name: 'Alarm Hamster', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['pet', 'battery', 'chaos'], rarity: 'uncommon', description: 'Runs on panic, static and several tiny unpaid overtime shifts.' },
  { id: 'toxic-umbrella', name: 'Toxic Umbrella', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['weapon', 'poison', 'metal'], rarity: 'rare', description: 'Keeps acid rain off you by sending the acid somewhere else.' },
  { id: 'satellite-fork', name: 'Satellite Fork', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }], tags: ['weapon', 'metal', 'antenna'], rarity: 'uncommon', description: 'A dinner utensil certified for low-orbit signal acquisition.' },
  { id: 'canned-lightning', name: 'Canned Lightning', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }], tags: ['battery', 'laser', 'chaos'], rarity: 'rare', description: 'Open away from face, pets, appliances and local weather.' },
  { id: 'slime-donut', name: 'Slime Donut', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['food', 'slime', 'poison'], rarity: 'uncommon', description: 'Glazed with something that keeps trying to leave the pastry.' },
  { id: 'catellite-dish', name: 'Catellite Dish', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['pet', 'cat', 'antenna', 'metal'], rarity: 'rare', description: 'Tracks satellites, birds and forbidden red laser dots.' },
  { id: 'emergency-microwave', name: 'Emergency Microwave', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['device', 'food', 'metal'], rarity: 'uncommon', description: 'For emergencies where the emergency is insufficiently heated.' },
  { id: 'laser-mop', name: 'Laser Mop', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], tags: ['weapon', 'laser', 'metal'], rarity: 'rare', description: 'Cleans floors by removing both dirt and most of the floor.' },
  ...WAVE4_BASE_ITEMS,
];

export const PROTOTYPE_FUSION_ITEMS: readonly ItemDefinition[] = [
  { id: 'shock-toaster', name: 'Shock Toaster', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['device', 'metal', 'laser', 'chaos'], rarity: 'epic', description: 'Toast has become a high-voltage combat doctrine.' },
  { id: 'cyber-cat', name: 'Cyber Cat', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['pet', 'cat', 'laser', 'device', 'metal'], rarity: 'epic', description: 'The battery was installed where common sense used to be.' },
  { id: 'biohazard-turbine', name: 'Biohazard Turbine', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], tags: ['device', 'poison', 'metal'], rarity: 'epic', description: 'Industrial ventilation for people who hate breathable air.' },
  { id: 'polarity-duck', name: 'Polarity Duck', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['pet', 'duck', 'chaos', 'magnet', 'metal'], rarity: 'epic', description: 'Quacks north. Bites south. Attracts cutlery.' },
  { id: 'toxic-fish-cannon', name: 'Toxic Fish Cannon', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], tags: ['weapon', 'laser', 'poison', 'chaos'], rarity: 'epic', description: 'A fish weapon that now violates several environmental treaties.' },
  { id: 'gravity-toaster', name: 'Gravity Toaster', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['device', 'metal', 'magnet', 'chaos'], rarity: 'epic', description: 'Breakfast bends nearby metal and occasionally local spacetime.' },
  { id: 'turbo-router', name: 'Turbo Router', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }], tags: ['device', 'metal', 'antenna', 'battery', 'chaos'], rarity: 'epic', description: 'Routes packets, electricity and poor judgement at unsafe speeds.' },
  { id: 'slime-sword', name: 'Slime Sword', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], tags: ['weapon', 'metal', 'slime', 'poison'], rarity: 'epic', description: 'Cuts cleanly. Leaves absolutely nothing clean.' },
  { id: 'laser-banana', name: 'Laser Banana', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }], tags: ['food', 'laser', 'chaos'], rarity: 'epic', description: 'Peel away from face. Also from walls, pets and the moon.' },
  { id: 'radio-duck', name: 'Radio Duck', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['pet', 'duck', 'antenna', 'device', 'chaos'], rarity: 'epic', description: 'Broadcasts quacking on frequencies no regulator acknowledges.' },
  { id: 'noodle-fan', name: 'Noodle Fan', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], tags: ['food', 'poison', 'device', 'metal'], rarity: 'epic', description: 'Distributes hot noodles evenly across the battlefield.' },
  { id: 'disco-snail', name: 'Disco Snail', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['pet', 'battery', 'laser', 'chaos', 'device'], rarity: 'epic', description: 'Still slow. The lasers are not.' },
  { id: 'reactor-hamster', name: 'Reactor Hamster', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], tags: ['pet', 'battery', 'device', 'chaos'], rarity: 'epic', description: 'A tiny renewable-energy disaster with cheeks full of capacitors.' },
  { id: 'acid-parasol', name: 'Acid Parasol', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], tags: ['weapon', 'poison', 'slime', 'metal'], rarity: 'epic', description: 'Elegant weather protection for weather you created yourself.' },
  { id: 'broadcast-trident', name: 'Broadcast Trident', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }], tags: ['weapon', 'metal', 'antenna', 'device'], rarity: 'epic', description: 'Stabs three frequencies at once and receives complaints on all of them.' },
  { id: 'storm-disco', name: 'Storm Disco', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], tags: ['battery', 'laser', 'chaos', 'device'], rarity: 'epic', description: 'A nightclub weather system trapped inside four backpack cells.' },
  { id: 'bio-snack-pack', name: 'Bio Snack Pack', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], tags: ['food', 'slime', 'poison', 'chaos'], rarity: 'epic', description: 'Lunch that legally qualifies as both cuisine and ecosystem.' },
  { id: 'orbital-cat', name: 'Orbital Cat', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }], tags: ['pet', 'cat', 'antenna', 'device', 'laser', 'metal'], rarity: 'epic', description: 'Achieved low orbit entirely to knock one satellite off a shelf.' },
  { id: 'apocalypse-microwave', name: 'Apocalypse Microwave', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], tags: ['device', 'food', 'metal', 'poison'], rarity: 'epic', description: 'The timer says 00:30. Civilization has less.' },
  { id: 'rail-mop', name: 'Rail Mop', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }], tags: ['weapon', 'laser', 'metal', 'magnet'], rarity: 'epic', description: 'Magnetically accelerates cleanliness beyond recommended limits.' },
  { id: 'singularity-toaster', name: 'Singularity Toaster', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], tags: ['device', 'metal', 'magnet', 'laser', 'chaos'], rarity: 'epic', description: 'A second-stage breakfast event from which crumbs cannot escape.' },
  ...WAVE4_SECOND_STAGE_ITEMS,
];

export const PROTOTYPE_ITEMS: readonly ItemDefinition[] = [
  ...PROTOTYPE_BASE_ITEMS,
  ...PROTOTYPE_FUSION_ITEMS,
];

export const PROTOTYPE_SHOP_ITEMS = PROTOTYPE_BASE_ITEMS;

export const PROTOTYPE_ITEM_MAP = new Map(PROTOTYPE_ITEMS.map((item) => [item.id, item]));
