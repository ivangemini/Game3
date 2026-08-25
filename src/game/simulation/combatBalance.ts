import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../data/combatProfiles';
import { PROTOTYPE_BASE_ITEMS, PROTOTYPE_FUSION_ITEMS, PROTOTYPE_ITEM_MAP } from '../data/items';
import { PROTOTYPE_PERKS, PROTOTYPE_PERK_MAP } from '../data/perks';
import { createLoopEncounter, getRunEncounter, type RunEncounterDefinition } from '../data/runEncounters';
import { BACKPACK_HEIGHT, BACKPACK_WIDTH, blockedCellsForPocketUnlockCount } from '../domain/backpackLayout';
import { advanceCombatWithBossRules } from '../domain/bossCombat';
import { createCombatState, type CombatOutcome } from '../domain/combat';
import { createCombatBuild } from '../domain/combatBuild';
import { validatePlacement, type InventoryState } from '../domain/inventory';
import { createSeededRng, type SeededRng } from '../domain/rng';
import { createInitialRunProgress } from '../domain/runProgression';
import type { Cell, PlacedItem } from '../domain/types';

export type BalancePowerBand = 'weak' | 'typical' | 'strong';

export interface BalanceCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly cycle: 'campaign' | 'loop';
  readonly loopNumber: number;
  readonly encounterIndex: number;
  readonly unlockedPocketCount: number;
  readonly typicalItemCount: number;
  readonly typicalPerkCount: number;
  readonly fusionChance: number;
}

export interface GeneratedBalanceBuild {
  readonly inventory: InventoryState;
  readonly selectedPerkIds: readonly string[];
  readonly requestedItemCount: number;
  readonly fusionItemCount: number;
}

export interface BalanceItemStat {
  readonly definitionId: string;
  readonly appearances: number;
  readonly wins: number;
  readonly winRateWhenPresentPct: number;
  readonly winRateDeltaPct: number;
}

export interface BalanceBandReport {
  readonly checkpointId: string;
  readonly checkpointLabel: string;
  readonly encounterId: string;
  readonly enemyHp: number;
  readonly powerBand: BalancePowerBand;
  readonly sampleCount: number;
  readonly winRatePct: number;
  readonly defeatRatePct: number;
  readonly timeoutRatePct: number;
  readonly meanItemCount: number;
  readonly meanFusionItemCount: number;
  readonly meanPerkCount: number;
  readonly medianDurationSeconds: number;
  readonly p90DurationSeconds: number;
  readonly meanRemainingHpOnWin: number;
  readonly itemStats: readonly BalanceItemStat[];
}

export interface CombatBalanceReport {
  readonly sampleCountPerBand: number;
  readonly maxCombatSeconds: number;
  readonly bands: readonly BalanceBandReport[];
}

export const BALANCE_CHECKPOINTS: readonly BalanceCheckpoint[] = [
  {
    id: 'campaign-boss-1', label: 'Campaign Boss 1', cycle: 'campaign', loopNumber: 1,
    encounterIndex: 2, unlockedPocketCount: 0, typicalItemCount: 4, typicalPerkCount: 0, fusionChance: 0,
  },
  {
    id: 'campaign-boss-2', label: 'Campaign Boss 2', cycle: 'campaign', loopNumber: 1,
    encounterIndex: 5, unlockedPocketCount: 1, typicalItemCount: 5, typicalPerkCount: 1, fusionChance: 0.16,
  },
  {
    id: 'campaign-boss-3', label: 'Campaign Boss 3', cycle: 'campaign', loopNumber: 1,
    encounterIndex: 8, unlockedPocketCount: 2, typicalItemCount: 6, typicalPerkCount: 2, fusionChance: 0.26,
  },
  {
    id: 'campaign-boss-4', label: 'Campaign Boss 4', cycle: 'campaign', loopNumber: 1,
    encounterIndex: 11, unlockedPocketCount: 3, typicalItemCount: 7, typicalPerkCount: 3, fusionChance: 0.36,
  },
  {
    id: 'loop-2-boss-2', label: 'Loop 2 Boss 2 / Copycat Auditor', cycle: 'loop', loopNumber: 2,
    encounterIndex: 5, unlockedPocketCount: 3, typicalItemCount: 8, typicalPerkCount: 5, fusionChance: 0.5,
  },
  {
    id: 'loop-2-boss-3', label: 'Loop 2 Boss 3 / Border Shark', cycle: 'loop', loopNumber: 2,
    encounterIndex: 8, unlockedPocketCount: 3, typicalItemCount: 8, typicalPerkCount: 6, fusionChance: 0.54,
  },
  {
    id: 'loop-2-boss-4', label: 'Loop 2 Final Boss', cycle: 'loop', loopNumber: 2,
    encounterIndex: 11, unlockedPocketCount: 3, typicalItemCount: 8, typicalPerkCount: 7, fusionChance: 0.58,
  },
];

const POWER_BANDS: readonly BalancePowerBand[] = ['weak', 'typical', 'strong'];
const POWER_TUNING: Readonly<Record<BalancePowerBand, {
  readonly itemDelta: number;
  readonly perkDelta: number;
  readonly fusionDelta: number;
}>> = {
  weak: { itemDelta: -1, perkDelta: -1, fusionDelta: -0.12 },
  typical: { itemDelta: 0, perkDelta: 0, fusionDelta: 0 },
  strong: { itemDelta: 1, perkDelta: 1, fusionDelta: 0.16 },
};

export function generateBalanceBuild(
  checkpoint: BalanceCheckpoint,
  powerBand: BalancePowerBand,
  seed: string | number,
): GeneratedBalanceBuild {
  const rng = createSeededRng(`${String(seed)}:build`);
  const tuning = POWER_TUNING[powerBand];
  const requestedItemCount = Math.max(2, checkpoint.typicalItemCount + tuning.itemDelta);
  const perkCount = Math.max(0, Math.min(PROTOTYPE_PERKS.length, checkpoint.typicalPerkCount + tuning.perkDelta));
  const fusionChance = clamp01(checkpoint.fusionChance + tuning.fusionDelta);
  let inventory: InventoryState = {
    width: BACKPACK_WIDTH,
    height: BACKPACK_HEIGHT,
    blockedCells: blockedCellsForPocketUnlockCount(checkpoint.unlockedPocketCount),
    items: [],
  };
  let fusionItemCount = 0;
  let sequence = 0;
  let attempts = 0;
  const maxAttempts = requestedItemCount * 14 + 24;

  while (inventory.items.length < requestedItemCount && attempts < maxAttempts) {
    attempts += 1;
    const useFusion = checkpoint.fusionChance > 0 && rng.next() < fusionChance;
    const pool = useFusion ? PROTOTYPE_FUSION_ITEMS : PROTOTYPE_BASE_ITEMS;
    const definition = rng.pick(pool);
    const instanceId = `sim-${sequence}-${definition.id}`;
    sequence += 1;
    const placed = tryPlaceRandomly(inventory, definition.id, instanceId, rng);
    if (!placed) continue;
    inventory = placed;
    if (useFusion) fusionItemCount += 1;
  }

  if (inventory.items.length === 0) {
    throw new Error(`Balance build generator failed for ${checkpoint.id}/${powerBand}`);
  }

  const selectedPerkIds = rng.shuffle(PROTOTYPE_PERKS).slice(0, perkCount).map((perk) => perk.id);
  return { inventory, selectedPerkIds, requestedItemCount, fusionItemCount };
}

export function createCombatBalanceReport(
  sampleCountPerBand = 64,
  seedPrefix = 'qa-combat-balance',
  maxCombatSeconds = 120,
): CombatBalanceReport {
  const sampleCount = Math.floor(sampleCountPerBand);
  const safeMaxSeconds = Math.floor(maxCombatSeconds);
  if (sampleCount < 1 || sampleCount > 512) throw new RangeError('Balance sample count must be between 1 and 512');
  if (safeMaxSeconds < 10 || safeMaxSeconds > 600) throw new RangeError('Max combat duration must be between 10 and 600 seconds');

  const bands: BalanceBandReport[] = [];
  for (const checkpoint of BALANCE_CHECKPOINTS) {
    for (const powerBand of POWER_BANDS) {
      bands.push(simulateBand(checkpoint, powerBand, sampleCount, seedPrefix, safeMaxSeconds));
    }
  }
  return { sampleCountPerBand: sampleCount, maxCombatSeconds: safeMaxSeconds, bands };
}

function simulateBand(
  checkpoint: BalanceCheckpoint,
  powerBand: BalancePowerBand,
  sampleCount: number,
  seedPrefix: string,
  maxCombatSeconds: number,
): BalanceBandReport {
  let wins = 0;
  let defeats = 0;
  let timeouts = 0;
  let totalItems = 0;
  let totalFusionItems = 0;
  let totalPerks = 0;
  let totalWinHp = 0;
  const durations: number[] = [];
  const itemAppearances = new Map<string, number>();
  const itemWins = new Map<string, number>();
  let reportEncounter: RunEncounterDefinition | null = null;

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const sampleSeed = `${seedPrefix}:${checkpoint.id}:${powerBand}:${sampleIndex}`;
    const encounter = resolveCheckpointEncounter(checkpoint, sampleSeed);
    reportEncounter ??= encounter;
    const generated = generateBalanceBuild(checkpoint, powerBand, sampleSeed);
    const combatBuild = createCombatBuild(
      generated.inventory,
      PROTOTYPE_ITEM_MAP,
      PROTOTYPE_COMBAT_PROFILE_MAP,
      PROTOTYPE_PERK_MAP,
      generated.selectedPerkIds,
    );
    const setup = { playerMaxHp: 100, items: combatBuild.items, enemy: encounter.enemy };
    const initial = createCombatState(setup);
    const result = advanceCombatWithBossRules(initial, setup, maxCombatSeconds * 1000);
    const outcome = result.state.outcome;

    if (outcome === 'victory') {
      wins += 1;
      totalWinHp += result.state.playerHp;
    } else if (outcome === 'defeat') {
      defeats += 1;
    } else {
      timeouts += 1;
    }

    durations.push(result.state.timeMs / 1000);
    totalItems += generated.inventory.items.length;
    totalFusionItems += generated.fusionItemCount;
    totalPerks += generated.selectedPerkIds.length;

    const presentDefinitionIds = new Set(generated.inventory.items.map((item) => item.definitionId));
    for (const definitionId of presentDefinitionIds) {
      itemAppearances.set(definitionId, (itemAppearances.get(definitionId) ?? 0) + 1);
      if (outcome === 'victory') itemWins.set(definitionId, (itemWins.get(definitionId) ?? 0) + 1);
    }
  }

  if (!reportEncounter) throw new Error(`No encounter resolved for ${checkpoint.id}`);
  const winRatePct = percent(wins, sampleCount);
  const itemStats = [...itemAppearances.entries()].map(([definitionId, appearances]): BalanceItemStat => {
    const itemWinRate = percent(itemWins.get(definitionId) ?? 0, appearances);
    return {
      definitionId,
      appearances,
      wins: itemWins.get(definitionId) ?? 0,
      winRateWhenPresentPct: itemWinRate,
      winRateDeltaPct: round2(itemWinRate - winRatePct),
    };
  }).sort((a, b) => b.winRateDeltaPct - a.winRateDeltaPct || b.appearances - a.appearances || a.definitionId.localeCompare(b.definitionId));

  const sortedDurations = [...durations].sort((a, b) => a - b);
  return {
    checkpointId: checkpoint.id,
    checkpointLabel: checkpoint.label,
    encounterId: reportEncounter.encounterId,
    enemyHp: reportEncounter.enemy.maxHp,
    powerBand,
    sampleCount,
    winRatePct,
    defeatRatePct: percent(defeats, sampleCount),
    timeoutRatePct: percent(timeouts, sampleCount),
    meanItemCount: round2(totalItems / sampleCount),
    meanFusionItemCount: round2(totalFusionItems / sampleCount),
    meanPerkCount: round2(totalPerks / sampleCount),
    medianDurationSeconds: round2(percentile(sortedDurations, 0.5)),
    p90DurationSeconds: round2(percentile(sortedDurations, 0.9)),
    meanRemainingHpOnWin: wins > 0 ? round2(totalWinHp / wins) : 0,
    itemStats,
  };
}

function resolveCheckpointEncounter(checkpoint: BalanceCheckpoint, runSeed: string): RunEncounterDefinition {
  if (checkpoint.cycle === 'loop') {
    return createLoopEncounter(checkpoint.loopNumber, checkpoint.encounterIndex, runSeed);
  }
  const encounter = getRunEncounter(
    { ...createInitialRunProgress(), campaignEncounterIndex: checkpoint.encounterIndex },
    runSeed,
  );
  if (!encounter) throw new Error(`Missing encounter for checkpoint ${checkpoint.id}`);
  return encounter;
}

function tryPlaceRandomly(
  state: InventoryState,
  definitionId: string,
  instanceId: string,
  rng: SeededRng,
): InventoryState | null {
  const rotations = rng.shuffle([0, 1, 2, 3] as const);
  const origins: Cell[] = [];
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) origins.push({ x, y });
  }

  for (const rotation of rotations) {
    for (const origin of rng.shuffle(origins)) {
      const candidate: PlacedItem = { instanceId, definitionId, origin, rotation };
      if (!validatePlacement(state, PROTOTYPE_ITEM_MAP, candidate).ok) continue;
      return { ...state, items: [...state.items, candidate] };
    }
  }
  return null;
}

function percentile(sortedValues: readonly number[], quantile: number): number {
  const index = Math.max(0, Math.min(sortedValues.length - 1, Math.floor((sortedValues.length - 1) * quantile)));
  return sortedValues[index] ?? 0;
}

function percent(count: number, total: number): number {
  return total > 0 ? round2(count / total * 100) : 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isTerminalBalanceOutcome(outcome: CombatOutcome): boolean {
  return outcome === 'victory' || outcome === 'defeat';
}
