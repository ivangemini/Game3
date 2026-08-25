import { cellsForPlacement, type InventoryState } from './inventory';
import type { Cell, ItemDefinition, ItemTag, PlacedItem } from './types';

export type SynergyId =
  | 'cat-laser'
  | 'battery-device'
  | 'poison-weapon'
  | 'duck-chaos'
  | 'magnet-metal'
  | 'food-pet'
  | 'antenna-device'
  | 'slime-poison'
  | 'metal-weapon'
  | 'chaos-laser';

export type SynergyBonusKey =
  | 'triggerSpeedPct'
  | 'poisonOnHit'
  | 'bonusLaserShots'
  | 'chaosPower'
  | 'scrapArmor';

export interface ItemBonuses {
  readonly triggerSpeedPct: number;
  readonly poisonOnHit: number;
  readonly bonusLaserShots: number;
  readonly chaosPower: number;
  readonly scrapArmor: number;
}

export interface SynergyRule {
  readonly id: SynergyId;
  readonly label: string;
  readonly sourceTag: ItemTag;
  readonly targetTag: ItemTag;
  readonly bonusRecipient: 'source' | 'target';
  readonly effectText: string;
  readonly bonus: {
    readonly key: SynergyBonusKey;
    readonly amount: number;
  };
}

export interface SynergyConnection {
  readonly ruleId: SynergyId;
  readonly sourceInstanceId: string;
  readonly targetInstanceId: string;
  readonly bonusInstanceId: string;
}

export interface SynergySnapshot {
  readonly connections: readonly SynergyConnection[];
  readonly bonusesByInstanceId: Readonly<Record<string, ItemBonuses>>;
}

interface MutableItemBonuses {
  triggerSpeedPct: number;
  poisonOnHit: number;
  bonusLaserShots: number;
  chaosPower: number;
  scrapArmor: number;
}

export const SYNERGY_RULES: readonly SynergyRule[] = [
  {
    id: 'cat-laser',
    label: 'CAT → LASER',
    sourceTag: 'cat',
    targetTag: 'laser',
    bonusRecipient: 'source',
    effectText: 'Cat fires +1 laser shot.',
    bonus: { key: 'bonusLaserShots', amount: 1 },
  },
  {
    id: 'battery-device',
    label: 'BATTERY → DEVICE',
    sourceTag: 'battery',
    targetTag: 'device',
    bonusRecipient: 'target',
    effectText: 'Device triggers 25% faster.',
    bonus: { key: 'triggerSpeedPct', amount: 25 },
  },
  {
    id: 'poison-weapon',
    label: 'POISON → WEAPON',
    sourceTag: 'poison',
    targetTag: 'weapon',
    bonusRecipient: 'target',
    effectText: 'Weapon applies +2 poison.',
    bonus: { key: 'poisonOnHit', amount: 2 },
  },
  {
    id: 'duck-chaos',
    label: 'DUCK → CHAOS',
    sourceTag: 'duck',
    targetTag: 'chaos',
    bonusRecipient: 'source',
    effectText: 'Duck gains +1 chaos power.',
    bonus: { key: 'chaosPower', amount: 1 },
  },
  {
    id: 'magnet-metal',
    label: 'MAGNET → METAL',
    sourceTag: 'magnet',
    targetTag: 'metal',
    bonusRecipient: 'source',
    effectText: 'Magnet gains +1 scrap armor.',
    bonus: { key: 'scrapArmor', amount: 1 },
  },
  {
    id: 'food-pet',
    label: 'FOOD → PET',
    sourceTag: 'food',
    targetTag: 'pet',
    bonusRecipient: 'target',
    effectText: 'Fed pet triggers 20% faster.',
    bonus: { key: 'triggerSpeedPct', amount: 20 },
  },
  {
    id: 'antenna-device',
    label: 'ANTENNA → DEVICE',
    sourceTag: 'antenna',
    targetTag: 'device',
    bonusRecipient: 'target',
    effectText: 'Connected device triggers 15% faster.',
    bonus: { key: 'triggerSpeedPct', amount: 15 },
  },
  {
    id: 'slime-poison',
    label: 'SLIME → POISON',
    sourceTag: 'slime',
    targetTag: 'poison',
    bonusRecipient: 'source',
    effectText: 'Slime applies +2 poison on trigger.',
    bonus: { key: 'poisonOnHit', amount: 2 },
  },
  {
    id: 'metal-weapon',
    label: 'METAL → WEAPON',
    sourceTag: 'metal',
    targetTag: 'weapon',
    bonusRecipient: 'target',
    effectText: 'Reinforced weapon contributes +1 scrap armor.',
    bonus: { key: 'scrapArmor', amount: 1 },
  },
  {
    id: 'chaos-laser',
    label: 'CHAOS → LASER',
    sourceTag: 'chaos',
    targetTag: 'laser',
    bonusRecipient: 'target',
    effectText: 'Laser fires +1 unstable bonus shot.',
    bonus: { key: 'bonusLaserShots', amount: 1 },
  },
];

export const SYNERGY_RULE_MAP = new Map<SynergyId, SynergyRule>(
  SYNERGY_RULES.map((rule) => [rule.id, rule]),
);

const ORTHOGONAL_DIRECTIONS: readonly Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const cellKey = (cell: Cell): string => `${cell.x}:${cell.y}`;

const emptyBonuses = (): MutableItemBonuses => ({
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
});

function definitionFor(
  definitions: ReadonlyMap<string, ItemDefinition>,
  item: PlacedItem,
): ItemDefinition {
  const definition = definitions.get(item.definitionId);
  if (!definition) throw new Error(`Unknown item definition: ${item.definitionId}`);
  return definition;
}

function orthogonallyAdjacent(sourceCells: readonly Cell[], targetCells: readonly Cell[]): boolean {
  const targetKeys = new Set(targetCells.map(cellKey));
  return sourceCells.some((sourceCell) =>
    ORTHOGONAL_DIRECTIONS.some((direction) =>
      targetKeys.has(`${sourceCell.x + direction.x}:${sourceCell.y + direction.y}`),
    ),
  );
}

function addBonus(
  bonuses: MutableItemBonuses,
  key: SynergyBonusKey,
  amount: number,
): void {
  switch (key) {
    case 'triggerSpeedPct':
      bonuses.triggerSpeedPct += amount;
      return;
    case 'poisonOnHit':
      bonuses.poisonOnHit += amount;
      return;
    case 'bonusLaserShots':
      bonuses.bonusLaserShots += amount;
      return;
    case 'chaosPower':
      bonuses.chaosPower += amount;
      return;
    case 'scrapArmor':
      bonuses.scrapArmor += amount;
      return;
  }
}

export function evaluateSynergies(
  state: InventoryState,
  definitions: ReadonlyMap<string, ItemDefinition>,
): SynergySnapshot {
  const items = [...state.items].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  const cellsByInstanceId = new Map<string, readonly Cell[]>();
  const bonusesByInstanceId = new Map<string, MutableItemBonuses>();

  for (const item of items) {
    const definition = definitionFor(definitions, item);
    cellsByInstanceId.set(
      item.instanceId,
      cellsForPlacement(definition, item.origin, item.rotation),
    );
    bonusesByInstanceId.set(item.instanceId, emptyBonuses());
  }

  const connections: SynergyConnection[] = [];

  for (const rule of SYNERGY_RULES) {
    const sources = items.filter((item) =>
      definitionFor(definitions, item).tags.includes(rule.sourceTag),
    );
    const targets = items.filter((item) =>
      definitionFor(definitions, item).tags.includes(rule.targetTag),
    );

    for (const source of sources) {
      const sourceCells = cellsByInstanceId.get(source.instanceId);
      if (!sourceCells) continue;

      for (const target of targets) {
        if (source.instanceId === target.instanceId) continue;
        const targetCells = cellsByInstanceId.get(target.instanceId);
        if (!targetCells || !orthogonallyAdjacent(sourceCells, targetCells)) continue;

        const bonusInstanceId = rule.bonusRecipient === 'source'
          ? source.instanceId
          : target.instanceId;
        const bonuses = bonusesByInstanceId.get(bonusInstanceId);
        if (!bonuses) continue;

        addBonus(bonuses, rule.bonus.key, rule.bonus.amount);
        connections.push({
          ruleId: rule.id,
          sourceInstanceId: source.instanceId,
          targetInstanceId: target.instanceId,
          bonusInstanceId,
        });
      }
    }
  }

  const resultBonuses: Record<string, ItemBonuses> = {};
  for (const item of items) {
    const bonuses = bonusesByInstanceId.get(item.instanceId);
    if (!bonuses) continue;
    resultBonuses[item.instanceId] = { ...bonuses };
  }

  return {
    connections,
    bonusesByInstanceId: resultBonuses,
  };
}
