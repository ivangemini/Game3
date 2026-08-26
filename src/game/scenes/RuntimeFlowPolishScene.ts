import * as Phaser from 'phaser';
import { createMaterialSurface } from '../ui/materialSurface';
import { PANEL_VISUALS } from '../ui/visualTokens';

type OverlayKind = 'daily' | 'weekly' | 'trophy';

interface FlowBeat {
  readonly kicker: string;
  readonly title: string;
  readonly detail: string;
  readonly accent: number;
  readonly waitsForPerkChoice?: boolean;
}

const OVERLAY_TARGETS: readonly { title: string; kind: OverlayKind }[] = [
  { title: 'DAILY BOARD', kind: 'daily' },
  { title: 'WEEKLY CHALLENGE', kind: 'weekly' },
  { title: 'TROPHY SHELF', kind: 'trophy' },
] as const;

/**
 * Presentation-only flow polish for post-fight beats and large meta boards.
 * Gameplay state remains owned by PrototypeScene/domain systems; this scene only
 * mirrors already-rendered copy and decorates existing overlay containers.
 */
export class RuntimeFlowPolishScene extends Phaser.Scene {
  private target: Phaser.Scene | null = null;
  private marker: Phaser.GameObjects.Rectangle | null = null;
  private polishedRoots = new WeakSet<Phaser.GameObjects.Container>();
  private originalAlpha = new WeakMap<Phaser.GameObjects.Text, number>();
  private lastStatus = '';
  private pendingBeat: FlowBeat | null = null;
  private activeBeat: Phaser.GameObjects.Container | null = null;
  private lastScanAt = -1000;

  constructor() {
    super('runtime-flow-polish');
  }

  update(): void {
    const target = this.scene.get('prototype');
    if (!target.sys.isActive()) return;
    if (this.target !== target || !this.marker?.active) this.install(target);

    if (this.time.now - this.lastScanAt < 120) return;
    this.lastScanAt = this.time.now;

    this.decorateMetaBoards(target);
    this.syncCompactReadability(target);
    this.syncFlowBeat(target);
  }

  private install(target: Phaser.Scene): void {
    this.target = target;
    this.marker = target.add.rectangle(-90, -90, 1, 1, 0x000000, 0)
      .setVisible(false)
      .setDepth(-1000);
    this.polishedRoots = new WeakSet<Phaser.GameObjects.Container>();
    this.originalAlpha = new WeakMap<Phaser.GameObjects.Text, number>();
    this.pendingBeat = null;
    this.activeBeat = null;
    this.lastScanAt = -1000;
    this.lastStatus = this.findRunStatus(target)?.text.trim() ?? '';

    target.events.once('shutdown', () => {
      if (this.target !== target) return;
      this.activeBeat = null;
      this.marker = null;
      this.target = null;
      this.pendingBeat = null;
      this.lastStatus = '';
    });
  }

  private decorateMetaBoards(scene: Phaser.Scene): void {
    for (const target of OVERLAY_TARGETS) {
      const root = this.findOverlayRoot(scene, target.title);
      if (!root || this.polishedRoots.has(root)) continue;
      this.polishedRoots.add(root);
      this.installBoardMaterial(scene, root, target.kind);
    }
  }

  private installBoardMaterial(
    scene: Phaser.Scene,
    root: Phaser.GameObjects.Container,
    kind: OverlayKind,
  ): void {
    const palette = kind === 'daily'
      ? { edge: 0xc85aa9, accent: PANEL_VISUALS.neonPurple, warm: 0xb5824c, label: 'DAILY CONTRACT FILE' }
      : kind === 'weekly'
        ? { edge: 0xd09a4e, accent: 0xffc768, warm: 0x8b6338, label: 'WEEKLY BOSS DOSSIER' }
        : { edge: 0x9d72c7, accent: PANEL_VISUALS.neonLime, warm: 0x76533d, label: 'JUNK ARCHIVE // TROPHIES' };

    const objects: Phaser.GameObjects.GameObject[] = [];
    objects.push(
      scene.add.rectangle(800, 458, 1460, 780, 0x0b0d12, 0.18)
        .setStrokeStyle(6, palette.edge, 0.22),
    );
    objects.push(createMaterialSurface(scene, {
      x: 800,
      y: 458,
      width: 1438,
      height: 758,
      kind: kind === 'trophy' ? 'leather' : 'scrap',
      seed: `runtime-flow:${kind}:board`,
      alpha: kind === 'trophy' ? 0.32 : 0.28,
    }));

    const headerShadow = scene.add.rectangle(362, 101, 520, 78, 0x030407, 0.62);
    const headerPlate = scene.add.rectangle(358, 97, 518, 76, kind === 'weekly' ? 0x51381f : 0x352631, 0.96)
      .setStrokeStyle(4, palette.edge, 0.82)
      .setAngle(-0.6);
    const headerWear = createMaterialSurface(scene, {
      x: 358,
      y: 97,
      width: 500,
      height: 58,
      kind: 'scrap',
      seed: `runtime-flow:${kind}:header`,
      alpha: 0.58,
    }).setAngle(-0.6);
    objects.push(headerShadow, headerPlate, headerWear);

    const fileTab = scene.add.rectangle(800, 57, 250, 28, palette.warm, 0.96)
      .setStrokeStyle(2, palette.edge, 0.72)
      .setAngle(0.8);
    const fileLabel = scene.add.text(800, 57, palette.label, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '10px',
      color: '#f4dfbd',
      stroke: '#1a100b',
      strokeThickness: 3,
      letterSpacing: 0.8,
    }).setOrigin(0.5).setAngle(0.8);
    objects.push(fileTab, fileLabel);

    const leftRail = scene.add.rectangle(75, 454, 12, 696, 0x101218, 0.92)
      .setStrokeStyle(2, palette.accent, 0.26);
    const rightRail = scene.add.rectangle(1525, 454, 12, 696, 0x101218, 0.92)
      .setStrokeStyle(2, palette.edge, 0.22);
    objects.push(leftRail, rightRail);

    for (const [x, y] of [[82, 78], [1518, 78], [82, 826], [1518, 826]] as const) {
      objects.push(
        scene.add.circle(x, y, 7, 0x343942, 1).setStrokeStyle(2, 0x9ca4b0, 0.6),
        scene.add.circle(x - 2, y - 2, 2, 0xe3e7ee, 0.6),
      );
    }

    const hazard = scene.add.graphics();
    hazard.lineStyle(5, 0x14171c, 0.95);
    hazard.lineBetween(110, 838, 1490, 838);
    hazard.lineStyle(2, palette.accent, 0.42);
    for (let x = 125; x < 1480; x += 54) hazard.lineBetween(x, 834, x + 24, 842);
    objects.push(hazard);

    const decor = scene.add.container(0, 0, objects);
    const insertAt = Math.max(0, root.list.length - 1);
    root.addAt(decor, insertAt);
  }

  private syncFlowBeat(scene: Phaser.Scene): void {
    const statusObject = this.findRunStatus(scene);
    const status = statusObject?.text.trim() ?? '';
    if (status && status !== this.lastStatus) {
      this.lastStatus = status;
      const next = flowBeatForStatus(status);
      if (next) this.pendingBeat = next;
    }

    if (!this.pendingBeat || this.activeBeat?.active) return;
    if (this.pendingBeat.waitsForPerkChoice && this.perkChoiceVisible(scene)) return;
    if (this.metaBoardVisible(scene)) return;

    const beat = this.pendingBeat;
    this.pendingBeat = null;
    this.showFlowBeat(scene, beat);
  }

  private showFlowBeat(scene: Phaser.Scene, beat: FlowBeat): void {
    if (this.activeBeat?.active) this.activeBeat.destroy(true);

    const x = 800;
    const y = 454;
    const objects: Phaser.GameObjects.GameObject[] = [];
    objects.push(scene.add.rectangle(7, 8, 748, 132, 0x000000, 0.58));
    objects.push(scene.add.rectangle(0, 0, 748, 132, 0x18141a, 0.98).setStrokeStyle(6, 0x68515f, 0.95));
    objects.push(scene.add.rectangle(0, 0, 726, 110, 0x11141a, 0.96).setStrokeStyle(2, beat.accent, 0.48));
    const material = createMaterialSurface(scene, {
      x: 0,
      y: 0,
      width: 712,
      height: 98,
      kind: 'scrap',
      seed: `runtime-flow:beat:${beat.kicker}:${beat.title}`,
      alpha: 0.7,
    });
    material.setPosition(0, 0);
    objects.push(material);

    const stripe = scene.add.graphics();
    stripe.lineStyle(8, beat.accent, 0.78);
    stripe.lineBetween(-350, -51, -140, -51);
    stripe.lineStyle(4, beat.accent, 0.35);
    stripe.lineBetween(140, 51, 350, 51);
    objects.push(stripe);

    objects.push(scene.add.text(0, -35, beat.kicker, {
      fontSize: '11px', color: `#${beat.accent.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold', letterSpacing: 1.2, stroke: '#090a0d', strokeThickness: 3,
    }).setOrigin(0.5));
    objects.push(scene.add.text(0, -2, beat.title, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '30px', color: '#fff2d8', stroke: '#090a0d', strokeThickness: 7,
    }).setOrigin(0.5));
    objects.push(scene.add.text(0, 36, beat.detail, {
      fontSize: '11px', color: '#c7bec7', fontStyle: 'bold', letterSpacing: 0.5,
    }).setOrigin(0.5));

    for (const [bx, by] of [[-350, -52], [350, -52], [-350, 52], [350, 52]] as const) {
      objects.push(scene.add.circle(bx, by, 5, 0x565c67, 1).setStrokeStyle(1, 0xc1c7d0, 0.58));
    }

    const container = scene.add.container(x, y, objects).setDepth(190);
    this.activeBeat = container;
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

    if (!reduced) {
      container.setScale(0.86).setAlpha(0).setY(y + 18);
      scene.tweens.add({
        targets: container,
        y,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 180,
        ease: 'Back.Out',
      });
      scene.tweens.add({
        targets: container,
        y: y - 10,
        alpha: 0,
        delay: 720,
        duration: 200,
        ease: 'Quad.In',
      });
    }

    scene.time.delayedCall(reduced ? 620 : 980, () => {
      if (container.active) container.destroy(true);
      if (this.activeBeat === container) this.activeBeat = null;
    });
  }

  private syncCompactReadability(scene: Phaser.Scene): void {
    const compact = scene.scale.displaySize.width <= 1100 || scene.scale.displaySize.height <= 620;
    for (const text of this.collectTexts(scene)) {
      if (!this.originalAlpha.has(text)) this.originalAlpha.set(text, text.alpha);
      const base = this.originalAlpha.get(text) ?? 1;
      if (!compact) {
        text.setAlpha(base);
        continue;
      }

      if (isLowPriorityRuntimeCopy(text)) {
        text.setAlpha(base * 0.18);
        continue;
      }

      const fontSize = fontSizeNumber(text);
      if (fontSize <= 10 && text.text.length >= 72) {
        text.setAlpha(base * 0.38);
        continue;
      }
      text.setAlpha(base);
    }
  }

  private findRunStatus(scene: Phaser.Scene): Phaser.GameObjects.Text | null {
    let best: Phaser.GameObjects.Text | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const text of this.collectTexts(scene)) {
      if (!text.visible) continue;
      const distance = Math.abs(text.x - 584) + Math.abs(text.y - 551) * 1.4;
      if (distance > 70 || distance >= bestDistance) continue;
      best = text;
      bestDistance = distance;
    }
    return best;
  }

  private perkChoiceVisible(scene: Phaser.Scene): boolean {
    return this.collectTexts(scene).some((text) => text.visible && text.text.includes('CHOOSE A PERK'));
  }

  private metaBoardVisible(scene: Phaser.Scene): boolean {
    return this.collectTexts(scene).some((text) => text.visible && (
      text.text === 'DAILY BOARD'
      || text.text === 'WEEKLY CHALLENGE'
      || text.text === 'TROPHY SHELF'
    ));
  }

  private findOverlayRoot(scene: Phaser.Scene, title: string): Phaser.GameObjects.Container | null {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Container)) continue;
      if (this.containerContainsText(object, title)) return object;
    }
    return null;
  }

  private containerContainsText(container: Phaser.GameObjects.Container, title: string): boolean {
    let found = false;
    const visit = (object: Phaser.GameObjects.GameObject): void => {
      if (found) return;
      if (object instanceof Phaser.GameObjects.Text && object.text === title) {
        found = true;
        return;
      }
      if (object instanceof Phaser.GameObjects.Container) {
        for (const child of object.list) visit(child);
      }
    };
    for (const child of container.list) visit(child);
    return found;
  }

  private collectTexts(scene: Phaser.Scene): Phaser.GameObjects.Text[] {
    const texts: Phaser.GameObjects.Text[] = [];
    const visit = (object: Phaser.GameObjects.GameObject): void => {
      if (object instanceof Phaser.GameObjects.Text) {
        texts.push(object);
        return;
      }
      if (object instanceof Phaser.GameObjects.Container) {
        for (const child of object.list) visit(child);
      }
    };
    for (const object of scene.children.list) visit(object);
    return texts;
  }
}

function flowBeatForStatus(status: string): FlowBeat | null {
  const upper = status.toUpperCase();
  const world = upper.match(/WORLD\s+(\d+)\s+CLEARED/);
  if (world) {
    const next = upper.match(/WORLD\s+(\d+)\s*$/)?.[1];
    return {
      kicker: 'BOSS ROUTE UPDATED',
      title: `WORLD ${world[1]} SCRAPPED`,
      detail: next ? `REPACK THE BAG  •  WORLD ${next} NEXT` : 'REPACK THE BAG  •  NEXT WORLD ARMED',
      accent: PANEL_VISUALS.neonLime,
      waitsForPerkChoice: true,
    };
  }
  if (upper.includes('BOSS DOWN')) {
    return {
      kicker: 'BOSS ROUTE UPDATED',
      title: 'BOSS SCRAPPED',
      detail: 'LOCK THE PERK  •  REBUILD THE BAG  •  GO DEEPER',
      accent: PANEL_VISUALS.neonPurple,
      waitsForPerkChoice: true,
    };
  }
  if (upper.startsWith('VICTORY')) {
    return {
      kicker: 'ENCOUNTER RESULT',
      title: 'ENCOUNTER CLEARED',
      detail: 'REPACK  •  SHOP  •  FUSE  •  THEN HIT THE NEXT ONE',
      accent: PANEL_VISUALS.electricBlue,
    };
  }
  if (upper.includes('RUN ARCHIVED')) {
    return {
      kicker: 'RUN COMPLETE',
      title: 'REALITY BANKED',
      detail: 'SCORE SAVED  •  TROPHIES UPDATED  •  NEW BAG READY',
      accent: 0xffd56e,
    };
  }
  return null;
}

function isLowPriorityRuntimeCopy(text: Phaser.GameObjects.Text): boolean {
  const value = text.text.toUpperCase();
  return value.startsWith('EDGE CONTACT = POWER')
    || value.includes('REROLLS STAY FIXED TO THIS RUN')
    || value.startsWith('BUILD LOCKS AT FIGHT START')
    || value.startsWith('RESULT AUTO-PACKS')
    || value.startsWith('2 INGREDIENTS →')
    || value.startsWith('SAME SEED/LOADOUT')
    || value.includes('NO FAKE GLOBAL LEADERBOARD');
}

function fontSizeNumber(text: Phaser.GameObjects.Text): number {
  const raw = text.style.fontSize;
  if (typeof raw === 'number') return raw;
  const parsed = Number.parseFloat(String(raw));
  return Number.isFinite(parsed) ? parsed : 16;
}
