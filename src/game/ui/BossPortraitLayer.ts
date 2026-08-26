import * as Phaser from 'phaser';
import { bossArtKeyForEnemyId, requestAuthoredTexture, resolveAuthoredTexture } from './authoredArt';
import { bossMotionSpecForArtKey, type BossMotionSpec } from './bossPresentation';
import { createMaterialSurface } from './materialSurface';

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
      const backing = this.scene.add.rectangle(4, 6, 286, 214, 0x090a0f, 0.62)
        .setStrokeStyle(2, 0x090a0f, 0.65);
      const frame = this.scene.add.rectangle(0, 0, 278, 206, 0x252832, 1)
        .setStrokeStyle(5, accent);
      const frameWear = createMaterialSurface(this.scene, {
        x: 0,
        y: 0,
        width: 268,
        height: 196,
        kind: 'scrap',
        seed: `boss-frame:${key}`,
        alpha: 0.72,
      });
      const inner = this.scene.add.rectangle(0, 0, 258, 192, 0x101219, 1)
        .setStrokeStyle(2, 0x737985, 0.5);
      const image = this.scene.add.image(0, 0, texture.textureKey, texture.frame).setDisplaySize(250, 186);
      const screenWear = createMaterialSurface(this.scene, {
        x: 0,
        y: 0,
        width: 244,
        height: 180,
        kind: key.includes('tv-tyrant') ? 'screen' : 'scrap',
        seed: `boss-portrait:${key}`,
        alpha: key.includes('tv-tyrant') ? 0.82 : 0.22,
      });
      const fasteners = [
        this.scene.add.circle(-128, -92, 4.5, 0x5a606c, 1).setStrokeStyle(1.5, 0xbac1cc, 0.6),
        this.scene.add.circle(128, -92, 4.5, 0x5a606c, 1).setStrokeStyle(1.5, 0xbac1cc, 0.6),
        this.scene.add.circle(-128, 92, 4.5, 0x5a606c, 1).setStrokeStyle(1.5, 0xbac1cc, 0.6),
        this.scene.add.circle(128, 92, 4.5, 0x5a606c, 1).setStrokeStyle(1.5, 0xbac1cc, 0.6),
      ];
      root.add([backing, frame, frameWear, inner, image, screenWear, ...fasteners]);
      this.root = root;
      if (!this.reducedMotion) {
        root.setScale(0.94);
        this.scene.tweens.add({
          targets: root,
          scaleX: 1,
          scaleY: 1,
          duration: 180,
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
