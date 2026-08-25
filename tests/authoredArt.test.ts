import { describe, expect, it } from 'vitest';
import {
  AUTHORED_ART_ASSETS,
  bossArtKeyForEnemyId,
  hasAuthoredArt,
  heroArtKey,
} from '../src/game/ui/authoredArt';

describe('authored art wave 1 contract', () => {
  it('ships 12 item assets, four hero portraits and one boss portrait with unique stable keys', () => {
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'item')).toHaveLength(12);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'hero')).toHaveLength(4);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'boss')).toHaveLength(1);
    expect(new Set(AUTHORED_ART_ASSETS.map((asset) => asset.key)).size).toBe(AUTHORED_ART_ASSETS.length);
    expect(new Set(AUTHORED_ART_ASSETS.map((asset) => asset.url)).size).toBe(AUTHORED_ART_ASSETS.length);
  });

  it('keeps item paths and keys aligned with the atlas replacement contract', () => {
    for (const asset of AUTHORED_ART_ASSETS.filter((entry) => entry.kind === 'item')) {
      expect(asset.key.startsWith('item.')).toBe(true);
      expect(asset.url).toBe(`/assets/art/items/${asset.key.slice('item.'.length)}.svg`);
    }
    expect(hasAuthoredArt('item.laser-cat')).toBe(true);
    expect(hasAuthoredArt('item.nonexistent-junk')).toBe(false);
  });

  it('maps heroes and loop variants of TV Tyrant to stable portrait keys', () => {
    expect(heroArtKey('scavenger')).toBe('hero.scavenger');
    expect(bossArtKeyForEnemyId('tv-tyrant')).toBe('boss.tv-tyrant');
    expect(bossArtKeyForEnemyId('loop-2-tv-tyrant')).toBe('boss.tv-tyrant');
    expect(bossArtKeyForEnemyId('deadline-snail')).toBeNull();
  });
});
