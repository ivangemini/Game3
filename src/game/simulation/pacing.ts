import {
  createLoopEncounter,
  getRunEncounter,
  type RunEncounterDefinition,
  type RunEncounterKind,
} from '../data/runEncounters';
import { createSeededRng, type SeededRng } from '../domain/rng';
import {
  CAMPAIGN_ENCOUNTER_COUNT,
  LOOP_ENCOUNTER_COUNT,
  createInitialRunProgress,
} from '../domain/runProgression';

export interface DurationRange {
  readonly minSeconds: number;
  readonly maxSeconds: number;
}

type WorldRanges = readonly DurationRange[];
type WorldChances = readonly number[];

export interface PacingProfile {
  readonly initialSetup: DurationRange;
  readonly campaignArrangeByWorld: WorldRanges;
  readonly loopArrangeByWorld: WorldRanges;
  readonly campaignCombatByKind: Readonly<Record<RunEncounterKind, DurationRange>>;
  readonly loopCombatByKind: Readonly<Record<RunEncounterKind, DurationRange>>;
  readonly eventChoice: DurationRange;
  readonly perkChoice: DurationRange;
  readonly fusionDecision: DurationRange;
  readonly deepChoice: DurationRange;
  readonly campaignFusionChanceByWorld: WorldChances;
  readonly loopFusionChanceBase: number;
  readonly loopFusionChanceGrowthPerDepth: number;
  readonly loopFusionChanceCap: number;
  readonly loopCombatGrowthPctPerDepth: number;
}

export interface PacingCycleResult {
  readonly cycle: 'campaign' | 'loop';
  readonly loopNumber: number;
  readonly encounterCount: number;
  readonly eventCount: number;
  readonly perkCount: number;
  readonly fusionCount: number;
  readonly setupSeconds: number;
  readonly arrangeSeconds: number;
  readonly combatSeconds: number;
  readonly eventSeconds: number;
  readonly perkSeconds: number;
  readonly fusionSeconds: number;
  readonly durationSeconds: number;
  readonly cumulativeSeconds: number;
}

export interface PacingSessionResult {
  readonly seed: string;
  readonly firstBossSeconds: number;
  readonly campaignCompleteSeconds: number;
  readonly loop2CompleteSeconds: number | null;
  readonly loop3CompleteSeconds: number | null;
  readonly deepChoiceSeconds: number;
  readonly cycles: readonly PacingCycleResult[];
}

export interface PacingPercentileBand {
  readonly meanMinutes: number;
  readonly p10Minutes: number;
  readonly p50Minutes: number;
  readonly p90Minutes: number;
}

export interface PacingTargetHitRates {
  readonly firstBoss3To5Pct: number;
  readonly campaign32To42Pct: number;
  readonly loop2FiftyFiveToSeventyFivePct: number;
  readonly loop3EightyPlusPct: number;
}

export interface PacingReport {
  readonly sampleCount: number;
  readonly firstBoss: PacingPercentileBand;
  readonly campaign: PacingPercentileBand;
  readonly loop2Complete: PacingPercentileBand;
  readonly loop3Complete: PacingPercentileBand;
  readonly targetHitRates: PacingTargetHitRates;
}

export const TARGET_PACING_PROFILE: PacingProfile = {
  initialSetup: { minSeconds: 55, maxSeconds: 70 },
  campaignArrangeByWorld: [
    { minSeconds: 22, maxSeconds: 32 },
    { minSeconds: 38, maxSeconds: 52 },
    { minSeconds: 50, maxSeconds: 68 },
    { minSeconds: 58, maxSeconds: 78 },
    { minSeconds: 66, maxSeconds: 90 },
    { minSeconds: 72, maxSeconds: 100 },
  ],
  loopArrangeByWorld: [
    { minSeconds: 40, maxSeconds: 56 },
    { minSeconds: 46, maxSeconds: 62 },
    { minSeconds: 52, maxSeconds: 68 },
    { minSeconds: 56, maxSeconds: 76 },
  ],
  campaignCombatByKind: {
    fight: { minSeconds: 18, maxSeconds: 28 },
    elite: { minSeconds: 22, maxSeconds: 34 },
    boss: { minSeconds: 28, maxSeconds: 42 },
  },
  loopCombatByKind: {
    fight: { minSeconds: 24, maxSeconds: 36 },
    elite: { minSeconds: 30, maxSeconds: 44 },
    boss: { minSeconds: 38, maxSeconds: 55 },
  },
  eventChoice: { minSeconds: 18, maxSeconds: 30 },
  perkChoice: { minSeconds: 18, maxSeconds: 30 },
  fusionDecision: { minSeconds: 22, maxSeconds: 38 },
  deepChoice: { minSeconds: 14, maxSeconds: 24 },
  campaignFusionChanceByWorld: [0.25, 0.35, 0.5, 0.65, 0.72, 0.78],
  loopFusionChanceBase: 0.55,
  loopFusionChanceGrowthPerDepth: 0.08,
  loopFusionChanceCap: 0.8,
  loopCombatGrowthPctPerDepth: 12,
};

interface MutableBreakdown {
  setupSeconds: number;
  arrangeSeconds: number;
  combatSeconds: number;
  eventSeconds: number;
  perkSeconds: number;
  fusionSeconds: number;
  eventCount: number;
  perkCount: number;
  fusionCount: number;
}

interface CycleSimulation {
  readonly durationSeconds: number;
  readonly firstBossOffsetSeconds: number | null;
  readonly breakdown: MutableBreakdown;
}

export function simulatePacingSession(
  runSeed: string | number,
  deepestLoopNumber = 3,
  profile: PacingProfile = TARGET_PACING_PROFILE,
): PacingSessionResult {
  const safeDeepestLoop = Math.max(1, Math.floor(deepestLoopNumber));
  const seed = String(runSeed);
  const rng = createSeededRng(`${seed}:pacing-v1`);
  const cycles: PacingCycleResult[] = [];
  let cumulativeSeconds = 0;
  let deepChoiceSeconds = 0;

  const campaign = simulateCycle('campaign', 1, seed, rng, profile);
  cumulativeSeconds += campaign.durationSeconds;
  const firstBossSeconds = campaign.firstBossOffsetSeconds;
  if (firstBossSeconds === null) throw new Error('Campaign pacing simulation did not reach the first boss');
  cycles.push(toCycleResult('campaign', 1, campaign, cumulativeSeconds));
  const campaignCompleteSeconds = cumulativeSeconds;

  let loop2CompleteSeconds: number | null = null;
  let loop3CompleteSeconds: number | null = null;

  for (let loopNumber = 2; loopNumber <= safeDeepestLoop; loopNumber += 1) {
    const choiceSeconds = sampleDuration(rng, profile.deepChoice);
    deepChoiceSeconds += choiceSeconds;
    cumulativeSeconds += choiceSeconds;

    const loop = simulateCycle('loop', loopNumber, seed, rng, profile);
    cumulativeSeconds += loop.durationSeconds;
    cycles.push(toCycleResult('loop', loopNumber, loop, cumulativeSeconds));

    if (loopNumber === 2) loop2CompleteSeconds = cumulativeSeconds;
    if (loopNumber === 3) loop3CompleteSeconds = cumulativeSeconds;
  }

  return {
    seed,
    firstBossSeconds,
    campaignCompleteSeconds,
    loop2CompleteSeconds,
    loop3CompleteSeconds,
    deepChoiceSeconds,
    cycles,
  };
}

export function createPacingReport(
  sampleCount = 512,
  seedPrefix = 'qa-pacing',
  profile: PacingProfile = TARGET_PACING_PROFILE,
): PacingReport {
  const safeSampleCount = Math.floor(sampleCount);
  if (safeSampleCount < 1 || safeSampleCount > 10_000) {
    throw new RangeError('Pacing report sample count must be between 1 and 10000');
  }

  const firstBossSeconds: number[] = [];
  const campaignSeconds: number[] = [];
  const loop2Seconds: number[] = [];
  const loop3Seconds: number[] = [];

  for (let index = 0; index < safeSampleCount; index += 1) {
    const result = simulatePacingSession(`${seedPrefix}:${index}`, 3, profile);
    if (result.loop2CompleteSeconds === null || result.loop3CompleteSeconds === null) {
      throw new Error('Pacing report requires Loop 2 and Loop 3 checkpoints');
    }
    firstBossSeconds.push(result.firstBossSeconds);
    campaignSeconds.push(result.campaignCompleteSeconds);
    loop2Seconds.push(result.loop2CompleteSeconds);
    loop3Seconds.push(result.loop3CompleteSeconds);
  }

  return {
    sampleCount: safeSampleCount,
    firstBoss: summarizeMinutes(firstBossSeconds),
    campaign: summarizeMinutes(campaignSeconds),
    loop2Complete: summarizeMinutes(loop2Seconds),
    loop3Complete: summarizeMinutes(loop3Seconds),
    targetHitRates: {
      firstBoss3To5Pct: hitRate(firstBossSeconds, (seconds) => seconds >= 180 && seconds <= 300),
      campaign32To42Pct: hitRate(campaignSeconds, (seconds) => seconds >= 1920 && seconds <= 2520),
      loop2FiftyFiveToSeventyFivePct: hitRate(loop2Seconds, (seconds) => seconds >= 3300 && seconds <= 4500),
      loop3EightyPlusPct: hitRate(loop3Seconds, (seconds) => seconds >= 4800),
    },
  };
}

function simulateCycle(
  cycle: 'campaign' | 'loop',
  loopNumber: number,
  runSeed: string,
  rng: SeededRng,
  profile: PacingProfile,
): CycleSimulation {
  const breakdown: MutableBreakdown = {
    setupSeconds: 0,
    arrangeSeconds: 0,
    combatSeconds: 0,
    eventSeconds: 0,
    perkSeconds: 0,
    fusionSeconds: 0,
    eventCount: 0,
    perkCount: 0,
    fusionCount: 0,
  };
  let elapsedSeconds = 0;
  let firstBossOffsetSeconds: number | null = null;
  const encounterCount = cycle === 'campaign' ? CAMPAIGN_ENCOUNTER_COUNT : LOOP_ENCOUNTER_COUNT;

  for (let index = 0; index < encounterCount; index += 1) {
    const encounter = resolveEncounter(cycle, loopNumber, index, runSeed);

    if (cycle === 'campaign' && index === 0) {
      const seconds = sampleDuration(rng, profile.initialSetup);
      breakdown.setupSeconds += seconds;
      elapsedSeconds += seconds;
    } else {
      const range = cycle === 'campaign'
        ? rangeForWorld(profile.campaignArrangeByWorld, encounter.world)
        : rangeForWorld(profile.loopArrangeByWorld, encounter.world);
      const seconds = sampleDuration(rng, range);
      breakdown.arrangeSeconds += seconds;
      elapsedSeconds += seconds;
    }

    const combatRange = cycle === 'campaign'
      ? profile.campaignCombatByKind[encounter.kind]
      : scaledLoopCombatRange(profile.loopCombatByKind[encounter.kind], loopNumber, profile);
    const combatSeconds = sampleDuration(rng, combatRange);
    breakdown.combatSeconds += combatSeconds;
    elapsedSeconds += combatSeconds;

    if (cycle === 'campaign' && encounter.world === 1 && encounter.slot === 3) {
      firstBossOffsetSeconds = elapsedSeconds;
    }

    if (encounter.slot === 1) {
      const eventSeconds = sampleDuration(rng, profile.eventChoice);
      breakdown.eventCount += 1;
      breakdown.eventSeconds += eventSeconds;
      elapsedSeconds += eventSeconds;
    }

    if (encounter.kind === 'boss') {
      const perkSeconds = sampleDuration(rng, profile.perkChoice);
      breakdown.perkCount += 1;
      breakdown.perkSeconds += perkSeconds;
      elapsedSeconds += perkSeconds;
    }

    if (fusionIsUnlocked(cycle, index)) {
      const fusionChance = fusionChanceForEncounter(cycle, loopNumber, encounter.world, profile);
      if (rng.next() < fusionChance) {
        const fusionSeconds = sampleDuration(rng, profile.fusionDecision);
        breakdown.fusionCount += 1;
        breakdown.fusionSeconds += fusionSeconds;
        elapsedSeconds += fusionSeconds;
      }
    }
  }

  return { durationSeconds: elapsedSeconds, firstBossOffsetSeconds, breakdown };
}

function resolveEncounter(
  cycle: 'campaign' | 'loop',
  loopNumber: number,
  encounterIndex: number,
  runSeed: string,
): RunEncounterDefinition {
  if (cycle === 'loop') return createLoopEncounter(loopNumber, encounterIndex, runSeed);

  const encounter = getRunEncounter(
    { ...createInitialRunProgress(), campaignEncounterIndex: encounterIndex },
    runSeed,
  );
  if (!encounter) throw new Error(`Missing campaign encounter at index ${encounterIndex}`);
  return encounter;
}

function fusionIsUnlocked(cycle: 'campaign' | 'loop', encounterIndex: number): boolean {
  return cycle === 'loop' || encounterIndex >= 2;
}

function fusionChanceForEncounter(
  cycle: 'campaign' | 'loop',
  loopNumber: number,
  world: number,
  profile: PacingProfile,
): number {
  if (cycle === 'campaign') {
    return clampChance(chanceForWorld(profile.campaignFusionChanceByWorld, world));
  }
  const extraDepth = Math.max(0, loopNumber - 2);
  return clampChance(Math.min(
    profile.loopFusionChanceCap,
    profile.loopFusionChanceBase + extraDepth * profile.loopFusionChanceGrowthPerDepth,
  ));
}

function scaledLoopCombatRange(
  range: DurationRange,
  loopNumber: number,
  profile: PacingProfile,
): DurationRange {
  const extraDepth = Math.max(0, loopNumber - 2);
  const scale = 1 + extraDepth * Math.max(0, profile.loopCombatGrowthPctPerDepth) / 100;
  return {
    minSeconds: Math.round(range.minSeconds * scale),
    maxSeconds: Math.round(range.maxSeconds * scale),
  };
}

function toCycleResult(
  cycle: 'campaign' | 'loop',
  loopNumber: number,
  simulation: CycleSimulation,
  cumulativeSeconds: number,
): PacingCycleResult {
  const { breakdown } = simulation;
  return {
    cycle,
    loopNumber,
    encounterCount: cycle === 'campaign' ? CAMPAIGN_ENCOUNTER_COUNT : LOOP_ENCOUNTER_COUNT,
    eventCount: breakdown.eventCount,
    perkCount: breakdown.perkCount,
    fusionCount: breakdown.fusionCount,
    setupSeconds: breakdown.setupSeconds,
    arrangeSeconds: breakdown.arrangeSeconds,
    combatSeconds: breakdown.combatSeconds,
    eventSeconds: breakdown.eventSeconds,
    perkSeconds: breakdown.perkSeconds,
    fusionSeconds: breakdown.fusionSeconds,
    durationSeconds: simulation.durationSeconds,
    cumulativeSeconds,
  };
}

function rangeForWorld(ranges: WorldRanges, world: number): DurationRange {
  const index = Math.max(0, Math.min(ranges.length - 1, Math.floor(world) - 1));
  const range = ranges[index];
  if (!range) throw new Error(`Missing pacing range for world ${world}`);
  return range;
}

function chanceForWorld(chances: WorldChances, world: number): number {
  const index = Math.max(0, Math.min(chances.length - 1, Math.floor(world) - 1));
  return chances[index] ?? 0;
}

function sampleDuration(rng: SeededRng, range: DurationRange): number {
  const min = Math.max(0, Math.floor(range.minSeconds));
  const max = Math.max(0, Math.floor(range.maxSeconds));
  if (max < min) throw new RangeError(`Invalid pacing duration range ${min}..${max}`);
  return rng.int(min, max);
}

function summarizeMinutes(secondsValues: readonly number[]): PacingPercentileBand {
  if (secondsValues.length === 0) throw new RangeError('Cannot summarize an empty pacing sample');
  const sorted = [...secondsValues].sort((a, b) => a - b);
  const meanSeconds = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return {
    meanMinutes: round2(meanSeconds / 60),
    p10Minutes: round2(percentile(sorted, 0.1) / 60),
    p50Minutes: round2(percentile(sorted, 0.5) / 60),
    p90Minutes: round2(percentile(sorted, 0.9) / 60),
  };
}

function percentile(sortedValues: readonly number[], quantile: number): number {
  const index = Math.max(0, Math.min(
    sortedValues.length - 1,
    Math.floor((sortedValues.length - 1) * quantile),
  ));
  const value = sortedValues[index];
  if (value === undefined) throw new Error('Percentile index resolution failed');
  return value;
}

function hitRate(values: readonly number[], predicate: (value: number) => boolean): number {
  const hits = values.reduce((count, value) => count + (predicate(value) ? 1 : 0), 0);
  return round2(hits / values.length * 100);
}

function clampChance(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
