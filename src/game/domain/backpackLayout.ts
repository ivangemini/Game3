import type { Cell } from './types';

export const BACKPACK_WIDTH = 6;
export const BACKPACK_HEIGHT = 5;
export const POCKET_UNLOCK_ORDER: readonly Cell[] = [
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
];

export function normalizePocketUnlockCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(POCKET_UNLOCK_ORDER.length, Math.floor(value)));
}

export function blockedCellsForPocketUnlockCount(unlockedCount: number): readonly Cell[] {
  return POCKET_UNLOCK_ORDER
    .slice(normalizePocketUnlockCount(unlockedCount))
    .map((cell) => ({ ...cell }));
}
