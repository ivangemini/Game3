import { cellsForPlacement, type InventoryState } from './inventory';
import {
  createCombatBuildItem,
  type CombatItemProfile,
  type CombatBuildItem,
} from './combat';
import { applyPerkBonuses, type PerkDefinition } from './perks';
import { evaluateSynergies, type SynergySnapshot } from './synergies';
import type { ItemDefinition } from './types';

export interface CombatBuildSnapshot {
  readonly items: ReadonlyMap<string, CombatBuildItem>;
  readonly synergies: SynergySnapshot;
}

export function createCombatBuild(
  inventory: InventoryState,
  definitions: ReadonlyMap<string, ItemDefinition>,
  profiles: ReadonlyMap<string, CombatItemProfile>,
  perkDefinitions: ReadonlyMap<string, PerkDefinition> = new Map(),
  selectedPerkIds: readonly string[] = [],
): CombatBuildSnapshot {
  const synergies = evaluateSynergies(inventory, definitions);
  const items = new Map<string, CombatBuildItem>();

  const orderedPlacements = [...inventory.items].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  for (const placement of orderedPlacements) {
    const profile = profiles.get(placement.definitionId);
    const definition = definitions.get(placement.definitionId);
    if (!profile || !definition) continue;
    const bonuses = applyPerkBonuses(
      definition,
      synergies.bonusesByInstanceId[placement.instanceId],
      perkDefinitions,
      selectedPerkIds,
    );
    items.set(
      placement.instanceId,
      createCombatBuildItem(
        placement.instanceId,
        profile,
        bonuses,
        cellsForPlacement(definition, placement.origin, placement.rotation),
        definition.tags.includes('metal'),
      ),
    );
  }

  return { items, synergies };
}
