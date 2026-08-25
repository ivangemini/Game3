import { describe, expect, it } from 'vitest';
import {
  AUTHORED_ART_ASSETS,
  bossArtKeyForEnemyId,
  hasAuthoredArt,
  heroArtKey,
} from '../src/game/ui/authoredArt';

describe('authored art contract', () => {
  it('ships 12 item assets, four hero portraits and all six boss portraits with unique stable keys', () => {
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'item')).toHaveLength(12);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'hero')).toHaveLength(4);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'boss')).toHaveLength(6);
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

  it('maps heroes and every campaign/corrupted boss family to stable portrait keys', () => {
    expect(heroArtKey('scavenger')).toBe('hero.scavenger');

    const bosses = [
      'tv-tyrant',
      'deadline-snail',
      'closet-monster',
      'baby-moon',
      'copycat-auditor',
      'border-shark',
    ] as const;
    for (const boss of bosses) {
      expect(bossArtKeyForEnemyId(boss)).toBe(`boss.${boss}`);
      expect(bossArtKeyForEnemyId(`loop-4-${boss}`)).toBe(`boss.${boss}`);
      expect(hasAuthoredArt(`boss.${boss}`)).toBe(true);
    }
    expect(bossArtKeyForEnemyId('static-rats')).toBeNull();
  });
});
