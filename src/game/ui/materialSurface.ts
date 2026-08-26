import * as Phaser from 'phaser';
import { addProductionPlate, type ProductionPlateRegion } from './productionPlate';

export type MaterialSurfaceKind = 'leather' | 'scrap' | 'paper' | 'screen';

export interface MaterialSurfaceOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly kind: MaterialSurfaceKind;
  readonly seed: string;
  readonly depth?: number;
  readonly alpha?: number;
}

/**
 * Lightweight deterministic material detail for UI surfaces.
 *
 * Large legacy panels also receive a low-alpha crop from the approved painted
 * Junkpack reference. That makes Daily/Weekly/Archive/settings surfaces inherit
 * the production material language automatically while these deterministic
 * marks remain the cheap wear/fallback layer. Screens that already place their
 * own authored raster plate are explicitly excluded to avoid double texturing.
 */
export function createMaterialSurface(
  scene: Phaser.Scene,
  options: MaterialSurfaceOptions,
): Phaser.GameObjects.Graphics {
  addInheritedPaintedMaterial(scene, options);

  const graphics = scene.add.graphics();
  graphics.setPosition(options.x, options.y);
  graphics.setDepth(options.depth ?? 0);
  graphics.setAlpha(options.alpha ?? 1);

  const random = seededRandom(options.seed);
  const left = -options.width / 2;
  const top = -options.height / 2;
  const inset = Math.max(5, Math.min(options.width, options.height) * 0.035);
  const minX = left + inset;
  const maxX = left + options.width - inset;
  const minY = top + inset;
  const maxY = top + options.height - inset;

  switch (options.kind) {
    case 'leather': {
      graphics.lineStyle(1, 0xe0b28b, 0.13);
      for (let index = 0; index < 16; index += 1) {
        const x = between(random, minX, maxX);
        const y = between(random, minY, maxY);
        const length = between(random, 8, 28);
        const rise = between(random, -4, 4);
        graphics.beginPath();
        graphics.moveTo(x - length / 2, y);
        graphics.lineTo(x, y + rise);
        graphics.lineTo(x + length / 2, y + rise * 0.35);
        graphics.strokePath();
      }
      graphics.fillStyle(0x1b1110, 0.14);
      for (let index = 0; index < 10; index += 1) {
        graphics.fillCircle(
          between(random, minX, maxX),
          between(random, minY, maxY),
          between(random, 1, 2.4),
        );
      }
      break;
    }
    case 'scrap': {
      for (let index = 0; index < 13; index += 1) {
        const x = between(random, minX, maxX);
        const y = between(random, minY, maxY);
        const length = between(random, 10, 34);
        graphics.lineStyle(index % 3 === 0 ? 2 : 1, index % 2 === 0 ? 0xaab0ba : 0x101116, index % 3 === 0 ? 0.12 : 0.17);
        graphics.lineBetween(x, y, x + length, y + between(random, -7, 7));
      }
      graphics.fillStyle(0xd8dde5, 0.09);
      for (let index = 0; index < 6; index += 1) {
        graphics.fillCircle(between(random, minX, maxX), between(random, minY, maxY), between(random, 1, 2));
      }
      break;
    }
    case 'paper': {
      graphics.lineStyle(1, 0x6e563c, 0.14);
      for (let index = 0; index < 11; index += 1) {
        const x = between(random, minX, maxX);
        const y = between(random, minY, maxY);
        graphics.lineBetween(x, y, x + between(random, 3, 12), y + between(random, -3, 3));
      }
      graphics.fillStyle(0xffffff, 0.055);
      for (let index = 0; index < 7; index += 1) {
        graphics.fillCircle(between(random, minX, maxX), between(random, minY, maxY), between(random, 0.8, 1.8));
      }
      break;
    }
    case 'screen': {
      graphics.lineStyle(1, 0x9ff8d0, 0.06);
      const step = Math.max(4, Math.floor(options.height / 28));
      for (let y = Math.ceil(minY); y <= maxY; y += step) {
        graphics.lineBetween(minX, y, maxX, y);
      }
      graphics.lineStyle(1, 0xd783ff, 0.065);
      for (let index = 0; index < 5; index += 1) {
        const y = between(random, minY, maxY);
        const width = between(random, options.width * 0.08, options.width * 0.24);
        const x = between(random, minX, Math.max(minX, maxX - width));
        graphics.lineBetween(x, y, x + width, y);
      }
      break;
    }
  }

  return graphics;
}

function addInheritedPaintedMaterial(scene: Phaser.Scene, options: MaterialSurfaceOptions): void {
  if (options.width < 140 || options.height < 70) return;
  if (/^(backpack:|boss-|boss-portrait:|hero-choice:|perk-choice:|shop-|fusion-lab:)/.test(options.seed)) return;

  const region: ProductionPlateRegion = options.kind === 'leather'
    ? 'backpack'
    : options.kind === 'paper'
      ? 'perk'
      : options.kind === 'screen'
        ? 'boss'
        : 'stage';
  const baseAlpha = options.kind === 'paper' ? 0.22 : options.kind === 'leather' ? 0.2 : 0.16;
  addProductionPlate(scene, options.x, options.y, options.width, options.height, {
    region,
    depth: (options.depth ?? 0) - 0.05,
    alpha: baseAlpha * Math.min(1, Math.max(0.42, options.alpha ?? 1)),
    flipX: hashParity(options.seed) === 1,
  });
}

function hashParity(seed: string): 0 | 1 {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  return (Math.abs(hash) % 2) as 0 | 1;
}

function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  state >>>= 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, min: number, max: number): number {
  return min + (max - min) * random();
}
