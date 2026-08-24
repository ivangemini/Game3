import type { CombatItemProfile, EnemyCombatDefinition } from '../domain/combat';

export const PROTOTYPE_COMBAT_PROFILES: readonly CombatItemProfile[] = [
  {
    definitionId: 'laser-cat',
    triggerIntervalMs: 1800,
    damage: 4,
    extraLaserDamage: 4,
  },
  {
    definitionId: 'angry-battery',
    triggerIntervalMs: 3200,
    damage: 0,
  },
  {
    definitionId: 'cursed-toaster',
    triggerIntervalMs: 2200,
    damage: 6,
  },
  {
    definitionId: 'mutant-duck',
    triggerIntervalMs: 2100,
    damage: 4,
  },
  {
    definitionId: 'toxic-fan',
    triggerIntervalMs: 2400,
    damage: 3,
    poisonOnHit: 1,
  },
  {
    definitionId: 'fish-blaster',
    triggerIntervalMs: 1600,
    damage: 8,
    extraLaserDamage: 4,
  },
  {
    definitionId: 'poison-flask',
    triggerIntervalMs: 3600,
    damage: 0,
  },
  {
    definitionId: 'scrap-magnet',
    triggerIntervalMs: 2800,
    damage: 1,
    shieldOnTrigger: 2,
  },
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
  interference: {
    kind: 'channel-jam',
    intervalMs: 4200,
    telegraphMs: 800,
    durationMs: 2300,
  },
};
