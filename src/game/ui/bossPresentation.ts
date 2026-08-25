export interface BossMotionSpec {
  readonly key: string;
  readonly accent: number;
  readonly idle: 'float' | 'sway' | 'breathe' | 'orbit' | 'stamp' | 'patrol';
  readonly idleAmount: number;
  readonly idleDurationMs: number;
  readonly telegraph: 'flicker' | 'compress' | 'lunge' | 'eclipse' | 'double-stamp' | 'edge-charge';
  readonly impact: 'glitch' | 'snap' | 'slam' | 'flare' | 'stamp' | 'bite';
}

const SPECS: Readonly<Record<string, BossMotionSpec>> = {
  'boss.tv-tyrant': { key: 'boss.tv-tyrant', accent: 0xff91e6, idle: 'sway', idleAmount: 2, idleDurationMs: 980, telegraph: 'flicker', impact: 'glitch' },
  'boss.deadline-snail': { key: 'boss.deadline-snail', accent: 0xffcf69, idle: 'float', idleAmount: 3, idleDurationMs: 1280, telegraph: 'compress', impact: 'snap' },
  'boss.closet-monster': { key: 'boss.closet-monster', accent: 0x7de6ff, idle: 'breathe', idleAmount: 0.018, idleDurationMs: 1120, telegraph: 'lunge', impact: 'slam' },
  'boss.baby-moon': { key: 'boss.baby-moon', accent: 0xd18cff, idle: 'orbit', idleAmount: 2.4, idleDurationMs: 1480, telegraph: 'eclipse', impact: 'flare' },
  'boss.copycat-auditor': { key: 'boss.copycat-auditor', accent: 0xff9b5f, idle: 'stamp', idleAmount: 2, idleDurationMs: 900, telegraph: 'double-stamp', impact: 'stamp' },
  'boss.border-shark': { key: 'boss.border-shark', accent: 0x58d7ff, idle: 'patrol', idleAmount: 4, idleDurationMs: 1050, telegraph: 'edge-charge', impact: 'bite' },
};

export function bossMotionSpecForArtKey(key: string | null): BossMotionSpec | null {
  if (!key) return null;
  return SPECS[key] ?? null;
}

export function authoredBossKeys(): readonly string[] {
  return Object.keys(SPECS).sort();
}
