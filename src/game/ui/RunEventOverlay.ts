import * as Phaser from 'phaser';
import type { RunEventChoice, RunEventDefinition } from '../domain/runEvents';

export interface RunEventChoiceAttempt {
  readonly ok: boolean;
  readonly message: string;
}

export class RunEventOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private currentEvent: RunEventDefinition | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onChoose: (event: RunEventDefinition, choice: RunEventChoice) => RunEventChoiceAttempt,
  ) {}

  isVisible(): boolean {
    return this.currentEvent !== null;
  }

  show(event: RunEventDefinition): void {
    this.hide();
    this.currentEvent = event;

    const blocker = this.scene.add.rectangle(800, 450, 1600, 900, 0x06070a, 0.78)
      .setDepth(500)
      .setInteractive();
    const panel = this.scene.add.rectangle(800, 450, 760, 430, 0x171724, 1)
      .setStrokeStyle(6, 0xffcf69)
      .setDepth(501);
    const eyebrow = this.scene.add.text(800, 270, 'STRANGE ENCOUNTER', {
      fontSize: '15px', color: '#ffcf69', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(502);
    const title = this.scene.add.text(800, 307, event.title, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '30px', color: '#f7f2e8',
      align: 'center', wordWrap: { width: 650 },
    }).setOrigin(0.5).setDepth(502);
    const body = this.scene.add.text(800, 365, event.body, {
      fontSize: '15px', color: '#c8c1cf', align: 'center', lineSpacing: 5, wordWrap: { width: 640 },
    }).setOrigin(0.5).setDepth(502);
    const status = this.scene.add.text(800, 626, 'Choose once. Reloading will not reroll this event.', {
      fontSize: '11px', color: '#8d8797', align: 'center', wordWrap: { width: 620 },
    }).setOrigin(0.5).setDepth(502);

    this.objects.push(blocker, panel, eyebrow, title, body, status);

    event.choices.slice(0, 2).forEach((choice, index) => {
      const x = 620 + index * 360;
      const card = this.scene.add.rectangle(x, 500, 318, 170, 0x242333, 1)
        .setStrokeStyle(3, index === 0 ? 0xc57bff : 0x72d9ff)
        .setDepth(502)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add.text(x, 447, choice.label, {
        fontSize: '16px', color: '#fff5df', fontStyle: 'bold', align: 'center', wordWrap: { width: 278 },
      }).setOrigin(0.5).setDepth(503);
      const description = this.scene.add.text(x, 512, choice.description, {
        fontSize: '12px', color: '#b8b1c0', align: 'center', lineSpacing: 4, wordWrap: { width: 270 },
      }).setOrigin(0.5).setDepth(503);
      const cost = this.scene.add.text(x, 565, choice.costCoins > 0 ? `COST  ${choice.costCoins}` : 'NO COST', {
        fontSize: '11px', color: choice.costCoins > 0 ? '#ffd56e' : '#9eff83', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(503);

      card.on('pointerover', () => card.setScale(1.02));
      card.on('pointerout', () => card.setScale(1));
      card.on('pointerdown', () => card.setScale(0.98));
      card.on('pointerup', () => {
        card.setScale(1.02);
        if (!this.currentEvent) return;
        const result = this.onChoose(this.currentEvent, choice);
        if (!result.ok) {
          status.setText(result.message).setColor('#ff8fa3');
          this.scene.tweens.add({ targets: card, x: { from: x - 4, to: x + 4 }, yoyo: true, repeat: 2, duration: 55, onComplete: () => card.setX(x) });
          return;
        }
        status.setText(result.message).setColor('#c9ff72');
        this.scene.time.delayedCall(180, () => this.hide());
      });

      this.objects.push(card, label, description, cost);
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.currentEvent = null;
  }
}
