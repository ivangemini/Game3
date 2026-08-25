export type MusicMode = 'menu' | 'combat' | 'boss';

export interface MusicStep {
  readonly rootHz: number;
  readonly accentHz: number | null;
  readonly bassHz: number | null;
  readonly durationMs: number;
  readonly intervalMs: number;
  readonly gain: number;
}

const MENU_PATTERN = [0, 7, 3, 10, 5, 12, 7, 3, 0, 5, 10, 7, 3, 8, 5, 2] as const;
const COMBAT_PATTERN = [0, 3, 7, 10, 7, 12, 10, 3, 0, 7, 5, 10, 3, 12, 8, 7] as const;
const BOSS_PATTERN = [0, 1, 7, 6, 10, 7, 1, 12, 0, 6, 1, 10, 7, 13, 6, 1] as const;

export function musicStepFor(mode: MusicMode, stepIndex: number): MusicStep {
  const index = Math.max(0, Math.floor(Number.isFinite(stepIndex) ? stepIndex : 0));
  const pattern = mode === 'boss' ? BOSS_PATTERN : mode === 'combat' ? COMBAT_PATTERN : MENU_PATTERN;
  const semitone = pattern[index % pattern.length]!;
  const baseHz = mode === 'boss' ? 82.41 : mode === 'combat' ? 98 : 110;
  const rootHz = baseHz * 2 ** (semitone / 12);
  const accentCadence = mode === 'boss' ? 2 : mode === 'combat' ? 4 : 4;
  const accent = index % accentCadence === 0
    ? rootHz * (mode === 'boss' ? 1.5 : 2)
    : null;
  const bassCadence = mode === 'boss' ? 2 : mode === 'combat' ? 4 : 8;
  const bass = index % bassCadence === 0 ? Math.max(32, rootHz / 2) : null;
  const baseIntervalMs = mode === 'boss' ? 300 : mode === 'combat' ? 360 : 520;
  const swingMs = mode === 'menu' ? 0 : mode === 'boss' ? 10 : 14;
  const intervalMs = baseIntervalMs + (index % 2 === 0 ? -swingMs : swingMs);
  const durationMs = mode === 'boss' ? 250 : mode === 'combat' ? 300 : 430;
  const gain = mode === 'boss' ? 0.032 : mode === 'combat' ? 0.025 : 0.018;
  return {
    rootHz: finitePositive(rootHz),
    accentHz: accent === null ? null : finitePositive(accent),
    bassHz: bass === null ? null : finitePositive(bass),
    durationMs,
    intervalMs,
    gain,
  };
}

function finitePositive(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, value);
}
