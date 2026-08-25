import type { CombatItemProfile } from '../domain/combat';

export const WAVE4_COMBAT_PROFILES: readonly CombatItemProfile[] = [
  { definitionId: 'fermented-gamepad', triggerIntervalMs: 2250, damage: 5 },
  { definitionId: 'magnet-croissant', triggerIntervalMs: 2700, damage: 2, shieldOnTrigger: 3 },
  { definitionId: 'slime-pager', triggerIntervalMs: 2500, damage: 3 },
  { definitionId: 'battery-pigeon', triggerIntervalMs: 2050, damage: 5 },
  { definitionId: 'duck-drill', triggerIntervalMs: 1650, damage: 9 },
  { definitionId: 'cat-battery-pack', triggerIntervalMs: 2100, damage: 4, shieldOnTrigger: 3 },
  { definitionId: 'poison-printer', triggerIntervalMs: 2300, damage: 4, poisonOnHit: 2 },
  { definitionId: 'laser-kettle', triggerIntervalMs: 1850, damage: 7, extraLaserDamage: 4 },
  { definitionId: 'chaos-stapler', triggerIntervalMs: 1750, damage: 8 },
  { definitionId: 'antenna-sausage', triggerIntervalMs: 2400, damage: 4 },
  { definitionId: 'slime-magnet', triggerIntervalMs: 2250, damage: 3, poisonOnHit: 2, shieldOnTrigger: 3 },
  { definitionId: 'feral-roomba', triggerIntervalMs: 1900, damage: 6, shieldOnTrigger: 2 },
  { definitionId: 'cataclysm-satellite', triggerIntervalMs: 1150, damage: 12, extraLaserDamage: 8, shieldOnTrigger: 3 },
  { definitionId: 'plague-picnic', triggerIntervalMs: 1350, damage: 10, poisonOnHit: 7 },
  { definitionId: 'thunder-rail-mop', triggerIntervalMs: 1100, damage: 17, extraLaserDamage: 6, shieldOnTrigger: 4 },
];
