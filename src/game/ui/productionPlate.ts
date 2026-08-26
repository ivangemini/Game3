import * as Phaser from 'phaser';

export const PRODUCTION_PLATE_KEY = 'junkpack-production-plate';

export type ProductionPlateRegion = 'hero' | 'backpack' | 'boss' | 'perk' | 'full';

export interface ProductionPlateOptions {
  readonly region?: ProductionPlateRegion;
  readonly depth?: number;
  readonly alpha?: number;
  readonly angle?: number;
  readonly flipX?: boolean;
  readonly flipY?: boolean;
  readonly tint?: number;
}

// Coordinates are authored against the approved 480×254 runtime plate derived
// from the original Junkpack concept. Keep these inside the source bounds so
// Chromium/Firefox/WebKit all receive valid WebGL crop rectangles.
const REGIONS: Record<Exclude<ProductionPlateRegion, 'full'>, readonly [number, number, number, number]> = {
  hero: [0, 16, 76, 176],
  backpack: [68, 30, 160, 165],
  boss: [280, 30, 195, 165],
  perk: [76, 197, 326, 55],
};

/**
 * Adds the approved painted production plate as a presentation layer.
 * Returns null when the raster texture is unavailable so authored atlas/SVG
 * fallbacks remain fully functional and gameplay rendering never blocks.
 */
export function addProductionPlate(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ProductionPlateOptions = {},
): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(PRODUCTION_PLATE_KEY)) return null;

  const image = scene.add.image(x, y, PRODUCTION_PLATE_KEY);
  const region = options.region ?? 'full';
  if (region !== 'full') image.setCrop(...REGIONS[region]);

  image
    .setDisplaySize(width, height)
    .setDepth(options.depth ?? 0)
    .setAlpha(options.alpha ?? 1)
    .setAngle(options.angle ?? 0)
    .setFlip(options.flipX ?? false, options.flipY ?? false);

  if (options.tint !== undefined) image.setTint(options.tint);
  return image;
}
