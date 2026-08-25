import { findFirstValidPlacement, validatePlacement, type InventoryState } from './inventory';
import type { ItemDefinition, PlacedItem } from './types';

export interface FusionRecipe {
  readonly id: string;
  readonly name: string;
  readonly ingredientDefinitionIds: readonly string[];
  readonly resultDefinitionId: string;
  readonly hint: string;
}

export interface FusionCandidate {
  readonly recipe: FusionRecipe;
  readonly ingredientInstanceIds: readonly string[];
}

export interface FusionSuccess {
  readonly ok: true;
  readonly state: InventoryState;
  readonly recipe: FusionRecipe;
  readonly ingredientInstanceIds: readonly string[];
  readonly resultItem: PlacedItem;
}

export interface FusionFailure {
  readonly ok: false;
  readonly reason: 'missing-ingredients' | 'unknown-result' | 'no-space';
}

export type FusionResult = FusionSuccess | FusionFailure;

export function findFusionCandidate(
  items: readonly PlacedItem[],
  recipe: FusionRecipe,
): FusionCandidate | null {
  const orderedItems = [...items].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  const used = new Set<string>();
  const ingredientInstanceIds: string[] = [];

  for (const definitionId of recipe.ingredientDefinitionIds) {
    const match = orderedItems.find(
      (item) => item.definitionId === definitionId && !used.has(item.instanceId),
    );
    if (!match) return null;
    used.add(match.instanceId);
    ingredientInstanceIds.push(match.instanceId);
  }

  return { recipe, ingredientInstanceIds };
}

export function findAvailableFusions(
  items: readonly PlacedItem[],
  recipes: readonly FusionRecipe[],
): FusionCandidate[] {
  return [...recipes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((recipe) => findFusionCandidate(items, recipe))
    .filter((candidate): candidate is FusionCandidate => candidate !== null);
}

export function applyFusion(
  state: InventoryState,
  definitions: ReadonlyMap<string, ItemDefinition>,
  recipe: FusionRecipe,
  resultInstanceId: string,
): FusionResult {
  const candidate = findFusionCandidate(state.items, recipe);
  if (!candidate) return { ok: false, reason: 'missing-ingredients' };
  if (!definitions.has(recipe.resultDefinitionId)) return { ok: false, reason: 'unknown-result' };

  const consumed = new Set(candidate.ingredientInstanceIds);
  const ingredientItems = state.items
    .filter((item) => consumed.has(item.instanceId))
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  const reducedState: InventoryState = {
    ...state,
    items: state.items.filter((item) => !consumed.has(item.instanceId)),
  };

  const preferredOrigins = ingredientItems.map((item) => item.origin);
  const rotations: readonly (0 | 1 | 2 | 3)[] = [0, 1, 2, 3];
  let resultItem: PlacedItem | null = null;

  for (const origin of preferredOrigins) {
    for (const rotation of rotations) {
      const placement: PlacedItem = {
        instanceId: resultInstanceId,
        definitionId: recipe.resultDefinitionId,
        origin: { ...origin },
        rotation,
      };
      if (validatePlacement(reducedState, definitions, placement).ok) {
        resultItem = placement;
        break;
      }
    }
    if (resultItem) break;
  }

  resultItem ??= findFirstValidPlacement(
    reducedState,
    definitions,
    recipe.resultDefinitionId,
    resultInstanceId,
  );

  if (!resultItem) return { ok: false, reason: 'no-space' };

  return {
    ok: true,
    recipe,
    ingredientInstanceIds: candidate.ingredientInstanceIds,
    resultItem,
    state: {
      ...reducedState,
      items: [...reducedState.items, resultItem],
    },
  };
}
