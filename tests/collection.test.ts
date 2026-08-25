import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_RECIPES } from '../src/game/data/fusionRecipes';
import { PROTOTYPE_ITEMS } from '../src/game/data/items';
import { buildCollectionSnapshot } from '../src/game/domain/collection';

describe('collection snapshot', () => {
  it('is stable regardless of discovery array order', () => {
    const first = buildCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      ['laser-cat', 'angry-battery'],
      ['cyber-cat', 'shock-toaster'],
    );
    const second = buildCollectionSnapshot(
      [...PROTOTYPE_ITEMS].reverse(),
      [...PROTOTYPE_FUSION_RECIPES].reverse(),
      ['angry-battery', 'laser-cat'],
      ['shock-toaster', 'cyber-cat'],
    );
    expect(second).toEqual(first);
  });

  it('hides undiscovered item names and tags', () => {
    const snapshot = buildCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      [],
      [],
    );
    const laserCat = snapshot.items.find((entry) => entry.id === 'laser-cat');
    expect(laserCat?.displayName).toBe('???');
    expect(laserCat?.tags).toEqual([]);
    expect(snapshot.discoveredItemCount).toBe(0);
  });

  it('reveals discovered item names and tags', () => {
    const snapshot = buildCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      ['laser-cat'],
      [],
    );
    const laserCat = snapshot.items.find((entry) => entry.id === 'laser-cat');
    expect(laserCat?.displayName).toBe('Laser Cat');
    expect(laserCat?.tags).toContain('cat');
    expect(snapshot.discoveredItemCount).toBe(1);
  });

  it('keeps recipe hints visible while hiding undiscovered results', () => {
    const snapshot = buildCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      [],
      [],
    );
    const shockToaster = snapshot.recipes.find((entry) => entry.id === 'shock-toaster');
    expect(shockToaster?.hint).toBe('BATTERY + TOASTER');
    expect(shockToaster?.displayName).toBe('???');
    expect(snapshot.discoveredRecipeCount).toBe(0);
  });

  it('reveals the fusion result after discovering the recipe', () => {
    const snapshot = buildCollectionSnapshot(
      PROTOTYPE_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      ['shock-toaster'],
      ['shock-toaster'],
    );
    const shockToaster = snapshot.recipes.find((entry) => entry.id === 'shock-toaster');
    expect(shockToaster?.displayName).toBe('Shock Toaster');
    expect(snapshot.discoveredRecipeCount).toBe(1);
  });
});
