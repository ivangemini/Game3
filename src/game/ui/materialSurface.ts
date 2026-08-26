import * as Phaser from 'phaser';

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
 * Lightweight deterministic material detail for large UI surfaces.
 * Geometry is authored in local coordinates so callers can safely rotate/scale the result.
 * The marks stay deliberately sparse so gameplay silhouettes and text remain dominant.
 */
export function createMaterialSurface(
  scene: Phaser.Scene,
  options: MaterialSurfaceOptions,
): Phaser.GameObjects.Graphics {
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
      graphics.lineStyle(1, 0xe0b28b, 0.16);
      for (let index = 0; index < 20; index += 1) {
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
      graphics.fillStyle(0x1b1110, 0.18);
      for (let index = 0; index < 14; index += 1) {
        graphics.fillCircle(
          between(random, minX, maxX),
          between(random, minY, maxY),
          between(random, 1, 2.4),
        );
      }
      break;
    }
    case 'scrap': {
      for (let index = 0; index < 16; index += 1) {
        const x = between(random, minX, maxX);
        const y = between(random, minY, maxY);
        const length = between(random, 10, 34);
        graphics.lineStyle(index % 3 === 0 ? 2 : 1, index % 2 === 0 ? 0xaab0ba : 0x101116, index % 3 === 0 ? 0.15 : 0.22);
        graphics.lineBetween(x, y, x + length, y + between(random, -7, 7));
      }
      graphics.fillStyle(0xd8dde5, 0.12);
      for (let index = 0; index < 8; index += 1) {
        graphics.fillCircle(between(random, minX, maxX), between(random, minY, maxY), between(random, 1, 2));
      }
      break;
    }
    case 'paper': {
      graphics.lineStyle(1, 0x6e563c, 0.18);
      for (let index = 0; index < 14; index += 1) {
        const x = between(random, minX, maxX);
        const y = between(random, minY, maxY);
        graphics.lineBetween(x, y, x + between(random, 3, 12), y + between(random, -3, 3));
      }
      graphics.fillStyle(0xffffff, 0.07);
      for (let index = 0; index < 10; index += 1) {
        graphics.fillCircle(between(random, minX, maxX), between(random, minY, maxY), between(random, 0.8, 1.8));
      }
      break;
    }
    case 'screen': {
      graphics.lineStyle(1, 0x9ff8d0, 0.075);
      const step = Math.max(4, Math.floor(options.height / 28));
      for (let y = Math.ceil(minY); y <= maxY; y += step) {
        graphics.lineBetween(minX, y, maxX, y);
      }
      graphics.lineStyle(1, 0xd783ff, 0.08);
      for (let index = 0; index < 6; index += 1) {
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
