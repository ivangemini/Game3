import { describe, expect, it } from 'vitest';
import { PROTOTYPE_FUSION_ITEMS, PROTOTYPE_ITEMS, PROTOTYPE_SHOP_ITEMS } from '../src/game/data/items';
import { SECOND_STAGE_FUSION_RESULT_IDS } from '../src/game/data/fusionRecipes';
import {
  AUTHORED_ART_ASSETS,
  bossArtKeyForEnemyId,
  hasAuthoredArt,
  heroArtKey,
  uiArtKey,
} from '../src/game/ui/authoredArt';

const REQUIRED_UI_IDS = [
  'daily', 'archive', 'trophies', 'help', 'settings', 'reset', 'coin', 'fusion', 'pocket', 'logo-mark',
  'contract', 'stamp',
] as const;

describe('authored art contract', () => {
  it('ships authored art for all items, heroes, bosses and the core UI icon set', () => {
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'item')).toHaveLength(60);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'hero')).toHaveLength(4);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'boss')).toHaveLength(6);
    expect(AUTHORED_ART_ASSETS.filter((asset) => asset.kind === 'ui')).toHaveLength(12);
    expect(new Set(AUTHORED_ART_ASSETS.map((asset) => asset.key)).size).toBe(AUTHORED_ART_ASSETS.length);
    expect(new Set(AUTHORED_ART_ASSETS.map((asset) => asset.url)).size).toBe(AUTHORED_ART_ASSETS.length);
  });

  it('keeps authored item assets exactly aligned with the live item catalog', () => {
    const itemAssets = AUTHORED_ART_ASSETS.filter((entry) => entry.kind === 'item');
    const liveIds = new Set(PROTOTYPE_ITEMS.map((item) => item.id));
    const authoredIds = new Set<string>();

    for (const asset of itemAssets) {
      expect(asset.key.startsWith('item.')).toBe(true);
      const definitionId = asset.key.slice('item.'.length);
      authoredIds.add(definitionId);
      expect(asset.url).toBe(`/assets/art/items/${definitionId}.svg`);
      expect(liveIds.has(definitionId), `authored art points at missing item ${definitionId}`).toBe(true);
    }

    expect(authoredIds).toEqual(liveIds);
    expect(itemAssets).toHaveLength(PROTOTYPE_ITEMS.length);
    expect(hasAuthoredArt('item.laser-cat')).toBe(true);
    expect(hasAuthoredArt('item.thunder-rail-mop')).toBe(true);
    expect(hasAuthoredArt('item.nonexistent-junk')).toBe(false);
  });

  it('covers every shop item, fusion result and secret second-stage evolution', () => {
    for (const item of PROTOTYPE_SHOP_ITEMS) {
      expect(hasAuthoredArt(`item.${item.id}`), `shop item ${item.id} should have authored art`).toBe(true);
    }
    for (const item of PROTOTYPE_FUSION_ITEMS) {
      expect(hasAuthoredArt(`item.${item.id}`), `fusion item ${item.id} should have authored art`).toBe(true);
    }
    for (const id of SECOND_STAGE_FUSION_RESULT_IDS) {
      expect(hasAuthoredArt(`item.${id}`), `second-stage ${id} should have authored art`).toBe(true);
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

  it('keeps all core UI art on stable ui.* keys with standalone fallback sources', () => {
    for (const id of REQUIRED_UI_IDS) {
      const key = uiArtKey(id);
      expect(key).toBe(`ui.${id}`);
      expect(hasAuthoredArt(key), `${key} should have authored UI art`).toBe(true);
      const asset = AUTHORED_ART_ASSETS.find((entry) => entry.key === key);
      expect(asset?.url).toBe(`/assets/art/ui/${id}.svg`);
    }
  });
});
