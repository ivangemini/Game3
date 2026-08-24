export type RunMode = 'campaign' | 'cashout' | 'endless' | 'complete';

export interface RunProgressState {
  readonly mode: RunMode;
  readonly campaignEncounterIndex: number;
  readonly endlessWave: number;
  readonly score: number;
}

export const CAMPAIGN_ENCOUNTER_COUNT = 9;
export const CAMPAIGN_WORLDS = 3;
export const ENCOUNTERS_PER_WORLD = 3;

export function createInitialRunProgress(): RunProgressState {
  return {
    mode: 'campaign',
    campaignEncounterIndex: 0,
    endlessWave: 0,
    score: 0,
  };
}

export function worldForCampaignEncounter(index: number): number {
  const safeIndex = Math.max(0, Math.min(CAMPAIGN_ENCOUNTER_COUNT - 1, Math.floor(index)));
  return Math.floor(safeIndex / ENCOUNTERS_PER_WORLD) + 1;
}

export function slotForCampaignEncounter(index: number): number {
  const safeIndex = Math.max(0, Math.min(CAMPAIGN_ENCOUNTER_COUNT - 1, Math.floor(index)));
  return (safeIndex % ENCOUNTERS_PER_WORLD) + 1;
}

export function registerRunVictory(state: RunProgressState, scoreGain: number): RunProgressState {
  const gain = Math.max(0, Math.floor(scoreGain));
  if (state.mode === 'campaign') {
    const nextIndex = state.campaignEncounterIndex + 1;
    if (nextIndex >= CAMPAIGN_ENCOUNTER_COUNT) {
      return {
        ...state,
        mode: 'cashout',
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

  if (state.mode === 'endless') {
    return {
      ...state,
      endlessWave: state.endlessWave + 1,
      score: state.score + gain,
    };
  }

  return state;
}

export function enterEndless(state: RunProgressState): RunProgressState {
  if (state.mode !== 'cashout') return state;
  return { ...state, mode: 'endless', endlessWave: 1 };
}

export function cashOutRun(state: RunProgressState): RunProgressState {
  if (state.mode !== 'cashout' && state.mode !== 'endless') return state;
  return { ...state, mode: 'complete' };
}

export function endlessRewardMultiplier(wave: number): number {
  const safeWave = Math.max(1, Math.floor(wave));
  return Number((1.5 + (safeWave - 1) * 0.18).toFixed(2));
}

export function isRunProgressState(value: unknown): value is RunProgressState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RunProgressState>;
  return (candidate.mode === 'campaign' || candidate.mode === 'cashout' || candidate.mode === 'endless' || candidate.mode === 'complete')
    && isIntegerInRange(candidate.campaignEncounterIndex, 0, CAMPAIGN_ENCOUNTER_COUNT - 1)
    && isIntegerInRange(candidate.endlessWave, 0, Number.MAX_SAFE_INTEGER)
    && isIntegerInRange(candidate.score, 0, Number.MAX_SAFE_INTEGER);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
