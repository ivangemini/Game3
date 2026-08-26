import * as Phaser from 'phaser';
import { bossArtKeyForEnemyId, requestAuthoredTexture, resolveAuthoredTexture } from './authoredArt';
import { bossMotionSpecForArtKey, type BossMotionSpec } from './bossPresentation';
import { createMaterialSurface } from './materialSurface';
import { addProductionPlate } from './productionPlate';

export class BossPortraitLayer {
  private root: Phaser.GameObjects.Container | null = null;
  private activeKey: string | null = null;
  private activeSpec: BossMotionSpec | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly reducedMotion: boolean,
  ) {
    // CombatFeedback constructs this layer before CombatPanel. A presentation-only
    // raster strip at depth 20.15 therefore sits above the flat stage shell but
    // below enemies/HUD (21+), and the preparation veil (31+) still covers it.
    addProductionPlate(scene, 1140, 445, 744, 524, {
      region: 'stage',
      depth: 20.15,
      alpha: 0.34,
      tint: 0xcbd8c8,
    });
    scene.add.ellipse(1225, 520, 460, 78, 0x07080b, 0.32).setDepth(20.2);
    scene.events.once('shutdown', () => this.clear());
  }

  show(enemyId: string | undefined): void {
    this.clear();
    if (!enemyId) return;
    const key = bossArtKeyForEnemyId(enemyId);
    if (!key) return;
    this.activeKey = key;
    this.activeSpec = bossMotionSpecForArtKey(key);

    const render = (): void => {
      if (this.activeKey !== key || !this.scene.sys?.isActive()) return;
      const texture = resolveAuthoredTexture(this.scene, key);
      if (!texture) return;
      this.destroyRoot();
      const root = this.scene.add.container(this.x, this.y).setDepth(32);
      const accent = this.activeSpec?.accent ?? 0xa85ad1;
      const halo = this.scene.add.ellipse(0, 8, 438, 306, accent, 0.1)
        .setStrokeStyle(4, accent, 0.28);
      const backing = this.scene.add.rectangle(7, 10, 420, 316, 0x08090e, 0.82)
        .setStrokeStyle(3, 0x090a0f, 0.82);
      const paintedAtmosphere = addProductionPlate(this.scene, 0, 0, 402, 294, {
        region: 'boss',
        alpha: key.includes('tv-tyrant') ? 0.28 : 0.18,
        tint: accent,
        flipX: key.includes('border-shark') || key.includes('deadline-snail'),
      });
      const frame = this.scene.add.rectangle(0, 0, 404, 304, 0x252832, 0.88)
        .setStrokeStyle(8, accent);
      const frameWear = createMaterialSurface(this.scene, {
        x: 0,
        y: 0,
        width: 392,
        height: 292,
        kind: 'scrap',
        seed: `boss-frame:${key}`,
        alpha: 0.48,
      });
      const inner = this.scene.add.rectangle(0, 0, 382, 282, 0x101219, 0.66)
        .setStrokeStyle(3, 0x737985, 0.5);
      const rasterTyrant = key.includes('tv-tyrant')
        ? addProductionPlate(this.scene, 0, 0, 382, 292, { region: 'boss', alpha: 1 })
        : null;
      const image = rasterTyrant
        ?? this.scene.add.image(0, 0, texture.textureKey, texture.frame).setDisplaySize(370, 274);
      const screenWear = createMaterialSurface(this.scene, {
        x: 0,
        y: 0,
        width: 360,
        height: 264,
        kind: key.includes('tv-tyrant') ? 'screen' : 'scrap',
        seed: `boss-portrait:${key}`,
        alpha: key.includes('tv-tyrant') ? 0.5 : 0.15,
      });
      const fasteners = [
        this.scene.add.circle(-190, -142, 6, 0x5a606c, 1).setStrokeStyle(2, 0xbac1cc, 0.6),
        this.scene.add.circle(190, -142, 6, 0x5a606c, 1).setStrokeStyle(2, 0xbac1cc, 0.6),
        this.scene.add.circle(-190, 142, 6, 0x5a606c, 1).setStrokeStyle(2, 0xbac1cc, 0.6),
        this.scene.add.circle(190, 142, 6, 0x5a606c, 1).setStrokeStyle(2, 0xbac1cc, 0.6),
      ];
      const markBacking = this.scene.add.rectangle(-145, -129, 104, 30, 0x0b0c11, 0.78)
        .setStrokeStyle(2, accent, 0.72).setAngle(-2);
      const mark = this.scene.add.text(-194, -139, bossMarkForKey(key), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#fff4f8',
        fontStyle: 'bold', stroke: '#090a0f', strokeThickness: 4,
      }).setAngle(-2);
      root.add([halo, backing]);
      if (paintedAtmosphere) root.add(paintedAtmosphere);
      root.add([frame, frameWear, inner, image, screenWear, ...fasteners, markBacking, mark]);
      this.root = root;
      if (!this.reducedMotion) {
        root.setScale(0.82).setAlpha(0).setAngle(entranceAngleForKey(key));
        this.scene.tweens.add({
          targets: root,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          angle: 0,
          duration: 240,
          ease: 'Back.Out',
          onComplete: () => this.startIdle(),
        });
      }
    };

    if (resolveAuthoredTexture(this.scene, key)) render();
    else requestAuthoredTexture(this.scene, key, render);
  }

  telegraph(): void {
    const root = this.root;
    const spec = this.activeSpec;
    if (!root || !spec) return;
    this.scene.tweens.killTweensOf(root);
    root.setPosition(this.x, this.y).setAngle(0).setScale(1).setAlpha(1);
    if (this.reducedMotion) {
      root.setAlpha(0.78);
      this.scene.time.delayedCall(90, () => root.active && root.setAlpha(1));
      return;
    }

    switch (spec.telegraph) {
      case 'flicker':
        this.scene.tweens.add({ targets: root, alpha: 0.45, yoyo: true, repeat: 3, duration: 55, onComplete: () => this.startIdle() });
        return;
      case 'compress':
        this.scene.tweens.add({ targets: root, scaleX: 0.92, scaleY: 1.07, y: this.y + 5, yoyo: true, duration: 150, ease: 'Quad.InOut', onComplete: () => this.startIdle() });
        return;
      case 'lunge':
        this.scene.tweens.add({ targets: root, scaleX: 1.07, scaleY: 1.03, x: this.x - 8, yoyo: true, duration: 145, ease: 'Back.InOut', onComplete: () => this.startIdle() });
        return;
      case 'eclipse':
        this.scene.tweens.add({ targets: root, angle: -7, scaleX: 1.04, scaleY: 1.04, alpha: 0.72, yoyo: true, duration: 190, ease: 'Sine.InOut', onComplete: () => this.startIdle() });
        return;
      case 'double-stamp':
        this.scene.tweens.add({ targets: root, y: this.y + 8, scaleX: 1.04, scaleY: 0.96, yoyo: true, repeat: 1, duration: 95, ease: 'Quad.In', onComplete: () => this.startIdle() });
        return;
      case 'edge-charge':
        this.scene.tweens.add({ targets: root, x: this.x - 16, scaleX: 1.05, yoyo: true, duration: 170, ease: 'Cubic.InOut', onComplete: () => this.startIdle() });
    }
  }

  impact(): void {
    const root = this.root;
    const spec = this.activeSpec;
    if (!root || !spec) return;
    this.scene.tweens.killTweensOf(root);
    root.setPosition(this.x, this.y).setAngle(0).setScale(1).setAlpha(1);
    if (this.reducedMotion) {
      root.setScale(1.025);
      this.scene.time.delayedCall(80, () => root.active && root.setScale(1));
      return;
    }

    switch (spec.impact) {
      case 'glitch':
        this.scene.tweens.add({ targets: root, x: this.x + 10, angle: 2, yoyo: true, repeat: 2, duration: 45, onComplete: () => this.startIdle() });
        return;
      case 'snap':
        this.scene.tweens.add({ targets: root, x: this.x + 13, scaleX: 1.05, yoyo: true, duration: 95, ease: 'Back.Out', onComplete: () => this.startIdle() });
        return;
      case 'slam':
        this.scene.tweens.add({ targets: root, y: this.y + 12, scaleY: 0.94, yoyo: true, duration: 105, ease: 'Quad.In', onComplete: () => this.startIdle() });
        return;
      case 'flare':
        this.scene.tweens.add({ targets: root, scaleX: 1.09, scaleY: 1.09, angle: 5, yoyo: true, duration: 120, ease: 'Sine.Out', onComplete: () => this.startIdle() });
        return;
      case 'stamp':
        this.scene.tweens.add({ targets: root, y: this.y + 13, scaleX: 1.07, scaleY: 0.92, yoyo: true, duration: 85, ease: 'Quad.In', onComplete: () => this.startIdle() });
        return;
      case 'bite':
        this.scene.tweens.add({ targets: root, x: this.x - 20, scaleX: 1.08, yoyo: true, duration: 100, ease: 'Back.In', onComplete: () => this.startIdle() });
    }
  }

  defeat(): void {
    const root = this.root;
    if (!root) return;
    this.scene.tweens.killTweensOf(root);
    root.setPosition(this.x, this.y).setAngle(0).setAlpha(1);
    if (this.reducedMotion) {
      root.setAlpha(0.42);
      return;
    }
    this.scene.tweens.add({
      targets: root,
      scaleX: 1.12,
      scaleY: 0.9,
      angle: 4,
      alpha: 0.22,
      y: this.y + 18,
      duration: 320,
      ease: 'Back.In',
    });
  }

  fade(alpha: number): void {
    if (!this.root) return;
    this.scene.tweens.killTweensOf(this.root);
    this.root.setAlpha(alpha);
  }

  clear(): void {
    this.activeKey = null;
    this.activeSpec = null;
    this.destroyRoot();
  }

  private startIdle(): void {
    const root = this.root;
    const spec = this.activeSpec;
    if (!root || !root.active || !spec || this.reducedMotion) return;
    this.scene.tweens.killTweensOf(root);
    root.setPosition(this.x, this.y).setAngle(0).setScale(1).setAlpha(1);

    const common = { targets: root, yoyo: true, repeat: -1, duration: spec.idleDurationMs, ease: 'Sine.InOut' } as const;
    switch (spec.idle) {
      case 'float': this.scene.tweens.add({ ...common, y: this.y - spec.idleAmount }); return;
      case 'sway': this.scene.tweens.add({ ...common, angle: spec.idleAmount }); return;
      case 'breathe': this.scene.tweens.add({ ...common, scaleX: 1 + spec.idleAmount, scaleY: 1 - spec.idleAmount * 0.45 }); return;
      case 'orbit': this.scene.tweens.add({ ...common, angle: spec.idleAmount, y: this.y - 2 }); return;
      case 'stamp': this.scene.tweens.add({ ...common, y: this.y + spec.idleAmount }); return;
      case 'patrol': this.scene.tweens.add({ ...common, x: this.x + spec.idleAmount }); return;
    }
  }

  private destroyRoot(): void {
    if (!this.root) return;
    this.scene.tweens.killTweensOf(this.root);
    this.root.destroy(true);
    this.root = null;
  }
}

function bossMarkForKey(key: string): string {
  if (key.includes('tv-tyrant')) return '▣ SIGNAL';
  if (key.includes('deadline-snail')) return '◷ TIME';
  if (key.includes('closet-monster')) return '▦ CLUTTER';
  if (key.includes('baby-moon')) return '◐ ECLIPSE';
  if (key.includes('copycat-auditor')) return '≡ AUDIT';
  if (key.includes('border-shark')) return '◩ BORDER';
  return '◆ BOSS';
}

function entranceAngleForKey(key: string): number {
  if (key.includes('border-shark')) return -5;
  if (key.includes('copycat-auditor')) return 3;
  if (key.includes('baby-moon')) return -3;
  return 0;
}
