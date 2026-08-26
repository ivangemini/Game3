import * as Phaser from 'phaser';
import type { AudioCue } from '../audio/audioCues';
import { cellsForPlacement } from '../domain/inventory';
import type { ItemDefinition, PlacedItem } from '../domain/types';
import { BossPortraitLayer } from './BossPortraitLayer';

export interface CombatFeedbackOptions {
  readonly getBackpackItems: () => readonly PlacedItem[];
  readonly itemDefinitions: ReadonlyMap<string, ItemDefinition>;
  readonly reducedMotion?: boolean;
  readonly backpackGrid?: { readonly left: number; readonly top: number; readonly cellSize: number };
  readonly enemyPoint?: { readonly x: number; readonly y: number };
  readonly playerPoint?: { readonly x: number; readonly y: number };
}

/**
 * Presentation-only feedback driven by the same semantic cues as audio.
 * No animation callback is allowed to mutate combat state.
 */
export class CombatFeedback {
  private readonly particles: Phaser.GameObjects.Arc[];
  private particleCursor = 0;
  private readonly screenFlash: Phaser.GameObjects.Rectangle;
  private readonly combatFrame: Phaser.GameObjects.Rectangle;
  private readonly lastFxAtById = new Map<string, number>();
  private readonly reducedMotion: boolean;
  private readonly backpackGrid: { readonly left: number; readonly top: number; readonly cellSize: number };
  private readonly enemyPoint: { readonly x: number; readonly y: number };
  private readonly playerPoint: { readonly x: number; readonly y: number };
  private readonly bossPortraits: BossPortraitLayer;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CombatFeedbackOptions,
  ) {
    this.reducedMotion = options.reducedMotion ?? false;
    this.backpackGrid = options.backpackGrid ?? { left: 90, top: 225, cellSize: 76 };
    this.enemyPoint = options.enemyPoint ?? { x: 1225, y: 403 };
    this.playerPoint = options.playerPoint ?? { x: 845, y: 287 };

    this.screenFlash = scene.add.rectangle(800, 450, 1600, 900, 0xffffff, 0)
      .setDepth(245)
      .setScrollFactor(0);
    this.combatFrame = scene.add.rectangle(1140, 445, 770, 550, 0xffffff, 0)
      .setStrokeStyle(7, 0xff91e6, 0)
      .setDepth(244);

    this.particles = Array.from({ length: 30 }, () => scene.add.circle(0, 0, 5, 0xffffff, 1)
      .setDepth(246)
      .setVisible(false));
    this.bossPortraits = new BossPortraitLayer(scene, this.enemyPoint.x, this.enemyPoint.y, this.reducedMotion);
  }

  play(cue: AudioCue): void {
    if (!this.shouldRender(cue)) return;

    switch (cue.id) {
      case 'combat.start':
        this.bossPortraits.show(cue.sourceId);
        this.framePulse(cue.priority >= 3 ? 0xff91e6 : 0xb5ff4d, 0.72);
        return;
      case 'item.trigger':
        this.itemBurst(cue.sourceId, 0xb5ff4d, 3, 34);
        return;
      case 'item.jammed':
        this.itemRing(cue.sourceId, 0xffcf69);
        return;
      case 'item.slimed':
        this.itemRing(cue.sourceId, 0x76ff5b);
        return;
      case 'item.scrambled':
        this.itemBurst(cue.sourceId, 0x58d7ff, 5, 46);
        return;
      case 'item.eclipsed':
        this.itemRing(cue.sourceId, 0xd18cff);
        return;
      case 'enemy.hit':
        this.burst(this.enemyPoint.x, this.enemyPoint.y, 0xffd37a, 5, 58, cue.id);
        return;
      case 'enemy.poison-tick':
        this.burst(this.enemyPoint.x, this.enemyPoint.y + 22, 0x9cff61, 3, 36, cue.id);
        return;
      case 'poison.apply':
        this.burst(this.enemyPoint.x - 12, this.enemyPoint.y + 12, 0x79ff70, 4, 42, cue.id);
        return;
      case 'shield.gain':
        this.ring(this.playerPoint.x, this.playerPoint.y, 0x78dfff, 26, 150);
        return;
      case 'player.hit':
        this.flash(0xff4f68, 0.16, 105);
        this.burst(this.playerPoint.x, this.playerPoint.y, 0xff6578, 5, 46, cue.id);
        if (!this.reducedMotion) this.scene.cameras.main.shake(85, 0.0022);
        return;
      case 'combat.victory':
        this.flash(0xb5ff4d, 0.12, 190);
        this.burst(1140, 445, 0xb5ff4d, 18, 180, cue.id);
        this.framePulse(0xb5ff4d, 0.9);
        return;
      case 'boss.defeat':
        this.flash(0xfff0a8, 0.2, 260);
        this.burst(1140, 425, 0xff91e6, 28, 245, cue.id);
        this.framePulse(0xffcf69, 1);
        this.bossPortraits.defeat();
        if (!this.reducedMotion) this.scene.cameras.main.shake(170, 0.0042);
        return;
      case 'combat.defeat':
        this.flash(0xff536c, 0.13, 230);
        this.framePulse(0xff536c, 0.9);
        this.bossPortraits.fade(0.7);
        return;
      default:
        if (cue.id.endsWith('.telegraph')) {
          this.bossPortraits.telegraph();
          this.framePulse(bossColor(cue.id), 0.7);
          return;
        }
        this.bossPortraits.impact();
        this.flash(bossColor(cue.id), 0.12, 120);
        this.framePulse(bossColor(cue.id), 1);
        if (!this.reducedMotion) this.scene.cameras.main.shake(100, 0.0031);
    }
  }

  private shouldRender(cue: AudioCue): boolean {
    const now = runtimeNowMs();
    const minimumGap = cue.id === 'item.trigger' ? 55
      : cue.id === 'enemy.hit' ? 45
        : Math.min(110, Math.max(0, cue.cooldownMs * 0.45));
    const previous = this.lastFxAtById.get(cue.id);
    if (previous !== undefined && now - previous < minimumGap) return false;
    this.lastFxAtById.set(cue.id, now);
    return true;
  }

  private itemBurst(instanceId: string | undefined, color: number, count: number, spread: number): void {
    const point = this.itemCenter(instanceId);
    if (!point) return;
    this.burst(point.x, point.y, color, count, spread, instanceId ?? 'item');
  }

  private itemRing(instanceId: string | undefined, color: number): void {
    const point = this.itemCenter(instanceId);
    if (!point) return;
    this.ring(point.x, point.y, color, 22, 145);
  }

  private itemCenter(instanceId: string | undefined): { readonly x: number; readonly y: number } | null {
    if (!instanceId) return null;
    const item = this.options.getBackpackItems().find((candidate) => candidate.instanceId === instanceId);
    if (!item) return null;
    const definition = this.options.itemDefinitions.get(item.definitionId);
    if (!definition) return null;
    const cells = cellsForPlacement(definition, item.origin, item.rotation);
    if (cells.length === 0) return null;
    const averageX = cells.reduce((sum, cell) => sum + cell.x + 0.5, 0) / cells.length;
    const averageY = cells.reduce((sum, cell) => sum + cell.y + 0.5, 0) / cells.length;
    return {
      x: this.backpackGrid.left + averageX * this.backpackGrid.cellSize,
      y: this.backpackGrid.top + averageY * this.backpackGrid.cellSize,
    };
  }

  private burst(x: number, y: number, color: number, count: number, spread: number, key: string): void {
    const safeCount = Math.min(count, this.particles.length);
    if (this.reducedMotion) {
      this.ring(x, y, color, 15, 80);
      return;
    }

    const offset = hashUnit(key) * Math.PI * 2;
    for (let index = 0; index < safeCount; index += 1) {
      const particle = this.nextParticle();
      const angle = offset + index / safeCount * Math.PI * 2;
      const distance = spread * (0.52 + (index % 4) * 0.12);
      const duration = 125 + (index % 5) * 18;
      this.scene.tweens.killTweensOf(particle);
      particle
        .setPosition(x, y)
        .setFillStyle(color, 1)
        .setAlpha(0.92)
        .setScale(0.72 + (index % 3) * 0.18)
        .setVisible(true);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.35,
        scaleY: 0.35,
        duration,
        ease: 'Quad.Out',
        onComplete: () => particle.setVisible(false),
      });
    }
  }

  private ring(x: number, y: number, color: number, radius: number, duration: number): void {
    const ring = this.scene.add.circle(x, y, radius, color, 0)
      .setStrokeStyle(4, color, 0.9)
      .setDepth(247);
    if (this.reducedMotion) {
      this.scene.time.delayedCall(Math.min(100, duration), () => ring.destroy());
      return;
    }
    ring.setScale(0.72);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.55,
      scaleY: 1.55,
      alpha: 0,
      duration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
  }

  private flash(color: number, alpha: number, duration: number): void {
    this.scene.tweens.killTweensOf(this.screenFlash);
    this.screenFlash.setFillStyle(color, 1).setAlpha(alpha);
    if (this.reducedMotion) {
      this.scene.time.delayedCall(Math.min(90, duration), () => this.screenFlash.setAlpha(0));
      return;
    }
    this.scene.tweens.add({
      targets: this.screenFlash,
      alpha: 0,
      duration,
      ease: 'Quad.Out',
    });
  }

  private framePulse(color: number, strength: number): void {
    this.scene.tweens.killTweensOf(this.combatFrame);
    this.combatFrame.setStrokeStyle(6, color, Math.min(1, strength)).setAlpha(1);
    if (this.reducedMotion) {
      this.scene.time.delayedCall(90, () => this.combatFrame.setAlpha(0));
      return;
    }
    this.scene.tweens.add({
      targets: this.combatFrame,
      alpha: 0,
      duration: 210,
      ease: 'Quad.Out',
    });
  }

  private nextParticle(): Phaser.GameObjects.Arc {
    const particle = this.particles[this.particleCursor]!;
    this.particleCursor = (this.particleCursor + 1) % this.particles.length;
    return particle;
  }
}

function bossColor(id: string): number {
  if (id.includes('slime')) return 0x76ff5b;
  if (id.includes('magnet') || id.includes('edge-rent')) return 0x58d7ff;
  if (id.includes('eclipse')) return 0xd18cff;
  if (id.includes('time-tax')) return 0xffcf69;
  if (id.includes('clutter')) return 0x7de6ff;
  if (id.includes('duplicate-debt')) return 0xff9b5f;
  return 0xff91e6;
}

function hashUnit(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function runtimeNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
