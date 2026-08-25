import { describe, expect, it } from 'vitest';
import {
  ITEM_ATLAS_TEXTURE_KEY,
  PORTRAIT_ATLAS_TEXTURE_KEY,
  RUNTIME_ATLASES,
  UI_ATLAS_TEXTURE_KEY,
  atlasTextureKeyForArtKey,
} from '../src/game/assets/atlasContract';

describe('runtime atlas contract', () => {
  it('keeps exactly three portal-facing art atlas requests', () => {
    expect(RUNTIME_ATLASES).toHaveLength(3);
    expect(RUNTIME_ATLASES.map((atlas) => atlas.textureKey)).toEqual([
      ITEM_ATLAS_TEXTURE_KEY,
      PORTRAIT_ATLAS_TEXTURE_KEY,
      UI_ATLAS_TEXTURE_KEY,
    ]);
    expect(new Set(RUNTIME_ATLASES.flatMap((atlas) => [atlas.imageUrl, atlas.dataUrl])).size).toBe(6);
  });

  it('routes stable art keys to the correct atlas without changing frame keys', () => {
    expect(atlasTextureKeyForArtKey('item.laser-cat')).toBe(ITEM_ATLAS_TEXTURE_KEY);
    expect(atlasTextureKeyForArtKey('hero.scavenger')).toBe(PORTRAIT_ATLAS_TEXTURE_KEY);
    expect(atlasTextureKeyForArtKey('boss.tv-tyrant')).toBe(PORTRAIT_ATLAS_TEXTURE_KEY);
    expect(atlasTextureKeyForArtKey('ui.settings')).toBe(UI_ATLAS_TEXTURE_KEY);
    expect(atlasTextureKeyForArtKey('unknown.thing')).toBeNull();
  });

  it('uses generated public atlas URLs expected by the build pipeline', () => {
    for (const atlas of RUNTIME_ATLASES) {
      expect(atlas.imageUrl).toBe(`/assets/atlas/${atlas.textureKey}.svg`);
      expect(atlas.dataUrl).toBe(`/assets/atlas/${atlas.textureKey}.json`);
    }
  });
});
