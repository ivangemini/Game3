import * as Phaser from 'phaser';
import { createMaterialSurface } from './materialSurface';
import { PANEL_VISUALS } from './visualTokens';

/** Decorative leather/scrap shell around the deterministic backpack grid. */
export class BackpackSkin {
  constructor(
    scene: Phaser.Scene,
    gridLeft: number,
    gridTop: number,
    widthCells = 6,
    heightCells = 5,
    cellSize = 76,
  ) {
    const width = widthCells * cellSize;
    const height = heightCells * cellSize;
    const cx = gridLeft + width / 2;
    const cy = gridTop + height / 2;

    scene.add.rectangle(cx + 7, cy + 10, width + 64, height + 66, PANEL_VISUALS.ink, 0.6)
      .setDepth(-4);
    scene.add.rectangle(cx, cy, width + 58, height + 58, PANEL_VISUALS.leatherDark, 1)
      .setStrokeStyle(8, PANEL_VISUALS.leatherEdge)
      .setDepth(-3);
    scene.add.rectangle(cx, cy, width + 42, height + 42, PANEL_VISUALS.leather, 1)
      .setStrokeStyle(3, 0xc08a62, 0.6)
      .setDepth(-2);

    createMaterialSurface(scene, {
      x: cx,
      y: cy,
      width: width + 38,
      height: height + 38,
      kind: 'leather',
      seed: `backpack:${widthCells}x${heightCells}:${cellSize}`,
      depth: -1.6,
      alpha: 0.95,
    });

    const cornerScuffs = scene.add.graphics().setDepth(-1.4);
    cornerScuffs.lineStyle(3, 0xe2b087, 0.18);
    cornerScuffs.lineBetween(gridLeft - 11, gridTop + 19, gridLeft + 24, gridTop - 10);
    cornerScuffs.lineBetween(gridLeft + width - 19, gridTop + height + 10, gridLeft + width + 11, gridTop + height - 16);
    cornerScuffs.lineStyle(2, 0x17100f, 0.32);
    cornerScuffs.lineBetween(gridLeft - 10, gridTop + height - 20, gridLeft + 18, gridTop + height + 9);
    cornerScuffs.lineBetween(gridLeft + width - 25, gridTop - 9, gridLeft + width + 10, gridTop + 15);

    // Worn seams keep the frame tactile without adding another texture request.
    const seam = scene.add.graphics().setDepth(-1);
    seam.lineStyle(2, 0xd6a47b, 0.36);
    seam.strokeRoundedRect(gridLeft - 14, gridTop - 14, width + 28, height + 28, 8);
    seam.lineStyle(1, 0x1b1414, 0.65);
    seam.strokeRoundedRect(gridLeft - 8, gridTop - 8, width + 16, height + 16, 6);

    const stitch = scene.add.graphics().setDepth(-0.9);
    stitch.lineStyle(2, 0xe5bd91, 0.28);
    const stitchStep = 22;
    for (let x = gridLeft + 6; x < gridLeft + width - 4; x += stitchStep) {
      stitch.lineBetween(x, gridTop - 13, Math.min(x + 9, gridLeft + width - 5), gridTop - 13);
      stitch.lineBetween(x, gridTop + height + 13, Math.min(x + 9, gridLeft + width - 5), gridTop + height + 13);
    }
    for (let y = gridTop + 6; y < gridTop + height - 4; y += stitchStep) {
      stitch.lineBetween(gridLeft - 13, y, gridLeft - 13, Math.min(y + 9, gridTop + height - 5));
      stitch.lineBetween(gridLeft + width + 13, y, gridLeft + width + 13, Math.min(y + 9, gridTop + height - 5));
    }

    const rivets = [
      [gridLeft - 18, gridTop - 18],
      [gridLeft + width + 18, gridTop - 18],
      [gridLeft - 18, gridTop + height + 18],
      [gridLeft + width + 18, gridTop + height + 18],
    ] as const;
    for (const [x, y] of rivets) {
      scene.add.circle(x, y, 7, PANEL_VISUALS.scrap, 1)
        .setStrokeStyle(2, PANEL_VISUALS.scrapEdge)
        .setDepth(0);
      scene.add.circle(x - 2, y - 2, 2, 0xd8dde5, 0.65).setDepth(0);
    }

    // Side straps visually explain that this is a physical bag, not a dashboard grid.
    scene.add.rectangle(gridLeft - 31, cy, 18, height * 0.58, 0x6f493b, 1)
      .setStrokeStyle(3, 0x2a1b19).setDepth(-1);
    scene.add.rectangle(gridLeft + width + 31, cy, 18, height * 0.58, 0x6f493b, 1)
      .setStrokeStyle(3, 0x2a1b19).setDepth(-1);

    const strapWear = scene.add.graphics().setDepth(-0.8);
    strapWear.lineStyle(2, 0xcf946e, 0.22);
    for (const strapX of [gridLeft - 31, gridLeft + width + 31]) {
      strapWear.lineBetween(strapX - 5, cy - height * 0.2, strapX + 5, cy - height * 0.14);
      strapWear.lineBetween(strapX + 4, cy + height * 0.08, strapX - 5, cy + height * 0.15);
    }
  }
}
