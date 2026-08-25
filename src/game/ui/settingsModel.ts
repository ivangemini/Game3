export interface SettingsDraft {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly reducedMotion: boolean;
}

const STEP = 0.1;

export function normalizeSettingsDraft(settings: SettingsDraft): SettingsDraft {
  return {
    musicVolume: clampVolume(settings.musicVolume),
    sfxVolume: clampVolume(settings.sfxVolume),
    reducedMotion: Boolean(settings.reducedMotion),
  };
}

export function stepVolume(value: number, direction: -1 | 1): number {
  const normalized = clampVolume(value);
  return clampVolume(Math.round((normalized + direction * STEP) * 10) / 10);
}

export function volumePercent(value: number): number {
  return Math.round(clampVolume(value) * 100);
}

export function settingsEqual(a: SettingsDraft, b: SettingsDraft): boolean {
  const left = normalizeSettingsDraft(a);
  const right = normalizeSettingsDraft(b);
  return left.musicVolume === right.musicVolume
    && left.sfxVolume === right.sfxVolume
    && left.reducedMotion === right.reducedMotion;
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
