export interface RuntimeAtlasDefinition {
  readonly textureKey: string;
  readonly imageUrl: string;
  readonly dataUrl: string;
  readonly framePrefix: 'item' | 'hero' | 'boss' | 'ui';
}

export const ITEM_ATLAS_TEXTURE_KEY = 'junk-items';
export const PORTRAIT_ATLAS_TEXTURE_KEY = 'junk-portraits';
export const UI_ATLAS_TEXTURE_KEY = 'junk-ui';

export const RUNTIME_ATLASES: readonly RuntimeAtlasDefinition[] = [
  {
    textureKey: ITEM_ATLAS_TEXTURE_KEY,
    imageUrl: '/assets/atlas/junk-items.svg',
    dataUrl: '/assets/atlas/junk-items.json',
    framePrefix: 'item',
  },
  {
    textureKey: PORTRAIT_ATLAS_TEXTURE_KEY,
    imageUrl: '/assets/atlas/junk-portraits.svg',
    dataUrl: '/assets/atlas/junk-portraits.json',
    framePrefix: 'hero',
  },
  {
    textureKey: UI_ATLAS_TEXTURE_KEY,
    imageUrl: '/assets/atlas/junk-ui.svg',
    dataUrl: '/assets/atlas/junk-ui.json',
    framePrefix: 'ui',
  },
] as const;

export function atlasTextureKeyForArtKey(artKey: string): string | null {
  if (artKey.startsWith('item.')) return ITEM_ATLAS_TEXTURE_KEY;
  if (artKey.startsWith('hero.') || artKey.startsWith('boss.')) return PORTRAIT_ATLAS_TEXTURE_KEY;
  if (artKey.startsWith('ui.')) return UI_ATLAS_TEXTURE_KEY;
  return null;
}
