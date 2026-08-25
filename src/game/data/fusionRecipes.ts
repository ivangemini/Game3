import type { FusionRecipe } from '../domain/fusions';

export const PROTOTYPE_FUSION_RECIPES: readonly FusionRecipe[] = [
  { id: 'shock-toaster', name: 'Shock Toaster', ingredientDefinitionIds: ['angry-battery', 'cursed-toaster'], resultDefinitionId: 'shock-toaster', hint: 'BATTERY + TOASTER' },
  { id: 'cyber-cat', name: 'Cyber Cat', ingredientDefinitionIds: ['laser-cat', 'angry-battery'], resultDefinitionId: 'cyber-cat', hint: 'LASER CAT + BATTERY' },
  { id: 'biohazard-turbine', name: 'Biohazard Turbine', ingredientDefinitionIds: ['poison-flask', 'toxic-fan'], resultDefinitionId: 'biohazard-turbine', hint: 'POISON + TOXIC FAN' },
  { id: 'polarity-duck', name: 'Polarity Duck', ingredientDefinitionIds: ['mutant-duck', 'scrap-magnet'], resultDefinitionId: 'polarity-duck', hint: 'MUTANT DUCK + MAGNET' },
  { id: 'toxic-fish-cannon', name: 'Toxic Fish Cannon', ingredientDefinitionIds: ['fish-blaster', 'poison-flask'], resultDefinitionId: 'toxic-fish-cannon', hint: 'FISH BLASTER + POISON' },
  { id: 'gravity-toaster', name: 'Gravity Toaster', ingredientDefinitionIds: ['cursed-toaster', 'scrap-magnet'], resultDefinitionId: 'gravity-toaster', hint: 'TOASTER + MAGNET' },
  { id: 'turbo-router', name: 'Turbo Router', ingredientDefinitionIds: ['feral-router', 'angry-battery'], resultDefinitionId: 'turbo-router', hint: 'FERAL ROUTER + BATTERY' },
  { id: 'slime-sword', name: 'Slime Sword', ingredientDefinitionIds: ['slime-can', 'wrench-sword'], resultDefinitionId: 'slime-sword', hint: 'SLIME CAN + WRENCH SWORD' },
  { id: 'laser-banana', name: 'Laser Banana', ingredientDefinitionIds: ['tactical-banana', 'laser-cat'], resultDefinitionId: 'laser-banana', hint: 'TACTICAL BANANA + LASER CAT' },
  { id: 'radio-duck', name: 'Radio Duck', ingredientDefinitionIds: ['pocket-radio', 'mutant-duck'], resultDefinitionId: 'radio-duck', hint: 'POCKET RADIO + MUTANT DUCK' },
  { id: 'noodle-fan', name: 'Noodle Fan', ingredientDefinitionIds: ['panic-noodles', 'toxic-fan'], resultDefinitionId: 'noodle-fan', hint: 'PANIC NOODLES + TOXIC FAN' },
  { id: 'disco-snail', name: 'Disco Snail', ingredientDefinitionIds: ['battery-snail', 'disco-orb'], resultDefinitionId: 'disco-snail', hint: 'BATTERY SNAIL + DISCO ORB' },

  { id: 'reactor-hamster', name: 'Reactor Hamster', ingredientDefinitionIds: ['alarm-hamster', 'angry-battery'], resultDefinitionId: 'reactor-hamster', hint: 'ALARM HAMSTER + BATTERY' },
  { id: 'acid-parasol', name: 'Acid Parasol', ingredientDefinitionIds: ['toxic-umbrella', 'slime-can'], resultDefinitionId: 'acid-parasol', hint: 'TOXIC UMBRELLA + SLIME CAN' },
  { id: 'broadcast-trident', name: 'Broadcast Trident', ingredientDefinitionIds: ['satellite-fork', 'pocket-radio'], resultDefinitionId: 'broadcast-trident', hint: 'SATELLITE FORK + POCKET RADIO' },
  { id: 'storm-disco', name: 'Storm Disco', ingredientDefinitionIds: ['canned-lightning', 'disco-orb'], resultDefinitionId: 'storm-disco', hint: 'CANNED LIGHTNING + DISCO ORB' },
  { id: 'bio-snack-pack', name: 'Bio Snack Pack', ingredientDefinitionIds: ['slime-donut', 'tactical-banana'], resultDefinitionId: 'bio-snack-pack', hint: 'SLIME DONUT + TACTICAL BANANA' },
  { id: 'orbital-cat', name: 'Orbital Cat', ingredientDefinitionIds: ['catellite-dish', 'feral-router'], resultDefinitionId: 'orbital-cat', hint: 'CATELLITE DISH + FERAL ROUTER' },
  { id: 'apocalypse-microwave', name: 'Apocalypse Microwave', ingredientDefinitionIds: ['emergency-microwave', 'panic-noodles'], resultDefinitionId: 'apocalypse-microwave', hint: 'EMERGENCY MICROWAVE + PANIC NOODLES' },
  { id: 'rail-mop', name: 'Rail Mop', ingredientDefinitionIds: ['laser-mop', 'scrap-magnet'], resultDefinitionId: 'rail-mop', hint: 'LASER MOP + SCRAP MAGNET' },

  // Second-stage secret evolution: both ingredients are fusion-only results, so this
  // cannot exist until the player has already discovered and assembled two recipes.
  { id: 'singularity-toaster', name: 'Singularity Toaster', ingredientDefinitionIds: ['gravity-toaster', 'shock-toaster'], resultDefinitionId: 'singularity-toaster', hint: 'TWO IMPOSSIBLE TOASTERS' },
];

export const PROTOTYPE_FUSION_RECIPE_MAP = new Map(
  PROTOTYPE_FUSION_RECIPES.map((recipe) => [recipe.id, recipe]),
);
