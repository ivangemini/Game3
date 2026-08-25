import * as Phaser from 'phaser';

export interface AuthoredArtAsset {
  readonly key: string;
  readonly url: string;
  readonly kind: 'item' | 'hero' | 'boss';
}

const ITEM_IDS = [
  'laser-cat',
  'angry-battery',
  'cursed-toaster',
  'mutant-duck',
  'toxic-fan',
  'fish-blaster',
  'poison-flask',
  'scrap-magnet',
  'tactical-banana',
  'pocket-radio',
  'slime-can',
  'wrench-sword',
] as const;

const HERO_IDS = ['scavenger', 'engineer', 'alchemist', 'beastfriend'] as const;
const BOSS_IDS = [
  'tv-tyrant',
  'deadline-snail',
  'closet-monster',
  'baby-moon',
  'copycat-auditor',
  'border-shark',
] as const;

export const AUTHORED_ART_ASSETS: readonly AuthoredArtAsset[] = [
  ...ITEM_IDS.map((id) => ({ key: `item.${id}`, url: `/assets/art/items/${id}.svg`, kind: 'item' as const })),
  ...HERO_IDS.map((id) => ({ key: `hero.${id}`, url: `/assets/art/heroes/${id}.svg`, kind: 'hero' as const })),
  ...BOSS_IDS.map((id) => ({ key: `boss.${id}`, url: `/assets/art/bosses/${id}.svg`, kind: 'boss' as const })),
];

const ASSET_BY_KEY = new Map(AUTHORED_ART_ASSETS.map((asset) => [asset.key, asset]));
const pending = new Map<string, Promise<HTMLImageElement | null>>();

export function heroArtKey(heroId: string): string {
  return `hero.${heroId}`;
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

export function requestAuthoredTexture(
  scene: Phaser.Scene,
  key: string,
  onReady?: () => void,
): boolean {
  if (scene.textures.exists(key)) {
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
  const plate = scene.add.rectangle(0, 0, width, height, 0x171820, 1).setStrokeStyle(3, 0x625c6b);
  const mark = scene.add.text(0, 0, 'JUNK\nPORTRAIT', {
    fontSize: '12px', color: '#77717f', align: 'center', fontStyle: 'bold',
  }).setOrigin(0.5);
  root.add([plate, mark]);

  const render = (): void => {
    if (!root.active || !scene.textures.exists(key)) return;
    root.removeAll(true);
    const image = scene.add.image(0, 0, key).setDisplaySize(width, height);
    root.add(image);
  };

  if (scene.textures.exists(key)) render();
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
