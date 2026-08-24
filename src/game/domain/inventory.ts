import type { Cell, ItemDefinition, PlacedItem } from './types';

export interface InventoryState {
  readonly width: number;
  readonly height: number;
  readonly blockedCells: readonly Cell[];
  readonly items: readonly PlacedItem[];
}

export interface PlacementResult {
  readonly ok: boolean;
  readonly occupiedCells: readonly Cell[];
  readonly reason?: 'out-of-bounds' | 'blocked' | 'occupied';
}

const cellKey = (cell: Cell): string => `${cell.x}:${cell.y}`;

export function normalizeShape(cells: readonly Cell[]): Cell[] {
  if (cells.length === 0) return [];
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  return cells
    .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

export function rotateShape(cells: readonly Cell[], quarterTurns: 0 | 1 | 2 | 3): Cell[] {
  let rotated = normalizeShape(cells);
  for (let turn = 0; turn < quarterTurns; turn += 1) {
    rotated = normalizeShape(rotated.map((cell) => ({ x: -cell.y, y: cell.x })));
  }
  return rotated;
}

export function cellsForPlacement(
  definition: ItemDefinition,
  origin: Cell,
  rotation: 0 | 1 | 2 | 3,
): Cell[] {
  return rotateShape(definition.shape, rotation).map((cell) => ({
    x: origin.x + cell.x,
    y: origin.y + cell.y,
  }));
}

export function validatePlacement(
  state: InventoryState,
  definitions: ReadonlyMap<string, ItemDefinition>,
  candidate: PlacedItem,
  ignoreInstanceId?: string,
): PlacementResult {
  const definition = definitions.get(candidate.definitionId);
  if (!definition) throw new Error(`Unknown item definition: ${candidate.definitionId}`);

  const candidateCells = cellsForPlacement(definition, candidate.origin, candidate.rotation);
  const outOfBounds = candidateCells.some(
    (cell) => cell.x < 0 || cell.y < 0 || cell.x >= state.width || cell.y >= state.height,
  );
  if (outOfBounds) return { ok: false, occupiedCells: candidateCells, reason: 'out-of-bounds' };

  const blocked = new Set(state.blockedCells.map(cellKey));
  if (candidateCells.some((cell) => blocked.has(cellKey(cell)))) {
    return { ok: false, occupiedCells: candidateCells, reason: 'blocked' };
  }

  const occupied = new Set<string>();
  for (const item of state.items) {
    if (item.instanceId === ignoreInstanceId) continue;
    const itemDefinition = definitions.get(item.definitionId);
    if (!itemDefinition) throw new Error(`Unknown item definition: ${item.definitionId}`);
    for (const cell of cellsForPlacement(itemDefinition, item.origin, item.rotation)) {
      occupied.add(cellKey(cell));
    }
  }

  if (candidateCells.some((cell) => occupied.has(cellKey(cell)))) {
    return { ok: false, occupiedCells: candidateCells, reason: 'occupied' };
  }

  return { ok: true, occupiedCells: candidateCells };
}

export function findFirstValidPlacement(
  state: InventoryState,
  definitions: ReadonlyMap<string, ItemDefinition>,
  definitionId: string,
  instanceId: string,
): PlacedItem | null {
  if (!definitions.has(definitionId)) {
    throw new Error(`Unknown item definition: ${definitionId}`);
  }

  const rotations: readonly (0 | 1 | 2 | 3)[] = [0, 1, 2, 3];
  for (const rotation of rotations) {
    for (let y = 0; y < state.height; y += 1) {
      for (let x = 0; x < state.width; x += 1) {
        const candidate: PlacedItem = {
          instanceId,
          definitionId,
          origin: { x, y },
          rotation,
        };
        if (validatePlacement(state, definitions, candidate).ok) return candidate;
      }
    }
  }

  return null;
}
