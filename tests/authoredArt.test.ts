import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_ITEMS, PROTOTYPE_ITEMS } from '../src/game/data/items';
import {
  AUTHORED_ART_ASSETS,
  bossArtKeyForEnemyId,
  hasAuthoredArt,
  heroArtKey,
} from '../src/game/ui/authoredArt';

const WAVE_2_FUSION_IDS = [
  'shock-toaster',
  'cyber-cat',
  'biohazard-turbine',
  'polarity-duck',
  'toxic-fish-cannon',
  'gravity-toaster',
  'turbo-router',
  'slime-sword',
] as const;

describe('authored art contract', () => {
  it('ships 32 item assets, four hero portraits and all six boss portraits with unique stable keys', () => {
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'item')).toHaveLength(32);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'hero')).toHaveLength(4);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'boss')).toHaveLength(6);
    expect(new Set(AUTHORED_ART_ASSETS.map((asset) => asset.key)).size).toBe(AUTHORED_ART_ASSETS.length);
    expect(new Set(AUTHORED_ART_ASSETS.map((asset) => asset.url)).size).toBe(AUTHORED_ART_ASSETS.length);
  });

  it('keeps authored item assets aligned with the live 60-item catalog and above 50 percent coverage', () => {
    const itemAssets = AUTHORED_ART_ASSETS.filter((entry) => entry.kind === 'item');
    const liveIds = new Set(PROTOTYPE_ITEMS.map((item) => item.id));

    for (const asset of itemAssets) {
      expect(asset.key.startsWith('item.')).toBe(true);
      const definitionId = asset.key.slice('item.'.length);
      expect(asset.url).toBe(`/assets/art/items/${definitionId}.svg`);
      expect(liveIds.has(definitionId), `authored art points at missing item ${definitionId}`).toBe(true);
    }

    expect(itemAssets.length / PROTOTYPE_ITEMS.length).toBeGreaterThanOrEqual(0.5);
    expect(hasAuthoredArt('item.laser-cat')).toBe(true);
    expect(hasAuthoredArt('item.nonexistent-junk')).toBe(false);
  });

  it('gives the eight wave-2 evolution rewards authored art and keeps them fusion-only', () => {
    const fusionIds = new Set(PROTOTYPE_FUSION_ITEMS.map((item) => item.id));
    for (const id of WAVE_2_FUSION_IDS) {
      expect(fusionIds.has(id), `${id} should remain fusion-only`).toBe(true);
      expect(hasAuthoredArt(`item.${id}`), `${id} should have authored art`).toBe(true);
    }
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
