import type { FusionRecipe } from '../domain/fusions';

export const WAVE4_SECOND_STAGE_RECIPE_IDS = [
  'cataclysm-satellite',
  'plague-picnic',
  'thunder-rail-mop',
] as const;

export const WAVE4_FUSION_RECIPES: readonly FusionRecipe[] = [
  {
    id: 'cataclysm-satellite',
    name: 'Cataclysm Satellite',
    ingredientDefinitionIds: ['orbital-cat', 'turbo-router'],
    resultDefinitionId: 'cataclysm-satellite',
    hint: 'ORBITAL CAT + TURBO ROUTER',
  },
  {
    id: 'plague-picnic',
    name: 'Plague Picnic',
    ingredientDefinitionIds: ['bio-snack-pack', 'apocalypse-microwave'],
    resultDefinitionId: 'plague-picnic',
    hint: 'BIO SNACK PACK + APOCALYPSE MICROWAVE',
  },
  {
    id: 'thunder-rail-mop',
    name: 'Thunder Rail Mop',
    ingredientDefinitionIds: ['rail-mop', 'storm-disco'],
    resultDefinitionId: 'thunder-rail-mop',
    hint: 'RAIL MOP + STORM DISCO',
  },
];
