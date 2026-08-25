import { createInitialRunProgress, isRunProgressState, type RunProgressState } from '../game/domain/runProgression';
import type { PlacedItem } from '../game/domain/types';

const SAVE_KEY = 'junkpack.save';

export interface SaveSettings {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly reducedMotion: boolean;
}

export interface SaveV1 {
  readonly version: 1;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly settings: SaveSettings;
}

export interface ActiveRunSaveV2 {
  readonly runSeed: string;
  readonly shopIndex: number;
  readonly coins: number;
  readonly soldOfferIds: readonly string[];
  readonly backpackItems: readonly PlacedItem[];
  readonly nextLootSequence: number;
}

export interface SaveV2 {
  readonly version: 2;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly settings: SaveSettings;
  readonly activeRun: ActiveRunSaveV2 | null;
}

export interface ActiveRunSaveV3 extends ActiveRunSaveV2 {
  readonly claimedEncounterIds: readonly string[];
}

export interface SaveV3 {
  readonly version: 3;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly settings: SaveSettings;
  readonly activeRun: ActiveRunSaveV3 | null;
}

export interface ActiveRunSaveV4 extends ActiveRunSaveV3 {
  readonly selectedPerkIds: readonly string[];
  readonly perkChoiceIndex: number;
  readonly pendingPerkOfferIds: readonly string[];
  readonly offeredPerkEncounterIds: readonly string[];
}

export interface SaveV4 {
  readonly version: 4;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly settings: SaveSettings;
  readonly activeRun: ActiveRunSaveV4 | null;
}

export interface LegacyRunProgressStateV5 {
  readonly mode: 'campaign' | 'cashout' | 'endless' | 'complete';
  readonly campaignEncounterIndex: number;
  readonly endlessWave: number;
  readonly score: number;
}

export interface ActiveRunSaveV5 extends ActiveRunSaveV4 {
  readonly progress: LegacyRunProgressStateV5;
}

export interface SaveV5 {
  readonly version: 5;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly settings: SaveSettings;
  readonly activeRun: ActiveRunSaveV5 | null;
}

export interface ActiveRunSave extends ActiveRunSaveV4 {
  readonly progress: RunProgressState;
}

export interface SaveV6 {
  readonly version: 6;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly bestCorruptedLoop: number;
  readonly settings: SaveSettings;
  readonly activeRun: ActiveRunSave | null;
}

export type GameSave = SaveV6;

export const DEFAULT_SAVE: SaveV6 = {
  version: 6,
  discoveredItemIds: [],
  discoveredRecipeIds: [],
  bestEndlessWave: 0,
  bestCorruptedLoop: 0,
  settings: {
    musicVolume: 0.8,
    sfxVolume: 0.9,
    reducedMotion: false,
  },
  activeRun: null,
};

export function loadSave(storage: Storage = localStorage): SaveV6 {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return DEFAULT_SAVE;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSaveV6(parsed)) return parsed;
    if (isSaveV5(parsed)) return migrateV5ToV6(parsed);
    if (isSaveV4(parsed)) return migrateV5ToV6(migrateV4ToV5(parsed));
    if (isSaveV3(parsed)) return migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(parsed)));
    if (isSaveV2(parsed)) return migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(parsed))));
    if (isSaveV1(parsed)) return migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(parsed)))));
  } catch {
    // Corrupted local data falls back safely; recovery UI can be added later.
  }

  return DEFAULT_SAVE;
}

export function writeSave(save: SaveV6, storage: Storage = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearActiveRun(save: SaveV6): SaveV6 {
  return { ...save, activeRun: null };
}

function migrateV1ToV2(save: SaveV1): SaveV2 {
  return {
    version: 2,
    discoveredItemIds: save.discoveredItemIds,
    discoveredRecipeIds: save.discoveredRecipeIds,
    bestEndlessWave: save.bestEndlessWave,
    settings: save.settings,
    activeRun: null,
  };
}

function migrateV2ToV3(save: SaveV2): SaveV3 {
  return {
    version: 3,
    discoveredItemIds: save.discoveredItemIds,
    discoveredRecipeIds: save.discoveredRecipeIds,
    bestEndlessWave: save.bestEndlessWave,
    settings: save.settings,
    activeRun: save.activeRun ? { ...save.activeRun, claimedEncounterIds: [] } : null,
  };
}

function migrateV3ToV4(save: SaveV3): SaveV4 {
  return {
    version: 4,
    discoveredItemIds: save.discoveredItemIds,
    discoveredRecipeIds: save.discoveredRecipeIds,
    bestEndlessWave: save.bestEndlessWave,
    settings: save.settings,
    activeRun: save.activeRun
      ? {
          ...save.activeRun,
          selectedPerkIds: [],
          perkChoiceIndex: 0,
          pendingPerkOfferIds: [],
          offeredPerkEncounterIds: [],
        }
      : null,
  };
}

function migrateV4ToV5(save: SaveV4): SaveV5 {
  return {
    version: 5,
    discoveredItemIds: save.discoveredItemIds,
    discoveredRecipeIds: save.discoveredRecipeIds,
    bestEndlessWave: save.bestEndlessWave,
    settings: save.settings,
    activeRun: save.activeRun
      ? {
          ...save.activeRun,
          progress: { mode: 'campaign', campaignEncounterIndex: 0, endlessWave: 0, score: 0 },
        }
      : null,
  };
}

function migrateV5ToV6(save: SaveV5): SaveV6 {
  return {
    version: 6,
    discoveredItemIds: save.discoveredItemIds,
    discoveredRecipeIds: save.discoveredRecipeIds,
    bestEndlessWave: save.bestEndlessWave,
    bestCorruptedLoop: save.bestEndlessWave > 0
      ? 2 + Math.floor((Math.max(1, save.bestEndlessWave) - 1) / 12)
      : 0,
    settings: save.settings,
    activeRun: save.activeRun
      ? { ...save.activeRun, progress: migrateLegacyProgress(save.activeRun.progress) }
      : null,
  };
}

function migrateLegacyProgress(progress: LegacyRunProgressStateV5): RunProgressState {
  if (progress.mode === 'campaign') {
    return {
      mode: 'campaign',
      campaignEncounterIndex: Math.max(0, Math.min(8, progress.campaignEncounterIndex)),
      loopNumber: 1,
      loopEncounterIndex: 0,
      score: progress.score,
    };
  }
  if (progress.mode === 'cashout') {
    return {
      mode: 'campaign',
      campaignEncounterIndex: 9,
      loopNumber: 1,
      loopEncounterIndex: 0,
      score: progress.score,
    };
  }
  if (progress.mode === 'endless') {
    const legacyWave = Math.max(1, progress.endlessWave);
    return {
      mode: 'loop',
      campaignEncounterIndex: 11,
      loopNumber: 2 + Math.floor((legacyWave - 1) / 12),
      loopEncounterIndex: (legacyWave - 1) % 12,
      score: progress.score,
    };
  }
  return {
    mode: 'complete',
    campaignEncounterIndex: 11,
    loopNumber: 1,
    loopEncounterIndex: 0,
    score: progress.score,
  };
}

function isSaveV1(value: unknown): value is SaveV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV1>;
  return candidate.version === 1
    && isStringArray(candidate.discoveredItemIds)
    && isStringArray(candidate.discoveredRecipeIds)
    && isNonNegativeFiniteNumber(candidate.bestEndlessWave)
    && isSettings(candidate.settings);
}

function isSaveV2(value: unknown): value is SaveV2 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV2>;
  return candidate.version === 2 && isMeta(candidate) && (candidate.activeRun === null || isActiveRunV2(candidate.activeRun));
}

function isSaveV3(value: unknown): value is SaveV3 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV3>;
  return candidate.version === 3 && isMeta(candidate) && (candidate.activeRun === null || isActiveRunV3(candidate.activeRun));
}

function isSaveV4(value: unknown): value is SaveV4 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV4>;
  return candidate.version === 4 && isMeta(candidate) && (candidate.activeRun === null || isActiveRunV4(candidate.activeRun));
}

function isSaveV5(value: unknown): value is SaveV5 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV5>;
  return candidate.version === 5 && isMeta(candidate) && (candidate.activeRun === null || isActiveRunV5(candidate.activeRun));
}

function isSaveV6(value: unknown): value is SaveV6 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV6>;
  return candidate.version === 6
    && isMeta(candidate)
    && isNonNegativeInteger(candidate.bestCorruptedLoop)
    && (candidate.activeRun === null || isActiveRunV6(candidate.activeRun));
}

function isMeta(value: {
  discoveredItemIds?: readonly string[];
  discoveredRecipeIds?: readonly string[];
  bestEndlessWave?: number;
  settings?: SaveSettings;
}): boolean {
  return isStringArray(value.discoveredItemIds)
    && isStringArray(value.discoveredRecipeIds)
    && isNonNegativeFiniteNumber(value.bestEndlessWave)
    && isSettings(value.settings);
}

function isActiveRunV2(value: unknown): value is ActiveRunSaveV2 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ActiveRunSaveV2>;
  return typeof candidate.runSeed === 'string'
    && isNonNegativeInteger(candidate.shopIndex)
    && isNonNegativeInteger(candidate.coins)
    && isStringArray(candidate.soldOfferIds)
    && Array.isArray(candidate.backpackItems)
    && candidate.backpackItems.every(isPlacedItem)
    && isPositiveInteger(candidate.nextLootSequence);
}

function isActiveRunV3(value: unknown): value is ActiveRunSaveV3 {
  return isActiveRunV2(value) && isStringArray((value as Partial<ActiveRunSaveV3>).claimedEncounterIds);
}

function isActiveRunV4(value: unknown): value is ActiveRunSaveV4 {
  if (!isActiveRunV3(value)) return false;
  const candidate = value as Partial<ActiveRunSaveV4>;
  return isStringArray(candidate.selectedPerkIds)
    && isNonNegativeInteger(candidate.perkChoiceIndex)
    && isStringArray(candidate.pendingPerkOfferIds)
    && isStringArray(candidate.offeredPerkEncounterIds);
}

function isActiveRunV5(value: unknown): value is ActiveRunSaveV5 {
  return isActiveRunV4(value) && isLegacyRunProgressState((value as Partial<ActiveRunSaveV5>).progress);
}

function isActiveRunV6(value: unknown): value is ActiveRunSave {
  return isActiveRunV4(value) && isRunProgressState((value as Partial<ActiveRunSave>).progress);
}

function isLegacyRunProgressState(value: unknown): value is LegacyRunProgressStateV5 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LegacyRunProgressStateV5>;
  return (candidate.mode === 'campaign' || candidate.mode === 'cashout' || candidate.mode === 'endless' || candidate.mode === 'complete')
    && isIntegerInRange(candidate.campaignEncounterIndex, 0, 8)
    && isNonNegativeInteger(candidate.endlessWave)
    && isNonNegativeInteger(candidate.score);
}

function isPlacedItem(value: unknown): value is PlacedItem {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PlacedItem>;
  return typeof candidate.instanceId === 'string'
    && typeof candidate.definitionId === 'string'
    && !!candidate.origin
    && Number.isInteger(candidate.origin.x)
    && Number.isInteger(candidate.origin.y)
    && (candidate.rotation === 0 || candidate.rotation === 1 || candidate.rotation === 2 || candidate.rotation === 3);
}

function isSettings(value: unknown): value is SaveSettings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveSettings>;
  return isUnitInterval(candidate.musicVolume)
    && isUnitInterval(candidate.sfxVolume)
    && typeof candidate.reducedMotion === 'boolean';
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
