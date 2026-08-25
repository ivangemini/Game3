export interface Cell {
  readonly x: number;
  readonly y: number;
}

export type ItemTag =
  | 'weapon'
  | 'device'
  | 'battery'
  | 'poison'
  | 'metal'
  | 'pet'
  | 'cat'
  | 'duck'
  | 'laser'
  | 'magnet'
  | 'chaos'
  | 'food'
  | 'antenna'
  | 'slime';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly shape: readonly Cell[];
  readonly tags: readonly ItemTag[];
  readonly rarity: Rarity;
  readonly description: string;
}

export interface PlacedItem {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly origin: Cell;
  readonly rotation: 0 | 1 | 2 | 3;
}
