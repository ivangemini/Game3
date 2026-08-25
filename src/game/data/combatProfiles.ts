import type { CombatItemProfile, EnemyCombatDefinition } from '../domain/combat';

export const PROTOTYPE_COMBAT_PROFILES: readonly CombatItemProfile[] = [
  { definitionId: 'laser-cat', triggerIntervalMs: 1800, damage: 4, extraLaserDamage: 4 },
  { definitionId: 'angry-battery', triggerIntervalMs: 3200, damage: 0 },
  { definitionId: 'cursed-toaster', triggerIntervalMs: 2200, damage: 6 },
  { definitionId: 'mutant-duck', triggerIntervalMs: 2100, damage: 4 },
  { definitionId: 'toxic-fan', triggerIntervalMs: 2400, damage: 3, poisonOnHit: 1 },
  { definitionId: 'fish-blaster', triggerIntervalMs: 1600, damage: 8, extraLaserDamage: 4 },
  { definitionId: 'poison-flask', triggerIntervalMs: 3600, damage: 0 },
  { definitionId: 'scrap-magnet', triggerIntervalMs: 2800, damage: 1, shieldOnTrigger: 2 },
  { definitionId: 'tactical-banana', triggerIntervalMs: 2500, damage: 3 },
  { definitionId: 'pocket-radio', triggerIntervalMs: 2600, damage: 3 },
  { definitionId: 'slime-can', triggerIntervalMs: 2600, damage: 2, poisonOnHit: 2 },
  { definitionId: 'wrench-sword', triggerIntervalMs: 1750, damage: 9 },
  { definitionId: 'battery-snail', triggerIntervalMs: 2300, damage: 4 },
  { definitionId: 'disco-orb', triggerIntervalMs: 2100, damage: 6, extraLaserDamage: 4 },
  { definitionId: 'panic-noodles', triggerIntervalMs: 3000, damage: 1, poisonOnHit: 1 },
  { definitionId: 'feral-router', triggerIntervalMs: 2050, damage: 7 },
  { definitionId: 'alarm-hamster', triggerIntervalMs: 2100, damage: 4 },
  { definitionId: 'toxic-umbrella', triggerIntervalMs: 1800, damage: 7, poisonOnHit: 1 },
  { definitionId: 'satellite-fork', triggerIntervalMs: 1700, damage: 8 },
  { definitionId: 'canned-lightning', triggerIntervalMs: 2200, damage: 5, extraLaserDamage: 3 },
  { definitionId: 'slime-donut', triggerIntervalMs: 2700, damage: 2, poisonOnHit: 2 },
  { definitionId: 'catellite-dish', triggerIntervalMs: 2000, damage: 5, extraLaserDamage: 3 },
  { definitionId: 'emergency-microwave', triggerIntervalMs: 2300, damage: 6 },
  { definitionId: 'laser-mop', triggerIntervalMs: 1650, damage: 9, extraLaserDamage: 4 },

  { definitionId: 'shock-toaster', triggerIntervalMs: 1750, damage: 11, extraLaserDamage: 3 },
  { definitionId: 'cyber-cat', triggerIntervalMs: 1450, damage: 6, extraLaserDamage: 7 },
  { definitionId: 'biohazard-turbine', triggerIntervalMs: 1950, damage: 6, poisonOnHit: 4 },
  { definitionId: 'polarity-duck', triggerIntervalMs: 1850, damage: 7, shieldOnTrigger: 3 },
  { definitionId: 'toxic-fish-cannon', triggerIntervalMs: 1500, damage: 10, extraLaserDamage: 3, poisonOnHit: 2 },
  { definitionId: 'gravity-toaster', triggerIntervalMs: 2150, damage: 7, shieldOnTrigger: 5 },
  { definitionId: 'turbo-router', triggerIntervalMs: 1600, damage: 10 },
  { definitionId: 'slime-sword', triggerIntervalMs: 1600, damage: 12, poisonOnHit: 3 },
  { definitionId: 'laser-banana', triggerIntervalMs: 1550, damage: 9, extraLaserDamage: 5 },
  { definitionId: 'radio-duck', triggerIntervalMs: 1700, damage: 9 },
  { definitionId: 'noodle-fan', triggerIntervalMs: 1800, damage: 7, poisonOnHit: 4 },
  { definitionId: 'disco-snail', triggerIntervalMs: 1500, damage: 9, extraLaserDamage: 5 },
  { definitionId: 'reactor-hamster', triggerIntervalMs: 1500, damage: 7, shieldOnTrigger: 2 },
  { definitionId: 'acid-parasol', triggerIntervalMs: 1550, damage: 10, poisonOnHit: 4 },
  { definitionId: 'broadcast-trident', triggerIntervalMs: 1450, damage: 12 },
  { definitionId: 'storm-disco', triggerIntervalMs: 1400, damage: 10, extraLaserDamage: 6 },
  { definitionId: 'bio-snack-pack', triggerIntervalMs: 1900, damage: 6, poisonOnHit: 5 },
  { definitionId: 'orbital-cat', triggerIntervalMs: 1350, damage: 7, extraLaserDamage: 7 },
  { definitionId: 'apocalypse-microwave', triggerIntervalMs: 1650, damage: 10, poisonOnHit: 3 },
  { definitionId: 'rail-mop', triggerIntervalMs: 1400, damage: 13, extraLaserDamage: 4, shieldOnTrigger: 2 },
  { definitionId: 'singularity-toaster', triggerIntervalMs: 1300, damage: 15, extraLaserDamage: 5, shieldOnTrigger: 6 },
];

export const PROTOTYPE_COMBAT_PROFILE_MAP = new Map(
  PROTOTYPE_COMBAT_PROFILES.map((profile) => [profile.definitionId, profile]),
);

export const SCRAP_DUMMY: EnemyCombatDefinition = {
  id: 'scrap-dummy',
  name: 'Possessed Training Bin',
  maxHp: 92,
  attackIntervalMs: 1900,
  attackDamage: 7,
};

export const TV_TYRANT: EnemyCombatDefinition = {
  id: 'tv-tyrant',
  name: 'TV Tyrant',
  maxHp: 145,
  attackIntervalMs: 2200,
  attackDamage: 9,
  interference: { kind: 'channel-jam', intervalMs: 4200, telegraphMs: 800, durationMs: 2300 },
  cellInterference: { kind: 'slime-cell', intervalMs: 5500, telegraphMs: 1000, durationMs: 2600 },
  rowInterference: { kind: 'magnet-row', intervalMs: 6800, telegraphMs: 1200, durationMs: 2400 },
};
