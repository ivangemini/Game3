import * as Phaser from 'phaser';

export const PRODUCTION_PLATE_KEY = 'junkpack-production-plate';

export type ProductionPlateRegion = 'backpack' | 'boss' | 'full';

export interface ProductionPlateOptions {
  readonly region?: ProductionPlateRegion;
  readonly depth?: number;
  readonly alpha?: number;
  readonly angle?: number;
  readonly flipX?: boolean;
  readonly flipY?: boolean;
  readonly tint?: number;
}

const REGIONS: Record<Exclude<ProductionPlateRegion, 'full'>, readonly [number, number, number, number]> = {
  backpack: [68, 36, 270, 248],
  boss: [392, 58, 240, 238],
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

  const image = scene.add.image(x, y, PRODUCTION_PLATE_KEY)
    .setDisplaySize(width, height)
    .setDepth(options.depth ?? 0)
    .setAlpha(options.alpha ?? 1)
    .setAngle(options.angle ?? 0)
    .setFlip(options.flipX ?? false, options.flipY ?? false);

  const region = options.region ?? 'full';
  if (region !== 'full') image.setCrop(...REGIONS[region]);
  if (options.tint !== undefined) image.setTint(options.tint);
  return image;
}
