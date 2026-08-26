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

    scene.add.rectangle(cx + 9, cy + 13, width + 74, height + 78, PANEL_VISUALS.ink, 0.72)
      .setDepth(-4.4);
    scene.add.rectangle(cx, cy, width + 66, height + 68, PANEL_VISUALS.leatherDark, 1)
      .setStrokeStyle(9, 0x2a1917)
      .setDepth(-4);
    scene.add.rectangle(cx, cy, width + 58, height + 58, PANEL_VISUALS.leather, 1)
      .setStrokeStyle(7, PANEL_VISUALS.leatherEdge)
      .setDepth(-3);
    scene.add.rectangle(cx, cy, width + 42, height + 42, 0x46312d, 1)
      .setStrokeStyle(3, 0xc08a62, 0.62)
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

    // Heavy carry handle: the bag should read as a physical object before the grid is parsed.
    scene.add.rectangle(cx + 4, gridTop - 47, 188, 48, 0x08090c, 0.66)
      .setStrokeStyle(3, 0x08090c, 0.7)
      .setDepth(-3.8);
    scene.add.rectangle(cx, gridTop - 51, 184, 46, 0x6c493d, 1)
      .setStrokeStyle(6, 0x291b19)
      .setDepth(-3.2);
    createMaterialSurface(scene, {
      x: cx,
      y: gridTop - 51,
      width: 166,
      height: 30,
      kind: 'leather',
      seed: 'backpack-handle',
      depth: -3,
      alpha: 0.8,
    });
    scene.add.rectangle(cx, gridTop - 50, 114, 18, 0x171316, 1)
      .setStrokeStyle(2, 0xb07a58, 0.48)
      .setDepth(-2.8);

    const fieldTag = scene.add.rectangle(cx, gridTop - 29, 224, 31, 0x181315, 0.96)
      .setStrokeStyle(3, 0xb77c54)
      .setDepth(1.1);
    fieldTag.setAngle(-0.6);
    scene.add.text(cx, gridTop - 29, 'JUNKPACK // FIELD BAG', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '13px',
      color: '#f2d1a5',
      stroke: '#140c0a',
      strokeThickness: 4,
    }).setOrigin(0.5).setAngle(-0.6).setDepth(1.2);

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
      scene.add.circle(x, y, 8, 0x20232a, 1)
        .setStrokeStyle(3, PANEL_VISUALS.scrapEdge)
        .setDepth(0);
      scene.add.circle(x, y, 5, PANEL_VISUALS.scrap, 1).setDepth(0.1);
      scene.add.circle(x - 2, y - 2, 2, 0xd8dde5, 0.65).setDepth(0.2);
    }

    // Side straps and buckles sell the suitcase silhouette instead of a floating dashboard grid.
    scene.add.rectangle(gridLeft - 31, cy, 20, height * 0.62, 0x6f493b, 1)
      .setStrokeStyle(3, 0x2a1b19).setDepth(-1);
    scene.add.rectangle(gridLeft + width + 31, cy, 20, height * 0.62, 0x6f493b, 1)
      .setStrokeStyle(3, 0x2a1b19).setDepth(-1);

    const strapWear = scene.add.graphics().setDepth(-0.8);
    strapWear.lineStyle(2, 0xcf946e, 0.22);
    for (const strapX of [gridLeft - 31, gridLeft + width + 31]) {
      strapWear.lineBetween(strapX - 5, cy - height * 0.2, strapX + 5, cy - height * 0.14);
      strapWear.lineBetween(strapX + 4, cy + height * 0.08, strapX - 5, cy + height * 0.15);
      scene.add.rectangle(strapX, cy - 58, 27, 34, 0x30343c, 1)
        .setStrokeStyle(3, 0x9aa1ad, 0.7)
        .setDepth(0.3);
      scene.add.rectangle(strapX, cy - 58, 13, 20, 0x191b20, 1)
        .setStrokeStyle(1, 0xc6ccd4, 0.45)
        .setDepth(0.4);
    }

    // Bottom latches visually secure the unlockable pocket row.
    for (const latchX of [cx - 82, cx + 82]) {
      scene.add.rectangle(latchX + 3, gridTop + height + 31, 54, 30, 0x08090b, 0.6).setDepth(-0.2);
      scene.add.rectangle(latchX, gridTop + height + 27, 52, 28, 0x3d424c, 1)
        .setStrokeStyle(3, 0x929aa7)
        .setDepth(0.2);
      scene.add.rectangle(latchX, gridTop + height + 27, 22, 12, 0x17191e, 1)
        .setStrokeStyle(1, 0xd0d5dc, 0.45)
        .setDepth(0.3);
    }
  }
}
