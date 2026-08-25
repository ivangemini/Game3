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

interface LoopAnomalyVariant {
  readonly id: string;
  readonly title: string;
  readonly name: string;
  readonly hpPct: number;
  readonly damagePct: number;
  readonly attackSpeedPct: number;
}

const channelJam = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'channel-jam' as const, intervalMs, telegraphMs, durationMs,
});
const slimeCell = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'slime-cell' as const, intervalMs, telegraphMs, durationMs,
});
const tagEclipse = (intervalMs: number, telegraphMs: number, durationMs: number) => ({
  kind: 'tag-eclipse' as const, intervalMs, telegraphMs, durationMs,
});

export const WORLD_MODIFIERS: readonly RunWorldModifier[] = [
  { id: 'greedy-signal', name: 'Greedy Signal', description: 'Enemies +20% HP • rewards +30%.', enemyHpPct: 20, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 30 },
  { id: 'glass-reality', name: 'Glass Reality', description: 'Enemies -15% HP, +30% damage • rewards +15%.', enemyHpPct: -15, enemyDamagePct: 30, enemyAttackSpeedPct: 0, rewardPct: 15 },
  { id: 'rage-network', name: 'Rage Network', description: 'Enemies attack 18% faster • rewards +20%.', enemyHpPct: 0, enemyDamagePct: 0, enemyAttackSpeedPct: 18, rewardPct: 20 },
  { id: 'thick-slime', name: 'Thick Slime', description: 'Enemies +30% HP • rewards +18%.', enemyHpPct: 30, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 18 },
  { id: 'bad-reception', name: 'Bad Reception', description: 'Enemies deal +18% damage • rewards +12%.', enemyHpPct: 0, enemyDamagePct: 18, enemyAttackSpeedPct: 0, rewardPct: 12 },
  { id: 'coupon-apocalypse', name: 'Coupon Apocalypse', description: 'Enemies +10% HP • rewards +35%.', enemyHpPct: 10, enemyDamagePct: 0, enemyAttackSpeedPct: 0, rewardPct: 35 },
];

export const LOOP_ANOMALY_MODIFIERS: readonly RunWorldModifier[] = [
  { id: 'paperwork-storm', name: 'Paperwork Storm', description: 'Enemies -10% HP, +24% damage • rewards +22%.', enemyHpPct: -10, enemyDamagePct: 24, enemyAttackSpeedPct: 0, rewardPct: 22 },
  { id: 'overtime-dimension', name: 'Overtime Dimension', description: 'Enemies +12% HP, damage and attack speed • rewards +32%.', enemyHpPct: 12, enemyDamagePct: 12, enemyAttackSpeedPct: 12, rewardPct: 32 },
  { id: 'cheap-batteries', name: 'Cheap Batteries', description: 'Enemies +26% HP, -8% damage • rewards +18%.', enemyHpPct: 26, enemyDamagePct: -8, enemyAttackSpeedPct: 0, rewardPct: 18 },
  { id: 'static-rain', name: 'Static Rain', description: 'Enemies +5% HP and attack 22% faster • rewards +22%.', enemyHpPct: 5, enemyDamagePct: 0, enemyAttackSpeedPct: 22, rewardPct: 22 },
  { id: 'unsafe-coupon', name: 'Unsafe Coupon', description: 'Enemies -18% HP, +38% damage • rewards +28%.', enemyHpPct: -18, enemyDamagePct: 38, enemyAttackSpeedPct: 0, rewardPct: 28 },
  { id: 'warranty-void', name: 'Warranty Void', description: 'Enemies +18% HP and +18% damage • rewards +26%.', enemyHpPct: 18, enemyDamagePct: 18, enemyAttackSpeedPct: 0, rewardPct: 26 },
];

export const LOOP_WORLD_MODIFIERS: readonly RunWorldModifier[] = [
  ...WORLD_MODIFIERS,
  ...LOOP_ANOMALY_MODIFIERS,
];

const LOOP_ANOMALY_VARIANTS: Readonly<Record<string, LoopAnomalyVariant>> = {
  'static-rats': { id: 'receipt-wasps', title: 'Receipt Wasps', name: 'Receipt Wasp Swarm', hpPct: -8, damagePct: 10, attackSpeedPct: 20 },
  'trash-brute': { id: 'dumpster-oracle', title: 'Dumpster Oracle', name: 'Dumpster Oracle', hpPct: 12, damagePct: 8, attackSpeedPct: -5 },
  'microwave-brute': { id: 'tax-blender', title: 'Tax Blender', name: 'Tax Blender', hpPct: -5, damagePct: 18, attackSpeedPct: 12 },
  'scrap-collector': { id: 'receipt-mimic', title: 'Receipt Mimic', name: 'Receipt Mimic', hpPct: 15, damagePct: 10, attackSpeedPct: 0 },
  'mutant-conveyor': { id: 'escalator-hydra', title: 'Escalator Hydra', name: 'Escalator Hydra', hpPct: 18, damagePct: 5, attackSpeedPct: -8 },
  'signal-golem': { id: 'wifi-basilisk', title: 'Wi-Fi Basilisk', name: 'Wi-Fi Basilisk', hpPct: 5, damagePct: 8, attackSpeedPct: 18 },
  'grinning-fridge': { id: 'expired-freezer', title: 'Expired Freezer', name: 'Expired Freezer', hpPct: 20, damagePct: 0, attackSpeedPct: -12 },
  'rubber-duck-choir': { id: 'invoice-geese', title: 'Invoice Geese', name: 'Invoice Geese', hpPct: -6, damagePct: 22, attackSpeedPct: 10 },
};

interface BaseEncounterDefinition extends Omit<RunEncounterDefinition, 'modifiers' | 'modifier'> {}

const BASE_CAMPAIGN_ENCOUNTERS: readonly BaseEncounterDefinition[] = [
  { encounterId: 'w1-static-rats', world: 1, slot: 1, kind: 'fight', title: 'Static Rat Swarm', subtitle: 'Warm-up fight • learn what your build actually does.', rewardCoins: 10, scoreValue: 100, enemy: { id: 'static-rats', name: 'Static Rat Swarm', maxHp: 82, attackIntervalMs: 2100, attackDamage: 6 } },
  { encounterId: 'w1-trash-brute', world: 1, slot: 2, kind: 'elite', title: 'Trash Brute', subtitle: 'First build check before the broadcast tower.', rewardCoins: 14, scoreValue: 150, enemy: { id: 'trash-brute', name: 'Trash Brute', maxHp: 112, attackIntervalMs: 1850, attackDamage: 8 } },
  { encounterId: 'w1-tv-tyrant', world: 1, slot: 3, kind: 'boss', title: 'TV Tyrant', subtitle: 'Boss • Channel Jam + Slime Signal.', rewardCoins: 25, scoreValue: 300, enemy: { id: 'tv-tyrant', name: 'TV Tyrant', maxHp: 145, attackIntervalMs: 2200, attackDamage: 9, interference: channelJam(4200, 800, 2300), cellInterference: slimeCell(5500, 1000, 2600) } },
  { encounterId: 'w2-microwave-brute', world: 2, slot: 1, kind: 'fight', title: 'Microwave Brute', subtitle: 'World 2 • sturdier junk, less forgiving hits.', rewardCoins: 14, scoreValue: 180, enemy: { id: 'microwave-brute', name: 'Microwave Brute', maxHp: 148, attackIntervalMs: 1950, attackDamage: 10 } },
  { encounterId: 'w2-scrap-collector', world: 2, slot: 2, kind: 'elite', title: 'Scrap Collector', subtitle: 'Elite • punishes weak damage curves.', rewardCoins: 18, scoreValue: 230, enemy: { id: 'scrap-collector', name: 'Scrap Collector', maxHp: 186, attackIntervalMs: 1750, attackDamage: 11 } },
  { encounterId: 'w2-deadline-snail', world: 2, slot: 3, kind: 'boss', title: 'Deadline Snail', subtitle: 'Boss • Time Tax delays the next trigger of your fastest combat item.', rewardCoins: 32, scoreValue: 420, enemy: { id: 'deadline-snail', name: 'Deadline Snail', maxHp: 218, attackIntervalMs: 2050, attackDamage: 12 } },
  { encounterId: 'w3-mutant-conveyor', world: 3, slot: 1, kind: 'fight', title: 'Mutant Conveyor', subtitle: 'World 3 • the backpack should be becoming a real machine now.', rewardCoins: 18, scoreValue: 260, enemy: { id: 'mutant-conveyor', name: 'Mutant Conveyor', maxHp: 214, attackIntervalMs: 1800, attackDamage: 13 } },
  { encounterId: 'w3-signal-golem', world: 3, slot: 2, kind: 'elite', title: 'Signal Golem', subtitle: 'Elite • checks whether the build has a coherent damage engine.', rewardCoins: 24, scoreValue: 340, enemy: { id: 'signal-golem', name: 'Signal Golem', maxHp: 264, attackIntervalMs: 1650, attackDamage: 14 } },
  { encounterId: 'w3-closet-monster', world: 3, slot: 3, kind: 'boss', title: 'Closet Monster', subtitle: 'Boss • Clutter Crush punishes loose items that touch nothing.', rewardCoins: 42, scoreValue: 650, enemy: { id: 'closet-monster', name: 'Closet Monster', maxHp: 332, attackIntervalMs: 1900, attackDamage: 16 } },
  { encounterId: 'w4-grinning-fridge', world: 4, slot: 1, kind: 'fight', title: 'Grinning Fridge', subtitle: 'World 4 • full backpack, no excuses.', rewardCoins: 24, scoreValue: 360, enemy: { id: 'grinning-fridge', name: 'Grinning Fridge', maxHp: 310, attackIntervalMs: 1725, attackDamage: 16 } },
  { encounterId: 'w4-duck-cult', world: 4, slot: 2, kind: 'elite', title: 'Rubber Duck Choir', subtitle: 'Elite • a final pressure test before reality breaks.', rewardCoins: 31, scoreValue: 470, enemy: { id: 'rubber-duck-choir', name: 'Rubber Duck Choir', maxHp: 382, attackIntervalMs: 1550, attackDamage: 18 } },
  { encounterId: 'w4-baby-moon', world: 4, slot: 3, kind: 'boss', title: 'Baby Moon', subtitle: 'Final campaign boss • Tag Eclipse attacks your most stacked build family.', rewardCoins: 55, scoreValue: 850, enemy: { id: 'baby-moon', name: 'Baby Moon', maxHp: 475, attackIntervalMs: 1825, attackDamage: 20, tagInterference: tagEclipse(5200, 1200, 3000) } },
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
  const safeLoop = Math.max(2, Math.floor(loopNumber));
  const count = Math.min(4, safeLoop);
  const pool = safeLoop >= 3 ? LOOP_WORLD_MODIFIERS : WORLD_MODIFIERS;
  const shuffled = createSeededRng(`${runSeed}:loop:${safeLoop}:mutations`).shuffle(pool);
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
  if (progress.mode === 'loop') return createLoopEncounter(progress.loopNumber, progress.loopEncounterIndex, runSeed);
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
  const variant = loopVariantForTemplate(template, safeLoop);
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
    encounterId: `loop-${safeLoop}-w${world}-s${slot}-${variant.enemy.id}`,
    world,
    slot,
    title: `Corrupted ${variant.title}`,
    subtitle: `LOOP ${safeLoop} • ${modifiers.length} simultaneous reality mutations.`,
    rewardCoins: Math.max(1, Math.round(template.rewardCoins * rewardMultiplier)),
    scoreValue: Math.max(1, Math.round(template.scoreValue * rewardMultiplier)),
    enemy: {
      ...variant.enemy,
      id: `loop-${safeLoop}-${variant.enemy.id}`,
      name: `Corrupted ${variant.enemy.name}`,
      maxHp: Math.max(1, Math.round(variant.enemy.maxHp * hpScale)),
      attackDamage: Math.max(0, Math.round(variant.enemy.attackDamage * damageScale)),
      attackIntervalMs: Math.max(900, Math.round(variant.enemy.attackIntervalMs / speedScale)),
      ...(variant.enemy.interference ? { interference: { ...variant.enemy.interference, intervalMs: Math.max(2300, Math.round(variant.enemy.interference.intervalMs / speedScale)) } } : {}),
      ...(variant.enemy.cellInterference ? { cellInterference: { ...variant.enemy.cellInterference, intervalMs: Math.max(3200, Math.round(variant.enemy.cellInterference.intervalMs / speedScale)) } } : {}),
      ...(variant.enemy.rowInterference ? { rowInterference: { ...variant.enemy.rowInterference, intervalMs: Math.max(3900, Math.round(variant.enemy.rowInterference.intervalMs / speedScale)) } } : {}),
      ...(variant.enemy.tagInterference ? { tagInterference: { ...variant.enemy.tagInterference, intervalMs: Math.max(3400, Math.round(variant.enemy.tagInterference.intervalMs / speedScale)) } } : {}),
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

function loopVariantForTemplate(
  template: BaseEncounterDefinition,
  loopNumber: number,
): { readonly title: string; readonly enemy: EnemyCombatDefinition } {
  if (loopNumber % 2 === 0 && template.enemy.id === 'deadline-snail') {
    return {
      title: 'Copycat Auditor',
      enemy: basicBossVariant(template.enemy, 'copycat-auditor', 'Copycat Auditor'),
    };
  }
  if (loopNumber % 2 === 0 && template.enemy.id === 'closet-monster') {
    return {
      title: 'Border Shark',
      enemy: basicBossVariant(template.enemy, 'border-shark', 'Border Shark'),
    };
  }
  if (loopNumber >= 3 && template.kind !== 'boss') {
    const anomaly = LOOP_ANOMALY_VARIANTS[template.enemy.id];
    if (anomaly) return { title: anomaly.title, enemy: anomalyEnemyVariant(template.enemy, anomaly) };
  }
  return { title: template.title, enemy: template.enemy };
}

function basicBossVariant(
  source: EnemyCombatDefinition,
  id: string,
  name: string,
): EnemyCombatDefinition {
  return {
    id,
    name,
    maxHp: source.maxHp,
    attackIntervalMs: source.attackIntervalMs,
    attackDamage: source.attackDamage,
  };
}

function anomalyEnemyVariant(
  source: EnemyCombatDefinition,
  variant: LoopAnomalyVariant,
): EnemyCombatDefinition {
  const hpScale = Math.max(0.2, 1 + variant.hpPct / 100);
  const damageScale = Math.max(0.2, 1 + variant.damagePct / 100);
  const speedScale = Math.max(0.2, 1 + variant.attackSpeedPct / 100);
  return {
    ...source,
    id: variant.id,
    name: variant.name,
    maxHp: Math.max(1, Math.round(source.maxHp * hpScale)),
    attackDamage: Math.max(0, Math.round(source.attackDamage * damageScale)),
    attackIntervalMs: Math.max(700, Math.round(source.attackIntervalMs / speedScale)),
  };
}

function applyModifiers(base: BaseEncounterDefinition, modifiers: readonly RunWorldModifier[]): RunEncounterDefinition {
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
