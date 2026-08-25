import * as Phaser from 'phaser';
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

    // Worn seams keep the frame tactile without requiring texture assets.
    const seam = scene.add.graphics().setDepth(-1);
    seam.lineStyle(2, 0xd6a47b, 0.36);
    seam.strokeRoundedRect(gridLeft - 14, gridTop - 14, width + 28, height + 28, 8);
    seam.lineStyle(1, 0x1b1414, 0.65);
    seam.strokeRoundedRect(gridLeft - 8, gridTop - 8, width + 16, height + 16, 6);

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
  }
}
