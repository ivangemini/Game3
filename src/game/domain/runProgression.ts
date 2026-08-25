export type RunMode = 'campaign' | 'deep-choice' | 'loop' | 'complete';

export interface RunProgressState {
  readonly mode: RunMode;
  readonly campaignEncounterIndex: number;
  readonly loopNumber: number;
  readonly loopEncounterIndex: number;
  readonly score: number;
}

export const CAMPAIGN_WORLDS = 6;
export const LOOP_WORLDS = 4;
export const ENCOUNTERS_PER_WORLD = 3;
export const CAMPAIGN_ENCOUNTER_COUNT = CAMPAIGN_WORLDS * ENCOUNTERS_PER_WORLD;
export const LOOP_ENCOUNTER_COUNT = LOOP_WORLDS * ENCOUNTERS_PER_WORLD;
export const MAX_BASE_POCKET_UNLOCKS = 3;

export function createInitialRunProgress(): RunProgressState {
  return {
    mode: 'campaign',
    campaignEncounterIndex: 0,
    loopNumber: 1,
    loopEncounterIndex: 0,
    score: 0,
  };
}

export function worldForCampaignEncounter(index: number): number {
  const safeIndex = clampEncounterIndex(index, CAMPAIGN_ENCOUNTER_COUNT);
  return Math.floor(safeIndex / ENCOUNTERS_PER_WORLD) + 1;
}

export function worldForLoopEncounter(index: number): number {
  const safeIndex = clampEncounterIndex(index, LOOP_ENCOUNTER_COUNT);
  return Math.floor(safeIndex / ENCOUNTERS_PER_WORLD) + 1;
}

export function slotForCampaignEncounter(index: number): number {
  const safeIndex = clampEncounterIndex(index, CAMPAIGN_ENCOUNTER_COUNT);
  return (safeIndex % ENCOUNTERS_PER_WORLD) + 1;
}

export function slotForLoopEncounter(index: number): number {
  const safeIndex = clampEncounterIndex(index, LOOP_ENCOUNTER_COUNT);
  return (safeIndex % ENCOUNTERS_PER_WORLD) + 1;
}

export function registerRunVictory(state: RunProgressState, scoreGain: number): RunProgressState {
  const gain = Math.max(0, Math.floor(scoreGain));

  if (state.mode === 'campaign') {
    const nextIndex = state.campaignEncounterIndex + 1;
    if (nextIndex >= CAMPAIGN_ENCOUNTER_COUNT) {
      return {
        ...state,
        mode: 'deep-choice',
        campaignEncounterIndex: CAMPAIGN_ENCOUNTER_COUNT - 1,
        score: state.score + gain,
      };
    }
    return {
      ...state,
      campaignEncounterIndex: nextIndex,
      score: state.score + gain,
    };
  }

  if (state.mode === 'loop') {
    const nextIndex = state.loopEncounterIndex + 1;
    if (nextIndex >= LOOP_ENCOUNTER_COUNT) {
      return {
        ...state,
        mode: 'deep-choice',
        loopEncounterIndex: LOOP_ENCOUNTER_COUNT - 1,
        score: state.score + gain,
      };
    }
    return {
      ...state,
      loopEncounterIndex: nextIndex,
      score: state.score + gain,
    };
  }

  return state;
}

export function enterCorruptedLoop(state: RunProgressState): RunProgressState {
  if (state.mode !== 'deep-choice') return state;
  return {
    ...state,
    mode: 'loop',
    loopNumber: state.loopNumber + 1,
    loopEncounterIndex: 0,
  };
}

export function cashOutRun(state: RunProgressState): RunProgressState {
  if (state.mode !== 'deep-choice') return state;
  return { ...state, mode: 'complete' };
}

export function loopRewardMultiplier(loopNumber: number): number {
  const safeLoop = Math.max(2, Math.floor(loopNumber));
  return Number(Math.pow(1.55, safeLoop - 1).toFixed(2));
}

export function backpackUnlockedPocketCount(state: RunProgressState): number {
  if (state.mode !== 'campaign') return MAX_BASE_POCKET_UNLOCKS;
  return Math.min(
    MAX_BASE_POCKET_UNLOCKS,
    Math.floor(state.campaignEncounterIndex / ENCOUNTERS_PER_WORLD),
  );
}

export function isRunProgressState(value: unknown): value is RunProgressState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RunProgressState>;
  return (candidate.mode === 'campaign' || candidate.mode === 'deep-choice' || candidate.mode === 'loop' || candidate.mode === 'complete')
    && isIntegerInRange(candidate.campaignEncounterIndex, 0, CAMPAIGN_ENCOUNTER_COUNT - 1)
    && isIntegerInRange(candidate.loopNumber, 1, Number.MAX_SAFE_INTEGER)
    && isIntegerInRange(candidate.loopEncounterIndex, 0, LOOP_ENCOUNTER_COUNT - 1)
    && isIntegerInRange(candidate.score, 0, Number.MAX_SAFE_INTEGER);
}

function clampEncounterIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.floor(index)));
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
