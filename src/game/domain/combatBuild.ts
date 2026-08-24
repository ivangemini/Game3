import type { InventoryState } from './inventory';
import {
  createCombatBuildItem,
  type CombatItemProfile,
  type CombatBuildItem,
} from './combat';
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
): CombatBuildSnapshot {
  const synergies = evaluateSynergies(inventory, definitions);
  const items = new Map<string, CombatBuildItem>();

  const orderedPlacements = [...inventory.items].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  for (const placement of orderedPlacements) {
    const profile = profiles.get(placement.definitionId);
    if (!profile) continue;
    items.set(
      placement.instanceId,
      createCombatBuildItem(
        placement.instanceId,
        profile,
        synergies.bonusesByInstanceId[placement.instanceId],
      ),
    );
  }

  return { items, synergies };
}
