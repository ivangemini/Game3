import type { ItemDefinition, ItemTag, Rarity } from '../domain/types';

export interface RarityVisualToken {
  readonly fill: number;
  readonly mid: number;
  readonly stroke: number;
  readonly accent: number;
  readonly text: string;
  readonly label: string;
}

export const ITEM_ATLAS_TEXTURE_KEY = 'junk-items';

export const PANEL_VISUALS = {
  ink: 0x0c0d12,
  panel: 0x181820,
  panelRaised: 0x24232d,
  leather: 0x3a2b28,
  leatherDark: 0x221918,
  leatherEdge: 0x8f674d,
  scrap: 0x3a3e48,
  scrapEdge: 0x828995,
  paper: 0xe8d8ae,
  neonLime: 0xb5ff4d,
  neonPurple: 0xd783ff,
  electricBlue: 0x63d9ff,
  danger: 0xff6378,
  gold: 0xffd46a,
} as const;

const RARITY_VISUALS: Readonly<Record<Rarity, RarityVisualToken>> = {
  common: { fill: 0x34343b, mid: 0x55545d, stroke: 0xb9b5aa, accent: 0xd9d4c8, text: '#f2eee4', label: 'COMMON' },
  uncommon: { fill: 0x263528, mid: 0x3f5b3e, stroke: 0x94df68, accent: 0xc4ff9b, text: '#eaffdb', label: 'UNCOMMON' },
  rare: { fill: 0x203448, mid: 0x315979, stroke: 0x63b9ff, accent: 0x9ed5ff, text: '#e7f5ff', label: 'RARE' },
  epic: { fill: 0x402743, mid: 0x6a3c70, stroke: 0xd87bff, accent: 0xf1b4ff, text: '#fff0ff', label: 'EPIC' },
};

const VISUAL_TAG_PRIORITY: readonly ItemTag[] = [
  'cat', 'duck', 'pet', 'laser', 'poison', 'slime', 'magnet', 'antenna', 'battery', 'weapon', 'food', 'chaos', 'metal', 'device',
];

export function rarityVisual(rarity: Rarity): RarityVisualToken {
  return RARITY_VISUALS[rarity];
}

export function primaryVisualTag(definition: Pick<ItemDefinition, 'tags'>): ItemTag {
  for (const tag of VISUAL_TAG_PRIORITY) if (definition.tags.includes(tag)) return tag;
  return definition.tags[0] ?? 'device';
}

export function itemArtKey(definitionId: string): string {
  return `item.${definitionId}`;
}

export function stableItemAccent(definitionId: string): number {
  let hash = 2166136261;
  for (let index = 0; index < definitionId.length; index += 1) {
    hash ^= definitionId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const accents = [0xffcc62, 0xff7d8e, 0x72e5ff, 0xbdff69, 0xe88cff, 0x9da8ff] as const;
  return accents[(hash >>> 0) % accents.length]!;
}
