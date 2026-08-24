export type ItemTag =
  | 'electronic'
  | 'animal'
  | 'toxic'
  | 'food'
  | 'mechanical'
  | 'chaos'
  | 'magnet'
  | 'fire'
  | 'weapon';

export interface SynergyRule {
  id: string;
  name: string;
  requiredTags: ItemTag[];
  description: string;
  powerMultiplier: number;
}

export const SYNERGIES: SynergyRule[] = [
  {
    id: 'laser-cat',
    name: 'Laser Cat',
    requiredTags: ['animal', 'electronic'],
    description: 'Cat fires laser attacks.',
    powerMultiplier: 1.25,
  },
  {
    id: 'shock-device',
    name: 'Shock Device',
    requiredTags: ['mechanical', 'electronic'],
    description: 'Machines gain electric effects.',
    powerMultiplier: 1.2,
  },
  {
    id: 'toxic-chaos',
    name: 'Toxic Chaos',
    requiredTags: ['toxic', 'chaos'],
    description: 'Creates unstable poison effects.',
    powerMultiplier: 1.3,
  },
];

export function getActiveSynergies(tags: ItemTag[]): SynergyRule[] {
  const unique = new Set(tags);
  return SYNERGIES.filter((rule) =>
    rule.requiredTags.every((tag) => unique.has(tag)),
  );
}
