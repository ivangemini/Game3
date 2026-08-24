import type { PlacedItem } from '../game/domain/types';

const SAVE_KEY = 'junkpack.save';

export interface SaveV1 {
  readonly version: 1;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly settings: {
    readonly musicVolume: number;
    readonly sfxVolume: number;
    readonly reducedMotion: boolean;
  };
}

export interface ActiveRunSave {
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
  readonly settings: {
    readonly musicVolume: number;
    readonly sfxVolume: number;
    readonly reducedMotion: boolean;
  };
  readonly activeRun: ActiveRunSave | null;
}

export type GameSave = SaveV2;

export const DEFAULT_SAVE: SaveV2 = {
  version: 2,
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

export function loadSave(storage: Storage = localStorage): SaveV2 {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return DEFAULT_SAVE;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSaveV2(parsed)) return parsed;
    if (isSaveV1(parsed)) return migrateV1ToV2(parsed);
  } catch {
    // Corrupted local data falls back safely; recovery UI can be added later.
  }

  return DEFAULT_SAVE;
}

export function writeSave(save: SaveV2, storage: Storage = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearActiveRun(save: SaveV2): SaveV2 {
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
    && isStringArray(candidate.discoveredItemIds)
    && isStringArray(candidate.discoveredRecipeIds)
    && isNonNegativeFiniteNumber(candidate.bestEndlessWave)
    && isSettings(candidate.settings)
    && (candidate.activeRun === null || isActiveRun(candidate.activeRun));
}

function isActiveRun(value: unknown): value is ActiveRunSave {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ActiveRunSave>;
  return typeof candidate.runSeed === 'string'
    && isNonNegativeInteger(candidate.shopIndex)
    && isNonNegativeInteger(candidate.coins)
    && isStringArray(candidate.soldOfferIds)
    && Array.isArray(candidate.backpackItems)
    && candidate.backpackItems.every(isPlacedItem)
    && isPositiveInteger(candidate.nextLootSequence);
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

function isSettings(value: unknown): value is SaveV2['settings'] {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV2['settings']>;
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
