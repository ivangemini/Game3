import * as Phaser from 'phaser';
import { ONBOARDING_STEPS } from '../domain/onboarding';

const DEPTH = 1300;

export class TutorialOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private stepIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.96)
      .setInteractive({ useHandCursor: false });
    const panel = scene.add.rectangle(800, 454, 1040, 620, 0x11141d, 1)
      .setStrokeStyle(3, 0x6f6282, 1);
    this.content = scene.add.container(0, 0);
    this.root.add([blocker, panel, this.content]);

    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(startStep = 0): void {
    this.stepIndex = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, Math.floor(startStep)));
    this.root.setVisible(true);
    this.refresh();
    if (this.reducedMotion) {
      this.root.setAlpha(1);
      return;
    }
    this.root.setAlpha(0);
    this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 180, ease: 'Quad.Out' });
  }

  hide(): void {
    if (!this.root.visible) return;
    if (this.reducedMotion) {
      this.root.setVisible(false).setAlpha(1);
      return;
    }
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 140,
      ease: 'Quad.In',
      onComplete: () => this.root.setVisible(false).setAlpha(1),
    });
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  private refresh(): void {
    this.content.removeAll(true);
    const step = ONBOARDING_STEPS[this.stepIndex]!;
    const finalStep = this.stepIndex === ONBOARDING_STEPS.length - 1;

    this.content.add(this.scene.add.text(350, 182, 'HOW TO PLAY', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '23px', color: '#b5ff4d', stroke: '#090a0d', strokeThickness: 5,
    }));
    this.content.add(this.scene.add.text(1250, 188, `${this.stepIndex + 1} / ${ONBOARDING_STEPS.length}`, {
      fontSize: '12px', color: '#9ca3b2', fontStyle: 'bold',
    }).setOrigin(1, 0));

    this.content.add(this.scene.add.text(350, 250, step.eyebrow, {
      fontSize: '12px', color: '#ff91e6', fontStyle: 'bold',
    }));
    this.content.add(this.scene.add.text(350, 284, step.title, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '29px', color: '#f7f2e8', wordWrap: { width: 900 },
    }));
    this.content.add(this.scene.add.text(350, 365, step.body, {
      fontSize: '18px', color: '#c9c7cf', lineSpacing: 7, wordWrap: { width: 880 },
    }));

    const callout = this.scene.add.rectangle(800, 510, 880, 92, 0x211d2a, 1)
      .setStrokeStyle(2, 0x5d4d70);
    const calloutText = this.scene.add.text(380, 480, `◆  ${step.callout}`, {
      fontSize: '15px', color: '#e8d7f3', fontStyle: 'bold',
      lineSpacing: 4, wordWrap: { width: 835 },
    });
    this.content.add([callout, calloutText]);

    this.drawStepRail();
    if (this.stepIndex > 0) this.addButton(480, 680, 190, '‹ BACK', () => {
      this.stepIndex -= 1;
      this.refresh();
    }, false);
    this.addButton(800, 680, finalStep ? 330 : 240, finalStep ? 'GOT IT • BUILD JUNK' : 'NEXT ›', () => {
      if (finalStep) this.hide();
      else {
        this.stepIndex += 1;
        this.refresh();
      }
    }, true);
    if (!finalStep) this.addButton(1120, 680, 190, 'SKIP', () => this.hide(), false);
  }

  private drawStepRail(): void {
    const y = 600;
    ONBOARDING_STEPS.forEach((step, index) => {
      const active = index === this.stepIndex;
      const complete = index < this.stepIndex;
      const x = 608 + index * 96;
      const node = this.scene.add.circle(x, y, active ? 9 : 6, active ? 0xff91e6 : complete ? 0xb5ff4d : 0x555b69, 1);
      this.content.add(node);
      if (index < ONBOARDING_STEPS.length - 1) {
        this.content.add(this.scene.add.rectangle(x + 48, y, 72, 2, complete ? 0x7ba83f : 0x414653, 1));
      }
      if (active) {
        this.content.add(this.scene.add.text(x, y + 18, step.id.toUpperCase(), {
          fontSize: '8px', color: '#bcb5c7', fontStyle: 'bold',
        }).setOrigin(0.5, 0));
      }
    });
  }

  private addButton(
    x: number,
    y: number,
    width: number,
    label: string,
    callback: () => void,
    primary: boolean,
  ): void {
    const rect = this.scene.add.rectangle(x, y, width, 48, primary ? 0x566f2c : 0x292c37, 1)
      .setStrokeStyle(2, primary ? 0xb5ff4d : 0x666c7c)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, {
      fontSize: '13px', color: primary ? '#f3ffd8' : '#e0dde6', fontStyle: 'bold',
    }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(primary ? 0x68863a : 0x3a3e4a));
    rect.on('pointerout', () => rect.setFillStyle(primary ? 0x566f2c : 0x292c37));
    rect.on('pointerdown', () => { rect.setScale(0.98); text.setScale(0.98); });
    rect.on('pointerup', () => {
      rect.setScale(1); text.setScale(1); callback();
    });
    this.content.add([rect, text]);
  }
}
