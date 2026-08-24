import type { EnemyCombatDefinition } from '../domain/combat';
import type { RunProgressState } from '../domain/runProgression';
import { endlessRewardMultiplier, slotForCampaignEncounter, worldForCampaignEncounter } from '../domain/runProgression';

export type RunEncounterKind = 'fight' | 'elite' | 'boss';

export interface RunEncounterDefinition {
  readonly encounterId: string;
  readonly world: number;
  readonly slot: number;
  readonly kind: RunEncounterKind;
  readonly title: string;
  readonly subtitle: string;
  readonly rewardCoins: number;
  readonly scoreValue: number;
  readonly enemy: EnemyCombatDefinition;
}

const channelJam = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'channel-jam' as const,
  intervalMs,
  telegraphMs,
  durationMs,
});

const slimeCell = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'slime-cell' as const,
  intervalMs,
  telegraphMs,
  durationMs,
});

export const CAMPAIGN_ENCOUNTERS: readonly RunEncounterDefinition[] = [
  {
    encounterId: 'w1-static-rats', world: 1, slot: 1, kind: 'fight',
    title: 'Static Rat Swarm', subtitle: 'Warm-up fight • learn what your build actually does.',
    rewardCoins: 10, scoreValue: 100,
    enemy: { id: 'static-rats', name: 'Static Rat Swarm', maxHp: 82, attackIntervalMs: 2100, attackDamage: 6 },
  },
  {
    encounterId: 'w1-trash-brute', world: 1, slot: 2, kind: 'elite',
    title: 'Trash Brute', subtitle: 'First build check before the broadcast tower.',
    rewardCoins: 14, scoreValue: 150,
    enemy: { id: 'trash-brute', name: 'Trash Brute', maxHp: 112, attackIntervalMs: 1850, attackDamage: 8 },
  },
  {
    encounterId: 'w1-tv-tyrant', world: 1, slot: 3, kind: 'boss',
    title: 'TV Tyrant', subtitle: 'Boss • Channel Jam + Slime Signal.',
    rewardCoins: 25, scoreValue: 300,
    enemy: {
      id: 'tv-tyrant', name: 'TV Tyrant', maxHp: 145, attackIntervalMs: 2200, attackDamage: 9,
      interference: channelJam(4200, 800, 2300),
      cellInterference: slimeCell(5500, 1000, 2600),
    },
  },
  {
    encounterId: 'w2-microwave-brute', world: 2, slot: 1, kind: 'fight',
    title: 'Microwave Brute', subtitle: 'World 2 • sturdier junk, less forgiving hits.',
    rewardCoins: 14, scoreValue: 180,
    enemy: { id: 'microwave-brute', name: 'Microwave Brute', maxHp: 148, attackIntervalMs: 1950, attackDamage: 10 },
  },
  {
    encounterId: 'w2-scrap-collector', world: 2, slot: 2, kind: 'elite',
    title: 'Scrap Collector', subtitle: 'Elite • punishes weak damage curves.',
    rewardCoins: 18, scoreValue: 230,
    enemy: { id: 'scrap-collector', name: 'Scrap Collector', maxHp: 186, attackIntervalMs: 1750, attackDamage: 11 },
  },
  {
    encounterId: 'w2-tv-pirate-signal', world: 2, slot: 3, kind: 'boss',
    title: 'TV Tyrant: Pirate Signal', subtitle: 'Boss remix • faster interference, higher pressure.',
    rewardCoins: 32, scoreValue: 420,
    enemy: {
      id: 'tv-tyrant-pirate', name: 'TV Tyrant // Pirate Signal', maxHp: 218, attackIntervalMs: 2050, attackDamage: 12,
      interference: channelJam(3700, 750, 2500),
      cellInterference: slimeCell(5000, 900, 2800),
    },
  },
  {
    encounterId: 'w3-mutant-conveyor', world: 3, slot: 1, kind: 'fight',
    title: 'Mutant Conveyor', subtitle: 'World 3 • final climb starts here.',
    rewardCoins: 18, scoreValue: 260,
    enemy: { id: 'mutant-conveyor', name: 'Mutant Conveyor', maxHp: 214, attackIntervalMs: 1800, attackDamage: 13 },
  },
  {
    encounterId: 'w3-signal-golem', world: 3, slot: 2, kind: 'elite',
    title: 'Signal Golem', subtitle: 'Elite • last chance to tune the backpack before the finale.',
    rewardCoins: 24, scoreValue: 340,
    enemy: { id: 'signal-golem', name: 'Signal Golem', maxHp: 264, attackIntervalMs: 1650, attackDamage: 14 },
  },
  {
    encounterId: 'w3-final-broadcast', world: 3, slot: 3, kind: 'boss',
    title: 'TV Tyrant: Final Broadcast', subtitle: 'Final campaign boss • strongest signal attacks.',
    rewardCoins: 42, scoreValue: 650,
    enemy: {
      id: 'tv-tyrant-final', name: 'TV Tyrant // Final Broadcast', maxHp: 332, attackIntervalMs: 1900, attackDamage: 16,
      interference: channelJam(3300, 700, 2700),
      cellInterference: slimeCell(4400, 850, 3000),
    },
  },
];

export function getRunEncounter(progress: RunProgressState): RunEncounterDefinition | null {
  if (progress.mode === 'campaign') return CAMPAIGN_ENCOUNTERS[progress.campaignEncounterIndex] ?? null;
  if (progress.mode === 'endless') return createEndlessEncounter(progress.endlessWave);
  return null;
}

export function createEndlessEncounter(wave: number): RunEncounterDefinition {
  const safeWave = Math.max(1, Math.floor(wave));
  const boss = safeWave % 5 === 0;
  const hpScale = 1 + (safeWave - 1) * 0.16;
  const damageScale = 1 + (safeWave - 1) * 0.075;
  const multiplier = endlessRewardMultiplier(safeWave);
  const baseHp = boss ? 235 : 155;
  const baseDamage = boss ? 12 : 9;

  return {
    encounterId: `endless-wave-${safeWave}`,
    world: 4,
    slot: safeWave,
    kind: boss ? 'boss' : safeWave % 3 === 0 ? 'elite' : 'fight',
    title: boss ? `Corrupted Broadcast ${safeWave}` : `Endless Junk Wave ${safeWave}`,
    subtitle: boss ? `Endless boss • reward multiplier ×${multiplier}.` : `Endless • reward multiplier ×${multiplier}.`,
    rewardCoins: Math.max(8, Math.round((boss ? 24 : 10) * multiplier)),
    scoreValue: Math.round((boss ? 500 : 180) * multiplier),
    enemy: {
      id: boss ? `endless-broadcast-${safeWave}` : `endless-junk-${safeWave}`,
      name: boss ? `Corrupted Broadcast ${safeWave}` : `Endless Junk ${safeWave}`,
      maxHp: Math.round(baseHp * hpScale),
      attackIntervalMs: Math.max(1100, Math.round((boss ? 1950 : 1850) - safeWave * 16)),
      attackDamage: Math.round(baseDamage * damageScale),
      ...(boss ? {
        interference: channelJam(Math.max(2700, 3900 - safeWave * 25), 700, 2600),
        cellInterference: slimeCell(Math.max(3600, 5000 - safeWave * 30), 850, 2900),
      } : {}),
    },
  };
}

export function campaignLabel(index: number): string {
  return `WORLD ${worldForCampaignEncounter(index)} • ${slotForCampaignEncounter(index)}/3`;
}
