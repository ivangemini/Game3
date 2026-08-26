import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { ONBOARDING_STEPS } from '../domain/onboarding';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';
import { createMaterialSurface } from './materialSurface';

const DEPTH = 1300;
const STEP_ACCENTS: Readonly<Record<string, number>> = {
  hero: 0x7cf2ff,
  pack: 0xb5ff4d,
  synergy: 0xff91e6,
  fight: 0xff7a68,
  fusion: 0xd88cff,
};
const TAB_LABELS = ['PILOT', 'PACK', 'LINK', 'FIGHT', 'FUSE'] as const;

export class TutorialOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private stepIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.95).setInteractive();
    const shadow = scene.add.rectangle(812, 464, 1138, 652, 0x010204, 0.76);
    const cover = scene.add.rectangle(800, 452, 1128, 642, 0x35271f, 1).setStrokeStyle(6, 0x76563f);
    const coverWear = createMaterialSurface(scene, {
      x: 800, y: 452, width: 1106, height: 620, kind: 'scrap',
      seed: 'field-manual:cover:v1', depth: DEPTH + 0.1, alpha: 0.75,
    });
    const paper = scene.add.rectangle(800, 452, 1084, 598, 0xd6cfb5, 1).setStrokeStyle(2, 0x8f8268);
    const paperWear = createMaterialSurface(scene, {
      x: 800, y: 452, width: 1060, height: 574, kind: 'paper',
      seed: 'field-manual:paper:v1', depth: DEPTH + 0.2, alpha: 0.56,
    });
    const spineShadow = scene.add.rectangle(804, 452, 32, 590, 0x1a120f, 0.54);
    const spine = scene.add.rectangle(800, 452, 24, 590, 0x5f4736, 1).setStrokeStyle(2, 0x85644a);
    const topClip = scene.add.rectangle(800, 162, 190, 22, 0x343943, 1).setStrokeStyle(2, 0x9299a2);
    const bottomClip = scene.add.rectangle(800, 742, 190, 18, 0x343943, 1).setStrokeStyle(2, 0x9299a2);
    this.content = scene.add.container(0, 0);
    this.root.add([blocker, shadow, cover, coverWear, paper, paperWear, spineShadow, spine, topClip, bottomClip, this.content]);

    const escape = (): void => this.skip();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(startStep = 0): void {
    this.stepIndex = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, Math.floor(startStep)));
    telemetry.track('tutorial_opened', { step: this.stepIndex + 1 });
    this.root.setVisible(true);
    this.refresh();
    if (this.reducedMotion) return void this.root.setAlpha(1);
    this.root.setAlpha(0).setScale(0.985);
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Quad.Out' });
  }

  hide(): void {
    if (!this.root.visible) return;
    if (this.reducedMotion) {
      this.root.setVisible(false).setAlpha(1).setScale(1);
      return;
    }
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      scaleX: 0.99,
      scaleY: 0.99,
      duration: 140,
      ease: 'Quad.In',
      onComplete: () => this.root.setVisible(false).setAlpha(1).setScale(1),
    });
  }

  isVisible(): boolean { return this.root.visible; }

  private complete(): void {
    telemetry.track('tutorial_completed', { stepCount: ONBOARDING_STEPS.length });
    this.hide();
  }

  private skip(): void {
    if (!this.root.visible) return;
    telemetry.track('tutorial_skipped', { step: this.stepIndex + 1 });
    this.hide();
  }

  private refresh(): void {
    this.content.removeAll(true);
    const step = ONBOARDING_STEPS[this.stepIndex]!;
    const finalStep = this.stepIndex === ONBOARDING_STEPS.length - 1;
    const accent = STEP_ACCENTS[step.id] ?? 0xff91e6;

    this.drawHeader(accent);
    this.drawTabs(accent);
    this.drawStepVisual(step.id, accent);

    const eyebrowTape = this.scene.add.rectangle(943, 278, 470, 28, 0xeadfb9, 0.94)
      .setStrokeStyle(1, 0x9d906f, 0.75)
      .setAngle(-0.55);
    const eyebrow = this.scene.add.text(943, 278, step.eyebrow, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '10px', color: this.hex(accent),
      stroke: '#f7efd3', strokeThickness: 1, letterSpacing: 1,
    }).setOrigin(0.5).setAngle(-0.55);
    const title = this.scene.add.text(662, 313, step.title, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '27px', color: '#27232a',
      wordWrap: { width: 560 }, lineSpacing: -2,
    });
    const divider = this.scene.add.rectangle(940, 382, 558, 3, accent, 0.58).setOrigin(0.5);
    const body = this.scene.add.text(662, 405, step.body, {
      fontSize: '16px', color: '#4a4547', lineSpacing: 7, wordWrap: { width: 560 },
    });

    const noteShadow = this.scene.add.rectangle(953, 537, 538, 104, 0x6b5c42, 0.18).setAngle(0.7);
    const note = this.scene.add.rectangle(946, 531, 538, 104, 0xf0e4b7, 1)
      .setStrokeStyle(2, 0xa99664)
      .setAngle(0.7);
    const noteWear = createMaterialSurface(this.scene, {
      x: 946, y: 531, width: 520, height: 88, kind: 'paper',
      seed: `field-manual:note:${step.id}`, depth: DEPTH + 0.5, alpha: 0.5,
    }).setAngle(0.7);
    const pin = this.scene.add.circle(698, 493, 9, accent, 0.88).setStrokeStyle(2, 0xffffff, 0.72);
    const calloutLabel = this.scene.add.text(720, 494, 'FIELD NOTE', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '9px', color: '#554936', letterSpacing: 1,
    }).setOrigin(0, 0.5);
    const callout = this.scene.add.text(694, 516, step.callout, {
      fontSize: '13px', color: '#4e453a', fontStyle: 'bold', lineSpacing: 4, wordWrap: { width: 480 },
    });

    this.content.add([
      eyebrowTape, eyebrow, title, divider, body,
      noteShadow, note, noteWear, pin, calloutLabel, callout,
    ]);

    this.drawStepRail(accent);
    if (this.stepIndex > 0) this.addButton(480, 688, 190, '‹ PREV PAGE', () => this.changeStep(-1), false, accent);
    this.addButton(800, 688, finalStep ? 330 : 240, finalStep ? 'CLOSE MANUAL • BUILD' : 'NEXT PAGE ›', () => {
      if (finalStep) this.complete(); else this.changeStep(1);
    }, true, accent);
    if (!finalStep) this.addButton(1120, 688, 190, 'CLOSE', () => this.skip(), false, accent);
  }

  private drawHeader(accent: number): void {
    const plateShadow = this.scene.add.rectangle(802, 202, 510, 62, 0x7c6a4e, 0.18).setAngle(-0.7);
    const plate = this.scene.add.rectangle(796, 196, 510, 62, 0xefe1b6, 1)
      .setStrokeStyle(2, 0xa79870)
      .setAngle(-0.7);
    const texture = resolveAuthoredTexture(this.scene, uiArtKey('help'));
    const icon = texture
      ? this.scene.add.image(600, 196, texture.textureKey, texture.frame).setDisplaySize(34, 34).setAngle(-0.7)
      : this.scene.add.circle(600, 196, 15, accent, 0.2).setStrokeStyle(2, accent);
    const title = this.scene.add.text(825, 193, 'JUNKPACK FIELD MANUAL', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '24px', color: '#30272a',
    }).setOrigin(0.5).setAngle(-0.7);
    const page = this.scene.add.text(1285, 187, `PAGE ${String(this.stepIndex + 1).padStart(2, '0')} / ${String(ONBOARDING_STEPS.length).padStart(2, '0')}`, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '10px', color: '#5e5751', letterSpacing: 1,
    }).setOrigin(1, 0.5);
    this.content.add([plateShadow, plate, icon, title, page]);
  }

  private drawTabs(activeAccent: number): void {
    const startX = 470;
    TAB_LABELS.forEach((label, index) => {
      const active = index === this.stepIndex;
      const complete = index < this.stepIndex;
      const accent = active ? activeAccent : complete ? 0x8dad51 : 0x7e756b;
      const x = startX + index * 164;
      const tab = this.scene.add.rectangle(x, 240, 144, active ? 32 : 27, active ? accent : 0xc9bea0, active ? 0.22 : 0.9)
        .setStrokeStyle(active ? 3 : 1, accent, active ? 0.95 : 0.65)
        .setInteractive({ useHandCursor: true });
      const text = this.scene.add.text(x, 240, label, {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: active ? '11px' : '9px',
        color: active ? '#3a3034' : '#5e5751', letterSpacing: 1,
      }).setOrigin(0.5);
      tab.on('pointerover', () => tab.setAlpha(0.76));
      tab.on('pointerout', () => tab.setAlpha(1));
      tab.on('pointerup', () => {
        if (index === this.stepIndex) return;
        this.jumpToStep(index);
      });
      this.content.add([tab, text]);
    });
  }

  private jumpToStep(index: number): void {
    const next = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, index));
    const delta = next > this.stepIndex ? 1 : -1;
    this.stepIndex = next;
    if (this.reducedMotion) return this.refresh();
    this.scene.tweens.add({
      targets: this.content, alpha: 0, x: delta > 0 ? -10 : 10, duration: 80, ease: 'Quad.In',
      onComplete: () => {
        this.content.setX(delta > 0 ? 10 : -10);
        this.refresh();
        this.scene.tweens.add({ targets: this.content, alpha: 1, x: 0, duration: 130, ease: 'Quad.Out' });
      },
    });
  }

  private changeStep(delta: number): void {
    this.stepIndex = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, this.stepIndex + delta));
    if (this.reducedMotion) return this.refresh();
    this.scene.tweens.add({
      targets: this.content, alpha: 0, x: delta > 0 ? -10 : 10, duration: 80, ease: 'Quad.In',
      onComplete: () => {
        this.content.setX(delta > 0 ? 10 : -10);
        this.refresh();
        this.scene.tweens.add({ targets: this.content, alpha: 1, x: 0, duration: 130, ease: 'Quad.Out' });
      },
    });
  }

  private drawStepVisual(stepId: string, accent: number): void {
    const x = 505;
    const y = 445;
    const shadow = this.scene.add.rectangle(x + 7, y + 7, 250, 326, 0x6d5c46, 0.2).setAngle(-1.2);
    const photo = this.scene.add.rectangle(x, y, 250, 326, 0xe6ddc5, 1)
      .setStrokeStyle(2, 0x9c9178)
      .setAngle(-1.2);
    const photoWear = createMaterialSurface(this.scene, {
      x, y, width: 232, height: 308, kind: 'paper',
      seed: `field-manual:visual:${stepId}`, depth: DEPTH + 0.35, alpha: 0.48,
    }).setAngle(-1.2);
    const window = this.scene.add.rectangle(x, y - 8, 212, 250, 0x25262b, 1)
      .setStrokeStyle(3, accent, 0.64)
      .setAngle(-1.2);
    const caption = this.scene.add.text(x, y + 135, `PLATE // ${stepId.toUpperCase()}`, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '9px', color: '#574f48', letterSpacing: 1,
    }).setOrigin(0.5).setAngle(-1.2);
    const tape = this.scene.add.rectangle(x, y - 171, 112, 21, 0xd8cb9e, 0.92)
      .setStrokeStyle(1, 0x9b8d68)
      .setAngle(-3.3);
    this.content.add([shadow, photo, photoWear, window, caption, tape]);

    if (stepId === 'hero') this.drawHeroVisual(x, y - 8, accent);
    else if (stepId === 'pack') this.drawPackVisual(x, y - 8, accent);
    else if (stepId === 'synergy') this.drawSynergyVisual(x, y - 8, accent);
    else if (stepId === 'fight') this.drawFightVisual(x, y - 8, accent);
    else this.drawFusionVisual(x, y - 8, accent);
  }

  private drawHeroVisual(x: number, y: number, accent: number): void {
    this.content.add([
      this.scene.add.circle(x, y - 38, 56, accent, 0.09).setStrokeStyle(3, accent, 0.72),
      this.scene.add.circle(x, y - 52, 24, 0xf2d3b1, 1).setStrokeStyle(3, 0x513d49),
      this.scene.add.rectangle(x, y + 8, 92, 86, 0x354255, 1).setStrokeStyle(3, accent, 0.72),
      this.scene.add.circle(x + 34, y - 2, 13, accent, 1).setStrokeStyle(2, 0x11141d),
    ]);
  }

  private drawPackVisual(x: number, y: number, accent: number): void {
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        this.content.add(this.scene.add.rectangle(x - 54 + column * 54, y - 76 + row * 54, 46, 46, 0x292c35, 1).setStrokeStyle(2, 0x5b514d));
      }
    }
    this.content.add(this.scene.add.rectangle(x - 27, y - 49, 96, 42, accent, 0.75).setStrokeStyle(3, 0xf4ffe7));
  }

  private drawSynergyVisual(x: number, y: number, accent: number): void {
    this.content.add([
      this.scene.add.rectangle(x - 52, y - 18, 70, 88, 0x4a4036, 1).setStrokeStyle(3, 0xffd56e),
      this.scene.add.rectangle(x + 52, y - 18, 70, 88, 0x2f4550, 1).setStrokeStyle(3, 0x7cf2ff),
      this.scene.add.rectangle(x, y - 18, 34, 7, accent, 1),
      this.scene.add.circle(x, y - 18, 10, accent, 1).setStrokeStyle(2, 0xffffff, 0.75),
    ]);
  }

  private drawFightVisual(x: number, y: number, accent: number): void {
    this.content.add([
      this.scene.add.circle(x - 55, y + 18, 30, 0x7cf2ff, 0.55).setStrokeStyle(3, 0x7cf2ff),
      this.scene.add.circle(x + 52, y - 30, 48, accent, 0.28).setStrokeStyle(4, accent),
      this.scene.add.triangle(x, y + 52, -18, 14, 18, 14, 0, -15, 0xffd56e, 0.9),
      this.scene.add.rectangle(x - 2, y - 5, 55, 5, accent, 0.8).setAngle(-18),
    ]);
  }

  private drawFusionVisual(x: number, y: number, accent: number): void {
    const result = this.scene.add.rectangle(x, y + 50, 58, 58, accent, 0.36).setStrokeStyle(4, accent).setAngle(45);
    this.content.add([
      this.scene.add.rectangle(x - 62, y - 38, 58, 58, 0x44505c, 1).setStrokeStyle(3, 0x7cf2ff),
      this.scene.add.rectangle(x + 62, y - 38, 58, 58, 0x57424f, 1).setStrokeStyle(3, 0xff91e6),
      this.scene.add.text(x, y - 38, '+', { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '28px', color: '#f7f2e8' }).setOrigin(0.5),
      result,
      this.scene.add.text(x, y + 2, '↓', { fontSize: '24px', color: this.hex(accent) }).setOrigin(0.5),
    ]);
  }

  private drawStepRail(accent: number): void {
    const y = 624;
    const startX = 690;
    ONBOARDING_STEPS.forEach((_step, index) => {
      const active = index === this.stepIndex;
      const complete = index < this.stepIndex;
      const color = active ? accent : complete ? 0x8dad51 : 0x81796e;
      this.content.add(this.scene.add.circle(startX + index * 56, y, active ? 8 : 6, color, active ? 1 : 0.72));
    });
  }

  private addButton(x: number, y: number, width: number, labelText: string, action: () => void, primary: boolean, accent: number): void {
    const shadow = this.scene.add.rectangle(x + 3, y + 4, width, 44, 0x564b3e, 0.26);
    const fill = primary ? accent : 0xc8bea4;
    const button = this.scene.add.rectangle(x, y, width, 44, fill, primary ? 0.25 : 1)
      .setStrokeStyle(primary ? 3 : 2, primary ? accent : 0x817666)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, labelText, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '12px',
      color: primary ? '#312a2c' : '#514a45', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.78));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); shadow.setScale(0.97); });
    const restore = (): void => { button.setScale(1); label.setScale(1); shadow.setScale(1); };
    button.on('pointerupoutside', restore);
    button.on('pointerup', () => { restore(); action(); });
    this.content.add([shadow, button, label]);
  }

  private hex(color: number): string { return `#${color.toString(16).padStart(6, '0')}`; }
}
