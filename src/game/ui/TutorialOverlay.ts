import * as Phaser from 'phaser';
import { ONBOARDING_STEPS } from '../domain/onboarding';

const DEPTH = 1300;
const STEP_ACCENTS: Readonly<Record<string, number>> = {
  hero: 0x7cf2ff,
  pack: 0xb5ff4d,
  synergy: 0xff91e6,
  fight: 0xff7a68,
  fusion: 0xd88cff,
};

export class TutorialOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private stepIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.96).setInteractive();
    const shadow = scene.add.rectangle(806, 462, 1050, 630, 0x020306, 0.72);
    const panel = scene.add.rectangle(800, 454, 1040, 620, 0x11141d, 1).setStrokeStyle(3, 0x6f6282);
    const inner = scene.add.rectangle(800, 454, 1018, 598, 0x171a24, 0.36).setStrokeStyle(1, 0xa696bd, 0.16);
    this.content = scene.add.container(0, 0);
    this.root.add([blocker, shadow, panel, inner, this.content]);

    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(startStep = 0): void {
    this.stepIndex = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, Math.floor(startStep)));
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

  private refresh(): void {
    this.content.removeAll(true);
    const step = ONBOARDING_STEPS[this.stepIndex]!;
    const finalStep = this.stepIndex === ONBOARDING_STEPS.length - 1;
    const accent = STEP_ACCENTS[step.id] ?? 0xff91e6;

    this.content.add([
      this.scene.add.rectangle(800, 190, 900, 42, 0x0c0f16, 0.9).setStrokeStyle(1, accent, 0.24),
      this.scene.add.rectangle(354, 190, 8, 42, accent, 1),
      this.scene.add.text(375, 177, 'JUNKPACK FIELD MANUAL', {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '20px', color: '#f7f2e8', stroke: '#090a0d', strokeThickness: 5,
      }),
      this.scene.add.text(1240, 179, `${String(this.stepIndex + 1).padStart(2, '0')} / ${String(ONBOARDING_STEPS.length).padStart(2, '0')}`, {
        fontSize: '12px', color: '#c6bfcc', fontStyle: 'bold',
      }).setOrigin(1, 0),
    ]);

    this.drawStepVisual(step.id, accent);

    this.content.add([
      this.scene.add.text(620, 254, step.eyebrow, { fontSize: '12px', color: this.hex(accent), fontStyle: 'bold', letterSpacing: 1 }),
      this.scene.add.text(620, 288, step.title, {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '28px', color: '#f7f2e8', wordWrap: { width: 610 },
      }),
      this.scene.add.text(620, 370, step.body, { fontSize: '17px', color: '#c9c7cf', lineSpacing: 7, wordWrap: { width: 600 } }),
      this.scene.add.rectangle(920, 510, 600, 92, 0x211d2a, 1).setStrokeStyle(2, accent, 0.58),
      this.scene.add.circle(646, 510, 14, accent, 0.16).setStrokeStyle(2, accent, 0.85),
      this.scene.add.text(676, 480, step.callout, {
        fontSize: '14px', color: '#e8d7f3', fontStyle: 'bold', lineSpacing: 4, wordWrap: { width: 515 },
      }),
    ]);

    this.drawStepRail(accent);
    if (this.stepIndex > 0) this.addButton(480, 680, 190, '‹ BACK', () => this.changeStep(-1), false, accent);
    this.addButton(800, 680, finalStep ? 330 : 240, finalStep ? 'GOT IT • BUILD JUNK' : 'NEXT ›', () => {
      if (finalStep) this.hide(); else this.changeStep(1);
    }, true, accent);
    if (!finalStep) this.addButton(1120, 680, 190, 'SKIP', () => this.hide(), false, accent);
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
    const x = 480;
    const y = 397;
    this.content.add([
      this.scene.add.rectangle(x, y, 220, 300, 0x0d1018, 1).setStrokeStyle(3, accent, 0.72),
      this.scene.add.rectangle(x, y, 196, 276, 0x1e212b, 0.82).setStrokeStyle(1, accent, 0.18),
      this.scene.add.text(x, y + 116, stepId.toUpperCase(), { fontSize: '10px', color: this.hex(accent), fontStyle: 'bold', letterSpacing: 2 }).setOrigin(0.5),
    ]);

    if (stepId === 'hero') this.drawHeroVisual(x, y, accent);
    else if (stepId === 'pack') this.drawPackVisual(x, y, accent);
    else if (stepId === 'synergy') this.drawSynergyVisual(x, y, accent);
    else if (stepId === 'fight') this.drawFightVisual(x, y, accent);
    else this.drawFusionVisual(x, y, accent);
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
    const y = 600;
    ONBOARDING_STEPS.forEach((step, index) => {
      const active = index === this.stepIndex;
      const complete = index < this.stepIndex;
      const x = 608 + index * 96;
      const node = this.scene.add.circle(x, y, active ? 9 : 6, active ? accent : complete ? 0xb5ff4d : 0x555b69, 1);
      this.content.add(node);
      if (active) {
        const ring = this.scene.add.circle(x, y, 14, accent, 0).setStrokeStyle(2, accent, 0.45);
        this.content.add(ring);
        if (!this.reducedMotion) this.scene.tweens.add({ targets: ring, scaleX: 1.25, scaleY: 1.25, alpha: 0, duration: 650, repeat: -1 });
      }
      if (index < ONBOARDING_STEPS.length - 1) this.content.add(this.scene.add.rectangle(x + 48, y, 72, 2, complete ? 0x7ba83f : 0x414653, 1));
      if (active) this.content.add(this.scene.add.text(x, y + 18, step.id.toUpperCase(), { fontSize: '8px', color: '#d9d2df', fontStyle: 'bold' }).setOrigin(0.5, 0));
    });
  }

  private addButton(x: number, y: number, width: number, label: string, callback: () => void, primary: boolean, accent: number): void {
    const idle = primary ? 0x303a28 : 0x292c37;
    const hover = primary ? 0x3f4e31 : 0x3a3e4a;
    const rect = this.scene.add.rectangle(x, y, width, 48, idle, 1).setStrokeStyle(2, primary ? accent : 0x666c7c).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { fontSize: '13px', color: primary ? '#f8fff1' : '#e0dde6', fontStyle: 'bold' }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(hover));
    rect.on('pointerout', () => rect.setFillStyle(idle));
    rect.on('pointerdown', () => { rect.setScale(0.97); text.setScale(0.97); });
    const restore = (): void => { rect.setScale(1); text.setScale(1); };
    rect.on('pointerup', () => { restore(); callback(); });
    rect.on('pointerupoutside', restore);
    this.content.add([rect, text]);
  }

  private hex(color: number): string { return `#${color.toString(16).padStart(6, '0')}`; }
}
