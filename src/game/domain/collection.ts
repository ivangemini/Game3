import type { FusionRecipe } from './fusions';
import type { Cell, ItemDefinition, ItemTag, Rarity } from './types';

export interface CollectionDiscoveryState {
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
}

export interface CollectionProgress {
  readonly discovered: number;
  readonly total: number;
  readonly percent: number;
}

export interface RecipeClueProgress {
  readonly traced: number;
  readonly almostSolved: number;
}

export interface MissingIngredientClue {
  readonly rarity: Rarity;
  readonly primaryTag: ItemTag;
  readonly cellCount: number;
}

export type RecipeDiscoveryClue =
  | { readonly state: 'locked' }
  | {
      readonly state: 'traced';
      readonly knownIngredientDefinitions: readonly ItemDefinition[];
      readonly missingIngredientClues: readonly MissingIngredientClue[];
    }
  | {
      readonly state: 'almost-solved';
      readonly ingredientDefinitions: readonly ItemDefinition[];
      readonly authoredHint: string;
      readonly stage: 'first-stage' | 'second-stage';
    };

export type ItemdexEntry =
  | {
      readonly definitionId: string;
      readonly discovered: false;
      readonly silhouetteShape: readonly Cell[];
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
      readonly clue: RecipeDiscoveryClue;
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
  readonly recipeClueProgress: RecipeClueProgress;
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
    : {
        definitionId: definition.id,
        discovered: false,
        silhouetteShape: definition.shape.map((cell) => ({ ...cell })),
      });

  const recipeEntries: RecipeBookEntry[] = recipes.map((recipe) => {
    const ingredientDefinitions = recipe.ingredientDefinitionIds
      .map((id) => itemMap.get(id))
      .filter((definition): definition is ItemDefinition => definition !== undefined);
    const resultDefinition = itemMap.get(recipe.resultDefinitionId);
    const stage = recipe.ingredientDefinitionIds.every((id) => fusionIds.has(id))
      ? 'second-stage' as const
      : 'first-stage' as const;

    if (discoveredRecipeIds.has(recipe.id)
      && ingredientDefinitions.length === recipe.ingredientDefinitionIds.length
      && resultDefinition) {
      return {
        recipeId: recipe.id,
        discovered: true,
        recipe,
        ingredientDefinitions,
        resultDefinition,
        stage,
      };
    }

    return {
      recipeId: recipe.id,
      discovered: false,
      clue: createRecipeDiscoveryClue(
        recipe,
        itemMap,
        discoveredItemIds,
        fusionIds,
      ),
    };
  });

  const traced = recipeEntries.filter((entry) => !entry.discovered && entry.clue.state === 'traced').length;
  const almostSolved = recipeEntries.filter((entry) => !entry.discovered && entry.clue.state === 'almost-solved').length;

  return {
    items,
    recipes: recipeEntries,
    itemProgress: progress(items.filter((entry) => entry.discovered).length, items.length),
    recipeProgress: progress(recipeEntries.filter((entry) => entry.discovered).length, recipeEntries.length),
    recipeClueProgress: { traced, almostSolved },
  };
}

function createRecipeDiscoveryClue(
  recipe: FusionRecipe,
  itemMap: ReadonlyMap<string, ItemDefinition>,
  discoveredItemIds: ReadonlySet<string>,
  fusionIds: ReadonlySet<string>,
): RecipeDiscoveryClue {
  const ingredientDefinitions = recipe.ingredientDefinitionIds
    .map((id) => itemMap.get(id))
    .filter((definition): definition is ItemDefinition => definition !== undefined);
  if (ingredientDefinitions.length !== recipe.ingredientDefinitionIds.length) return { state: 'locked' };

  const known = ingredientDefinitions.filter((definition) => discoveredItemIds.has(definition.id));
  if (known.length === 0) return { state: 'locked' };

  if (known.length === ingredientDefinitions.length) {
    const stage = recipe.ingredientDefinitionIds.every((id) => fusionIds.has(id))
      ? 'second-stage' as const
      : 'first-stage' as const;
    return {
      state: 'almost-solved',
      ingredientDefinitions,
      authoredHint: recipe.hint,
      stage,
    };
  }

  const missing = ingredientDefinitions.filter((definition) => !discoveredItemIds.has(definition.id));
  return {
    state: 'traced',
    knownIngredientDefinitions: known,
    missingIngredientClues: missing.map((definition) => ({
      rarity: definition.rarity,
      primaryTag: definition.tags[0] ?? 'chaos',
      cellCount: definition.shape.length,
    })),
  };
}

function progress(discovered: number, total: number): CollectionProgress {
  return {
    discovered,
    total,
    percent: total > 0 ? Math.round(discovered / total * 100) : 0,
  };
}
