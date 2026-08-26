import * as Phaser from 'phaser';
import { createMaterialSurface } from '../ui/materialSurface';

const COMPACT_BREAKPOINT = 1050;
const SCAN_INTERVAL_MS = 220;

/**
 * Presentation-only cleanup for truthful top chrome and compact action legibility.
 * It owns no gameplay state and only adjusts already-rendered labels/decoration.
 */
export class RuntimeHudLegibilityScene extends Phaser.Scene {
  private target: Phaser.Scene | null = null;
  private marker: Phaser.GameObjects.Rectangle | null = null;
  private lastScanAt = -Infinity;

  constructor() {
    super('runtime-hud-legibility');
  }

  update(time: number): void {
    const target = this.scene.get('prototype');
    if (!target.sys.isActive()) return;
    if (this.target !== target || !this.marker?.active) this.install(target);
    if (time - this.lastScanAt < SCAN_INTERVAL_MS) return;
    this.lastScanAt = time;
    if (readDisplayWidth(target) < COMPACT_BREAKPOINT) this.boostCompactActions(target);
  }

  private install(scene: Phaser.Scene): void {
    this.target = scene;
    this.marker = scene.add.rectangle(-70, -70, 1, 1, 0x000000, 0)
      .setVisible(false)
      .setDepth(-1000);
    this.lastScanAt = -Infinity;

    // RuntimePresentationScene used to show a decorative fixed 96/100 HP value.
    // Cover that false state with a truthful loadout plate; real HP remains in CombatPanel.
    const plate = scene.add.rectangle(151, 73, 198, 46, 0x15171d, 1)
      .setStrokeStyle(2, 0x66544a, 0.9)
      .setDepth(6.35);
    const wear = createMaterialSurface(scene, {
      x: 151,
      y: 73,
      width: 186,
      height: 34,
      kind: 'scrap',
      seed: 'hud-truth:pilot-loadout',
      depth: 6.45,
      alpha: 0.68,
    });
    const armed = scene.add.text(151, 66, 'LOADOUT ARMED', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '14px', color: '#f5e7cc', stroke: '#0d0b0b', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6.7);
    const loop = scene.add.text(151, 84, 'PACK • LINK • FUSE • FIGHT', {
      fontSize: '8px', color: '#bcae9e', fontStyle: 'bold', letterSpacing: 0.6,
    }).setOrigin(0.5).setDepth(6.7);

    scene.events.once('shutdown', () => {
      if (this.target !== scene) return;
      plate.destroy();
      wear.destroy();
      armed.destroy();
      loop.destroy();
      this.marker = null;
      this.target = null;
    });
  }

  private boostCompactActions(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text) || !object.active) continue;
      const text = object.text.trim().toUpperCase();

      // Compact top utility rail: icon-first labels need to survive the 1600→1024 scale.
      if (object.y >= 94 && object.y <= 132 && object.x >= 980) {
        if (['DAILY', 'HELP', 'SET', 'DEX', 'TROPHY', 'NEW', 'AGAIN?', 'SURE?'].includes(text)) {
          object.setFontSize(14).setStroke('#090a0e', 4);
          continue;
        }
      }

      // Only primary gameplay verbs are boosted. Secondary metadata intentionally stays quiet.
      if (text.includes('START FIGHT')) {
        object.setFontSize(13).setStroke('#111018', 4);
        continue;
      }
      if (text === 'PACK IT' || text === 'PACKED') {
        object.setFontSize(12).setStroke('#10150e', 4);
        continue;
      }
      if (text.includes('FUSE IT')) {
        object.setFontSize(13).setStroke('#170a1b', 4);
        continue;
      }
      if (text === 'NEXT ›') {
        object.setFontSize(11).setStroke('#111218', 3);
        continue;
      }
      if (text.startsWith('↻ REROLL')) {
        object.setFontSize(12).setStroke('#17121b', 3);
      }
    }
  }
}

function readDisplayWidth(scene: Phaser.Scene): number {
  const parentWidth = scene.scale.parentSize?.width;
  if (typeof parentWidth === 'number' && Number.isFinite(parentWidth) && parentWidth > 0) return parentWidth;
  const canvasWidth = scene.game.canvas?.clientWidth;
  return typeof canvasWidth === 'number' && canvasWidth > 0 ? canvasWidth : 1600;
}
