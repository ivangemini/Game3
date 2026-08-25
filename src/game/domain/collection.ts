import type { FusionRecipe } from './fusions';
import type { ItemDefinition } from './types';

export interface CollectionDiscoveryState {
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
}

export interface CollectionProgress {
  readonly discovered: number;
  readonly total: number;
  readonly percent: number;
}

export type ItemdexEntry =
  | {
      readonly definitionId: string;
      readonly discovered: false;
    }
  | {
      readonly definitionId: string;
      readonly discovered: true;
      readonly source: 'shop' | 'fusion';
      readonly definition: ItemDefinition;
    };

export type RecipeBookEntry =
  | {
      readonly recipeId: string;
      readonly discovered: false;
    }
  | {
      readonly recipeId: string;
      readonly discovered: true;
      readonly recipe: FusionRecipe;
      readonly ingredientDefinitions: readonly ItemDefinition[];
      readonly resultDefinition: ItemDefinition;
      readonly stage: 'first-stage' | 'second-stage';
    };

export interface CollectionSnapshot {
  readonly items: readonly ItemdexEntry[];
  readonly recipes: readonly RecipeBookEntry[];
  readonly itemProgress: CollectionProgress;
  readonly recipeProgress: CollectionProgress;
}

export function createCollectionSnapshot(
  allItems: readonly ItemDefinition[],
  shopItems: readonly ItemDefinition[],
  recipes: readonly FusionRecipe[],
  discovery: CollectionDiscoveryState,
): CollectionSnapshot {
  const itemMap = new Map(allItems.map((item) => [item.id, item]));
  const shopIds = new Set(shopItems.map((item) => item.id));
  const fusionIds = new Set(allItems.filter((item) => !shopIds.has(item.id)).map((item) => item.id));
  const discoveredItemIds = new Set(discovery.discoveredItemIds.filter((id) => itemMap.has(id)));
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const discoveredRecipeIds = new Set(discovery.discoveredRecipeIds.filter((id) => recipeMap.has(id)));

  const items: ItemdexEntry[] = allItems.map((definition) => discoveredItemIds.has(definition.id)
    ? {
        definitionId: definition.id,
        discovered: true,
        source: shopIds.has(definition.id) ? 'shop' : 'fusion',
        definition,
      }
    : { definitionId: definition.id, discovered: false });

  const recipeEntries: RecipeBookEntry[] = recipes.map((recipe) => {
    if (!discoveredRecipeIds.has(recipe.id)) return { recipeId: recipe.id, discovered: false };
    const ingredientDefinitions = recipe.ingredientDefinitionIds
      .map((id) => itemMap.get(id))
      .filter((definition): definition is ItemDefinition => definition !== undefined);
    const resultDefinition = itemMap.get(recipe.resultDefinitionId);
    if (ingredientDefinitions.length !== recipe.ingredientDefinitionIds.length || !resultDefinition) {
      return { recipeId: recipe.id, discovered: false };
    }
    const stage = recipe.ingredientDefinitionIds.every((id) => fusionIds.has(id))
      ? 'second-stage'
      : 'first-stage';
    return {
      recipeId: recipe.id,
      discovered: true,
      recipe,
      ingredientDefinitions,
      resultDefinition,
      stage,
    };
  });

  return {
    items,
    recipes: recipeEntries,
    itemProgress: progress(items.filter((entry) => entry.discovered).length, items.length),
    recipeProgress: progress(recipeEntries.filter((entry) => entry.discovered).length, recipeEntries.length),
  };
}

function progress(discovered: number, total: number): CollectionProgress {
  return {
    discovered,
    total,
    percent: total > 0 ? Math.round(discovered / total * 100) : 0,
  };
}
