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

export interface ActiveRunSave extends ActiveRunSaveV3 {
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
  readonly activeRun: ActiveRunSave | null;
}

export type GameSave = SaveV4;

export const DEFAULT_SAVE: SaveV4 = {
  version: 4,
  discoveredItemIds: [],
  discoveredRecipeIds: [],
  bestEndlessWave: 0,
  settings: {
    musicVolume: 0.8,
    sfxVolume: 0.9,
    reducedMotion: false,
  },
  activeRun: null,
};

export function loadSave(storage: Storage = localStorage): SaveV4 {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return DEFAULT_SAVE;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSaveV4(parsed)) return parsed;
    if (isSaveV3(parsed)) return migrateV3ToV4(parsed);
    if (isSaveV2(parsed)) return migrateV3ToV4(migrateV2ToV3(parsed));
    if (isSaveV1(parsed)) return migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(parsed)));
  } catch {
    // Corrupted local data falls back safely; recovery UI can be added later.
  }

  return DEFAULT_SAVE;
}

export function writeSave(save: SaveV4, storage: Storage = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearActiveRun(save: SaveV4): SaveV4 {
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
    activeRun: save.activeRun
      ? { ...save.activeRun, claimedEncounterIds: [] }
      : null,
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
  return candidate.version === 2
    && isMeta(candidate)
    && (candidate.activeRun === null || isActiveRunV2(candidate.activeRun));
}

function isSaveV3(value: unknown): value is SaveV3 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV3>;
  return candidate.version === 3
    && isMeta(candidate)
    && (candidate.activeRun === null || isActiveRunV3(candidate.activeRun));
}

function isSaveV4(value: unknown): value is SaveV4 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV4>;
  return candidate.version === 4
    && isMeta(candidate)
    && (candidate.activeRun === null || isActiveRunV4(candidate.activeRun));
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
  if (!isActiveRunV2(value)) return false;
  return isStringArray((value as Partial<ActiveRunSaveV3>).claimedEncounterIds);
}

function isActiveRunV4(value: unknown): value is ActiveRunSave {
  if (!isActiveRunV3(value)) return false;
  const candidate = value as Partial<ActiveRunSave>;
  return isStringArray(candidate.selectedPerkIds)
    && isNonNegativeInteger(candidate.perkChoiceIndex)
    && isStringArray(candidate.pendingPerkOfferIds)
    && isStringArray(candidate.offeredPerkEncounterIds);
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
