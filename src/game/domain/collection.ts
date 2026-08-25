import type { FusionRecipe } from './fusions';
import type { ItemDefinition } from './types';

export interface ItemCollectionEntry {
  readonly id: string;
  readonly discovered: boolean;
  readonly displayName: string;
  readonly rarity: ItemDefinition['rarity'];
  readonly tags: readonly string[];
}

export interface RecipeCollectionEntry {
  readonly id: string;
  readonly discovered: boolean;
  readonly displayName: string;
  readonly hint: string;
  readonly resultDefinitionId: string;
}

export interface CollectionSnapshot {
  readonly items: readonly ItemCollectionEntry[];
  readonly recipes: readonly RecipeCollectionEntry[];
  readonly discoveredItemCount: number;
  readonly discoveredRecipeCount: number;
}

export function buildCollectionSnapshot(
  definitions: readonly ItemDefinition[],
  recipes: readonly FusionRecipe[],
  discoveredItemIds: readonly string[],
  discoveredRecipeIds: readonly string[],
): CollectionSnapshot {
  const discoveredItems = new Set(discoveredItemIds);
  const discoveredRecipes = new Set(discoveredRecipeIds);
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));

  const items = [...definitions]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((definition): ItemCollectionEntry => {
      const discovered = discoveredItems.has(definition.id);
      return {
        id: definition.id,
        discovered,
        displayName: discovered ? definition.name : '???',
        rarity: definition.rarity,
        tags: discovered ? [...definition.tags] : [],
      };
    });

  const recipeEntries = [...recipes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((recipe): RecipeCollectionEntry => {
      const discovered = discoveredRecipes.has(recipe.id);
      const result = definitionsById.get(recipe.resultDefinitionId);
      return {
        id: recipe.id,
        discovered,
        displayName: discovered ? (result?.name ?? recipe.name) : '???',
        hint: recipe.hint,
        resultDefinitionId: recipe.resultDefinitionId,
      };
    });

  return {
    items,
    recipes: recipeEntries,
    discoveredItemCount: items.filter((entry) => entry.discovered).length,
    discoveredRecipeCount: recipeEntries.filter((entry) => entry.discovered).length,
  };
}
