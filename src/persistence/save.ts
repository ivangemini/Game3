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

export const DEFAULT_SAVE: SaveV1 = {
  version: 1,
  discoveredItemIds: [],
  discoveredRecipeIds: [],
  bestEndlessWave: 0,
  settings: {
    musicVolume: 0.8,
    sfxVolume: 0.9,
    reducedMotion: false,
  },
};

export function loadSave(storage: Storage = localStorage): SaveV1 {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return DEFAULT_SAVE;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSaveV1(parsed)) return parsed;
  } catch {
    // Corrupted local data falls back safely; recovery UI can be added later.
  }

  return DEFAULT_SAVE;
}

export function writeSave(save: SaveV1, storage: Storage = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

function isSaveV1(value: unknown): value is SaveV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV1>;
  return candidate.version === 1
    && Array.isArray(candidate.discoveredItemIds)
    && Array.isArray(candidate.discoveredRecipeIds)
    && typeof candidate.bestEndlessWave === 'number'
    && !!candidate.settings
    && typeof candidate.settings.musicVolume === 'number'
    && typeof candidate.settings.sfxVolume === 'number'
    && typeof candidate.settings.reducedMotion === 'boolean';
}
