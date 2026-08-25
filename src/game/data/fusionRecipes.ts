import type { FusionRecipe } from '../domain/fusions';

export const PROTOTYPE_FUSION_RECIPES: readonly FusionRecipe[] = [
  {
    id: 'shock-toaster',
    name: 'Shock Toaster',
    ingredientDefinitionIds: ['angry-battery', 'cursed-toaster'],
    resultDefinitionId: 'shock-toaster',
    hint: 'BATTERY + TOASTER',
  },
  {
    id: 'cyber-cat',
    name: 'Cyber Cat',
    ingredientDefinitionIds: ['laser-cat', 'angry-battery'],
    resultDefinitionId: 'cyber-cat',
    hint: 'LASER CAT + BATTERY',
  },
  {
    id: 'biohazard-turbine',
    name: 'Biohazard Turbine',
    ingredientDefinitionIds: ['poison-flask', 'toxic-fan'],
    resultDefinitionId: 'biohazard-turbine',
    hint: 'POISON + TOXIC FAN',
  },
  {
    id: 'polarity-duck',
    name: 'Polarity Duck',
    ingredientDefinitionIds: ['mutant-duck', 'scrap-magnet'],
    resultDefinitionId: 'polarity-duck',
    hint: 'MUTANT DUCK + MAGNET',
  },
  {
    id: 'toxic-fish-cannon',
    name: 'Toxic Fish Cannon',
    ingredientDefinitionIds: ['fish-blaster', 'poison-flask'],
    resultDefinitionId: 'toxic-fish-cannon',
    hint: 'FISH BLASTER + POISON',
  },
  {
    id: 'gravity-toaster',
    name: 'Gravity Toaster',
    ingredientDefinitionIds: ['cursed-toaster', 'scrap-magnet'],
    resultDefinitionId: 'gravity-toaster',
    hint: 'TOASTER + MAGNET',
  },
];

export const PROTOTYPE_FUSION_RECIPE_MAP = new Map(
  PROTOTYPE_FUSION_RECIPES.map((recipe) => [recipe.id, recipe]),
);
