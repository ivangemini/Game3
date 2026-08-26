import * as Phaser from 'phaser';
import { atlasTextureKeyForArtKey } from '../assets/atlasContract';
import { addProductionPlate } from './productionPlate';

export interface AuthoredArtAsset {
  readonly key: string;
  readonly url: string;
  readonly kind: 'item' | 'hero' | 'boss' | 'ui';
}

export interface AuthoredTextureRef {
  readonly textureKey: string;
  readonly frame?: string;
}

const ITEM_IDS = [
  'laser-cat', 'angry-battery', 'cursed-toaster', 'mutant-duck', 'toxic-fan', 'fish-blaster',
  'poison-flask', 'scrap-magnet', 'tactical-banana', 'pocket-radio', 'slime-can', 'wrench-sword',
  'battery-snail', 'disco-orb', 'panic-noodles', 'feral-router', 'alarm-hamster', 'toxic-umbrella',
  'satellite-fork', 'canned-lightning', 'slime-donut', 'catellite-dish', 'emergency-microwave', 'laser-mop',
  'shock-toaster', 'cyber-cat', 'biohazard-turbine', 'polarity-duck', 'toxic-fish-cannon', 'gravity-toaster',
  'turbo-router', 'slime-sword', 'laser-banana', 'radio-duck', 'noodle-fan', 'disco-snail',
  'reactor-hamster', 'acid-parasol', 'broadcast-trident', 'storm-disco', 'bio-snack-pack', 'orbital-cat',
  'apocalypse-microwave', 'rail-mop', 'fermented-gamepad', 'magnet-croissant', 'slime-pager', 'battery-pigeon',
  'duck-drill', 'cat-battery-pack', 'poison-printer', 'laser-kettle', 'chaos-stapler', 'antenna-sausage',
  'slime-magnet', 'feral-roomba', 'singularity-toaster', 'cataclysm-satellite', 'plague-picnic', 'thunder-rail-mop',
] as const;

const HERO_IDS = ['scavenger', 'engineer', 'alchemist', 'beastfriend'] as const;
const BOSS_IDS = [
  'tv-tyrant', 'deadline-snail', 'closet-monster', 'baby-moon', 'copycat-auditor', 'border-shark',
] as const;
const UI_IDS = [
  'daily', 'archive', 'trophies', 'help', 'settings', 'reset', 'coin', 'fusion', 'pocket', 'logo-mark',
  'contract', 'stamp', 'world5-audit', 'world6-edge', 'mastery', 'grudge',
] as const;

export const AUTHORED_ART_ASSETS: readonly AuthoredArtAsset[] = [
  ...ITEM_IDS.map((id) => ({ key: `item.${id}`, url: `/assets/art/items/${id}.svg`, kind: 'item' as const })),
  ...HERO_IDS.map((id) => ({ key: `hero.${id}`, url: `/assets/art/heroes/${id}.svg`, kind: 'hero' as const })),
  ...BOSS_IDS.map((id) => ({ key: `boss.${id}`, url: `/assets/art/bosses/${id}.svg`, kind: 'boss' as const })),
  ...UI_IDS.map((id) => ({ key: `ui.${id}`, url: `/assets/art/ui/${id}.svg`, kind: 'ui' as const })),
];

const ASSET_BY_KEY = new Map(AUTHORED_ART_ASSETS.map((asset) => [asset.key, asset]));
const pending = new Map<string, Promise<HTMLImageElement | null>>();

export function heroArtKey(heroId: string): string {
  return `hero.${heroId}`;
}

export function uiArtKey(id: string): string {
  return `ui.${id}`;
}

export function bossArtKeyForEnemyId(enemyId: string): string | null {
  for (const bossId of BOSS_IDS) {
    if (enemyId === bossId || enemyId.endsWith(`-${bossId}`)) return `boss.${bossId}`;
  }
  return null;
}

export function hasAuthoredArt(key: string): boolean {
  return ASSET_BY_KEY.has(key);
}

export function resolveAuthoredTexture(scene: Phaser.Scene, key: string): AuthoredTextureRef | null {
  const atlasKey = atlasTextureKeyForArtKey(key);
  if (atlasKey && scene.textures.exists(atlasKey)) {
    const atlas = scene.textures.get(atlasKey);
    if (atlas.has(key)) return { textureKey: atlasKey, frame: key };
  }
  if (scene.textures.exists(key)) return { textureKey: key };
  return null;
}

export function requestAuthoredTexture(
  scene: Phaser.Scene,
  key: string,
  onReady?: () => void,
): boolean {
  if (resolveAuthoredTexture(scene, key)) {
    onReady?.();
    return true;
  }
  const asset = ASSET_BY_KEY.get(key);
  if (!asset || typeof Image === 'undefined') return false;

  let promise = pending.get(key);
  if (!promise) {
    promise = loadImage(asset.url);
    pending.set(key, promise);
  }

  void promise.then((image) => {
    if (!image || !scene.sys?.isActive()) return;
    if (!scene.textures.exists(key)) scene.textures.addImage(key, image);
    onReady?.();
  });
  return true;
}

export function createAuthoredPortraitSlot(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y).setDepth(depth);
  const plate = scene.add.rectangle(0, 0, width, height, 0x171820, 0.82).setStrokeStyle(3, 0x625c6b);
  const painted = key.startsWith('hero.')
    ? addProductionPlate(scene, 0, 0, width - 6, height - 6, {
      region: 'hero',
      alpha: key.endsWith('scavenger') ? 0.72 : 0.3,
      flipX: key.endsWith('alchemist') || key.endsWith('beastfriend'),
      tint: key.endsWith('engineer') ? 0xd9f6ff : key.endsWith('alchemist') ? 0xf3ddff : 0xecffd8,
    })
    : null;
  const mark = scene.add.text(0, 0, 'JUNK\nPORTRAIT', {
    fontSize: '12px', color: '#77717f', align: 'center', fontStyle: 'bold',
  }).setOrigin(0.5);
  root.add([plate]);
  if (painted) {
    painted.setPosition(0, 0).setDepth(0);
    root.add(painted);
  }
  root.add(mark);

  const render = (): void => {
    if (!root.active) return;
    const texture = resolveAuthoredTexture(scene, key);
    if (!texture) return;
    mark.destroy();
    if (root.getByName('authored-portrait')) return;
    const image = scene.add.image(0, 0, texture.textureKey, texture.frame)
      .setDisplaySize(width - 8, height - 8)
      .setName('authored-portrait');
    if (key === 'hero.scavenger' && painted) image.setAlpha(0.42);
    root.add(image);
  };

  if (resolveAuthoredTexture(scene, key)) render();
  else requestAuthoredTexture(scene, key, render);
  return root;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}
