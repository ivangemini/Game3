import type { EnemyCombatDefinition } from '../domain/combat';
import { createSeededRng } from '../domain/rng';
import type { RunProgressState } from '../domain/runProgression';
import {
  CAMPAIGN_WORLDS,
  loopRewardMultiplier,
  slotForCampaignEncounter,
  slotForLoopEncounter,
  worldForCampaignEncounter,
  worldForLoopEncounter,
} from '../domain/runProgression';

export type RunEncounterKind = 'fight' | 'elite' | 'boss';

export interface RunWorldModifier {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enemyHpPct: number;
  readonly enemyDamagePct: number;
  readonly enemyAttackSpeedPct: number;
  readonly rewardPct: number;
}

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
  readonly modifiers: readonly RunWorldModifier[];
  readonly modifier: RunWorldModifier;
}

const channelJam = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'channel-jam' as const, intervalMs, telegraphMs, durationMs,
});
const slimeCell = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'slime-cell' as const, intervalMs, telegraphMs, durationMs,
});
const magnetRow = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'magnet-row' as const, intervalMs, telegraphMs, durationMs,
});

export const WORLD_MODIFIERS: readonly RunWorldModifier[] = [
  { id: 'greedy-signal', name: 'Greedy Signal', description: 'Enemies +20% HP • rewards +30%.', enemyHpPct: 20, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 30 },
  { id: 'glass-reality', name: 'Glass Reality', description: 'Enemies -15% HP, +30% damage • rewards +15%.', enemyHpPct: -15, enemyDamagePct: 30, enemyAttackSpeedPct: 0, rewardPct: 15 },
  { id: 'rage-network', name: 'Rage Network', description: 'Enemies attack 18% faster • rewards +20%.', enemyHpPct: 0, enemyDamagePct: 0, enemyAttackSpeedPct: 18, rewardPct: 20 },
  { id: 'thick-slime', name: 'Thick Slime', description: 'Enemies +30% HP • rewards +18%.', enemyHpPct: 30, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 18 },
  { id: 'bad-reception', name: 'Bad Reception', description: 'Enemies deal +18% damage • rewards +12%.', enemyHpPct: 0, enemyDamagePct: 18, enemyAttackSpeedPct: 0, rewardPct: 12 },
  { id: 'coupon-apocalypse', name: 'Coupon Apocalypse', description: 'Enemies +10% HP • rewards +35%.', enemyHpPct: 10, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 35 },
];

interface BaseEncounterDefinition extends Omit<RunEncounterDefinition, 'modifiers' | 'modifier'> {}

const BASE_CAMPAIGN_ENCOUNTERS: readonly BaseEncounterDefinition[] = [
  { encounterId: 'w1-static-rats', world: 1, slot: 1, kind: 'fight', title: 'Static Rat Swarm', subtitle: 'Warm-up fight • learn what your build actually does.', rewardCoins: 10, scoreValue: 100, enemy: { id: 'static-rats', name: 'Static Rat Swarm', maxHp: 82, attackIntervalMs: 2100, attackDamage: 6 } },
  { encounterId: 'w1-trash-brute', world: 1, slot: 2, kind: 'elite', title: 'Trash Brute', subtitle: 'First build check before the broadcast tower.', rewardCoins: 14, scoreValue: 150, enemy: { id: 'trash-brute', name: 'Trash Brute', maxHp: 112, attackIntervalMs: 1850, attackDamage: 8 } },
  { encounterId: 'w1-tv-tyrant', world: 1, slot: 3, kind: 'boss', title: 'TV Tyrant', subtitle: 'Boss • Channel Jam + Slime Signal.', rewardCoins: 25, scoreValue: 300, enemy: { id: 'tv-tyrant', name: 'TV Tyrant', maxHp: 145, attackIntervalMs: 2200, attackDamage: 9, interference: channelJam(4200, 800, 2300), cellInterference: slimeCell(5500, 1000, 2600) } },
  { encounterId: 'w2-microwave-brute', world: 2, slot: 1, kind: 'fight', title: 'Microwave Brute', subtitle: 'World 2 • sturdier junk, less forgiving hits.', rewardCoins: 14, scoreValue: 180, enemy: { id: 'microwave-brute', name: 'Microwave Brute', maxHp: 148, attackIntervalMs: 1950, attackDamage: 10 } },
  { encounterId: 'w2-scrap-collector', world: 2, slot: 2, kind: 'elite', title: 'Scrap Collector', subtitle: 'Elite • punishes weak damage curves.', rewardCoins: 18, scoreValue: 230, enemy: { id: 'scrap-collector', name: 'Scrap Collector', maxHp: 186, attackIntervalMs: 1750, attackDamage: 11 } },
  { encounterId: 'w2-tv-pirate-signal', world: 2, slot: 3, kind: 'boss', title: 'TV Tyrant: Pirate Signal', subtitle: 'Boss remix • Magnet Scramble now hunts metal-heavy rows.', rewardCoins: 32, scoreValue: 420, enemy: { id: 'tv-tyrant-pirate', name: 'TV Tyrant // Pirate Signal', maxHp: 218, attackIntervalMs: 2050, attackDamage: 12, interference: channelJam(3700, 750, 2500), cellInterference: slimeCell(5000, 900, 2800), rowInterference: magnetRow(7200, 1200, 2300) } },
  { encounterId: 'w3-mutant-conveyor', world: 3, slot: 1, kind: 'fight', title: 'Mutant Conveyor', subtitle: 'World 3 • the backpack should be becoming a real machine now.', rewardCoins: 18, scoreValue: 260, enemy: { id: 'mutant-conveyor', name: 'Mutant Conveyor', maxHp: 214, attackIntervalMs: 1800, attackDamage: 13 } },
  { encounterId: 'w3-signal-golem', world: 3, slot: 2, kind: 'elite', title: 'Signal Golem', subtitle: 'Elite • checks whether the build has a coherent damage engine.', rewardCoins: 24, scoreValue: 340, enemy: { id: 'signal-golem', name: 'Signal Golem', maxHp: 264, attackIntervalMs: 1650, attackDamage: 14 } },
  { encounterId: 'w3-final-broadcast', world: 3, slot: 3, kind: 'boss', title: 'TV Tyrant: Final Broadcast', subtitle: 'Third boss • all three signal attacks are active.', rewardCoins: 42, scoreValue: 650, enemy: { id: 'tv-tyrant-final', name: 'TV Tyrant // Final Broadcast', maxHp: 332, attackIntervalMs: 1900, attackDamage: 16, interference: channelJam(3300, 700, 2700), cellInterference: slimeCell(4400, 850, 3000), rowInterference: magnetRow(6100, 1050, 2700) } },
  { encounterId: 'w4-grinning-fridge', world: 4, slot: 1, kind: 'fight', title: 'Grinning Fridge', subtitle: 'World 4 • full backpack, no excuses.', rewardCoins: 24, scoreValue: 360, enemy: { id: 'grinning-fridge', name: 'Grinning Fridge', maxHp: 310, attackIntervalMs: 1725, attackDamage: 16 } },
  { encounterId: 'w4-duck-cult', world: 4, slot: 2, kind: 'elite', title: 'Rubber Duck Choir', subtitle: 'Elite • a final pressure test before reality breaks.', rewardCoins: 31, scoreValue: 470, enemy: { id: 'rubber-duck-choir', name: 'Rubber Duck Choir', maxHp: 382, attackIntervalMs: 1550, attackDamage: 18 } },
  { encounterId: 'w4-baby-moon', world: 4, slot: 3, kind: 'boss', title: 'Baby Moon', subtitle: 'Final campaign boss • reality is already starting to corrupt.', rewardCoins: 55, scoreValue: 850, enemy: { id: 'baby-moon', name: 'Baby Moon', maxHp: 475, attackIntervalMs: 1825, attackDamage: 20, interference: channelJam(3000, 650, 2900), cellInterference: slimeCell(3900, 800, 3200) } },
];

export function modifierForWorld(runSeed: string | number, world: number): RunWorldModifier {
  const safeWorld = Math.max(1, Math.floor(world));
  const cycle = Math.floor((safeWorld - 1) / WORLD_MODIFIERS.length);
  const index = (safeWorld - 1) % WORLD_MODIFIERS.length;
  const shuffled = createSeededRng(`${runSeed}:campaign-mutations:${cycle}`).shuffle(WORLD_MODIFIERS);
  return shuffled[index] ?? WORLD_MODIFIERS[0]!;
}

export function modifiersForLoopWorld(
  runSeed: string | number,
  loopNumber: number,
  world: number,
): readonly RunWorldModifier[] {
  const count = Math.min(4, Math.max(2, Math.floor(loopNumber)));
  const shuffled = createSeededRng(`${runSeed}:loop:${Math.max(2, Math.floor(loopNumber))}:mutations`)
    .shuffle(WORLD_MODIFIERS);
  const start = ((Math.max(1, Math.floor(world)) - 1) * 2) % shuffled.length;
  const selected: RunWorldModifier[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const modifier = shuffled[(start + offset) % shuffled.length];
    if (modifier && !selected.some((candidate) => candidate.id === modifier.id)) selected.push(modifier);
  }
  return selected;
}

export function getRunEncounter(
  progress: RunProgressState,
  runSeed: string | number = 'prototype-run-001',
): RunEncounterDefinition | null {
  if (progress.mode === 'campaign') {
    const base = BASE_CAMPAIGN_ENCOUNTERS[progress.campaignEncounterIndex];
    return base ? applyModifiers(base, [modifierForWorld(runSeed, base.world)]) : null;
  }
  if (progress.mode === 'loop') {
    return createLoopEncounter(progress.loopNumber, progress.loopEncounterIndex, runSeed);
  }
  return null;
}

export function createLoopEncounter(
  loopNumber: number,
  encounterIndex: number,
  runSeed: string | number = 'prototype-run-001',
): RunEncounterDefinition {
  const safeLoop = Math.max(2, Math.floor(loopNumber));
  const safeIndex = Math.max(0, Math.min(BASE_CAMPAIGN_ENCOUNTERS.length - 1, Math.floor(encounterIndex)));
  const template = BASE_CAMPAIGN_ENCOUNTERS[safeIndex] ?? BASE_CAMPAIGN_ENCOUNTERS[0]!;
  const depth = safeLoop - 1;
  const rewardMultiplier = loopRewardMultiplier(safeLoop);
  const world = worldForLoopEncounter(safeIndex);
  const slot = slotForLoopEncounter(safeIndex);
  const modifiers = modifiersForLoopWorld(runSeed, safeLoop, world);
  const hpScale = 1 + depth * 0.58;
  const damageScale = 1 + depth * 0.27;
  const speedScale = 1 + depth * 0.08;

  const base: BaseEncounterDefinition = {
    ...template,
    encounterId: `loop-${safeLoop}-w${world}-s${slot}-${template.enemy.id}`,
    world,
    slot,
    title: `Corrupted ${template.title}`,
    subtitle: `LOOP ${safeLoop} • ${modifiers.length} simultaneous reality mutations.`,
    rewardCoins: Math.max(1, Math.round(template.rewardCoins * rewardMultiplier)),
    scoreValue: Math.max(1, Math.round(template.scoreValue * rewardMultiplier)),
    enemy: {
      ...template.enemy,
      id: `loop-${safeLoop}-${template.enemy.id}`,
      name: `Corrupted ${template.enemy.name}`,
      maxHp: Math.max(1, Math.round(template.enemy.maxHp * hpScale)),
      attackDamage: Math.max(0, Math.round(template.enemy.attackDamage * damageScale)),
      attackIntervalMs: Math.max(900, Math.round(template.enemy.attackIntervalMs / speedScale)),
      ...(template.enemy.interference ? {
        interference: {
          ...template.enemy.interference,
          intervalMs: Math.max(2300, Math.round(template.enemy.interference.intervalMs / speedScale)),
        },
      } : {}),
      ...(template.enemy.cellInterference ? {
        cellInterference: {
          ...template.enemy.cellInterference,
          intervalMs: Math.max(3200, Math.round(template.enemy.cellInterference.intervalMs / speedScale)),
        },
      } : {}),
      ...(template.enemy.rowInterference ? {
        rowInterference: {
          ...template.enemy.rowInterference,
          intervalMs: Math.max(3900, Math.round(template.enemy.rowInterference.intervalMs / speedScale)),
        },
      } : {}),
    },
  };

  return applyModifiers(base, modifiers);
}

export function campaignLabel(index: number): string {
  return `WORLD ${worldForCampaignEncounter(index)}/${CAMPAIGN_WORLDS} • ${slotForCampaignEncounter(index)}/3`;
}

export function loopLabel(loopNumber: number, index: number): string {
  return `LOOP ${Math.max(2, Math.floor(loopNumber))} • WORLD ${worldForLoopEncounter(index)}/${CAMPAIGN_WORLDS} • ${slotForLoopEncounter(index)}/3`;
}

function applyModifiers(
  base: BaseEncounterDefinition,
  modifiers: readonly RunWorldModifier[],
): RunEncounterDefinition {
  const totalHpPct = modifiers.reduce((sum, modifier) => sum + modifier.enemyHpPct, 0);
  const totalDamagePct = modifiers.reduce((sum, modifier) => sum + modifier.enemyDamagePct, 0);
  const totalAttackSpeedPct = modifiers.reduce((sum, modifier) => sum + modifier.enemyAttackSpeedPct, 0);
  const totalRewardPct = modifiers.reduce((sum, modifier) => sum + modifier.rewardPct, 0);
  const hpScale = Math.max(0.2, 1 + totalHpPct / 100);
  const damageScale = Math.max(0.2, 1 + totalDamagePct / 100);
  const attackSpeedScale = Math.max(0.2, 1 + totalAttackSpeedPct / 100);
  const rewardScale = Math.max(0, 1 + totalRewardPct / 100);
  const normalizedModifiers = modifiers.length > 0 ? [...modifiers] : [WORLD_MODIFIERS[0]!];

  return {
    ...base,
    rewardCoins: Math.max(0, Math.round(base.rewardCoins * rewardScale)),
    scoreValue: Math.max(0, Math.round(base.scoreValue * rewardScale)),
    modifiers: normalizedModifiers,
    modifier: normalizedModifiers[0]!,
    enemy: {
      ...base.enemy,
      maxHp: Math.max(1, Math.round(base.enemy.maxHp * hpScale)),
      attackDamage: Math.max(0, Math.round(base.enemy.attackDamage * damageScale)),
      attackIntervalMs: Math.max(500, Math.round(base.enemy.attackIntervalMs / attackSpeedScale)),
    },
  };
}

export const CAMPAIGN_ENCOUNTERS: readonly RunEncounterDefinition[] = BASE_CAMPAIGN_ENCOUNTERS.map((encounter) =>
  applyModifiers(encounter, [WORLD_MODIFIERS[0]!]),
);
