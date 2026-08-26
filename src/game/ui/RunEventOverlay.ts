import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import type { RunEventChoice, RunEventDefinition } from '../domain/runEvents';
import { createMaterialSurface } from './materialSurface';
import { PANEL_VISUALS } from './visualTokens';

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

    const blocker = this.scene.add.rectangle(800, 450, 1600, 900, 0x040508, 0.9)
      .setDepth(500)
      .setInteractive();
    const glowLeft = this.scene.add.circle(355, 500, 320, 0xb83cff, 0.08).setDepth(500.1);
    const glowRight = this.scene.add.circle(1280, 360, 300, 0x4ecfff, 0.07).setDepth(500.1);
    const shadow = this.scene.add.rectangle(808, 462, 920, 510, 0x000000, 0.62).setDepth(501);
    const panel = this.scene.add.rectangle(800, 450, 920, 510, PANEL_VISUALS.leatherDark, 1)
      .setStrokeStyle(7, PANEL_VISUALS.leatherEdge)
      .setDepth(501.1);
    const inner = this.scene.add.rectangle(800, 450, 894, 484, 0x171720, 0.97)
      .setStrokeStyle(2, 0x58465c, 0.75)
      .setDepth(501.2);
    const wear = createMaterialSurface(this.scene, {
      x: 800,
      y: 450,
      width: 876,
      height: 466,
      kind: 'leather',
      seed: `run-event:${event.id}:shell`,
      depth: 501.3,
      alpha: 0.92,
    });

    const headerShadow = this.scene.add.rectangle(804, 239, 500, 70, 0x000000, 0.46).setDepth(501.5);
    const header = this.scene.add.rectangle(800, 235, 494, 68, 0x523226, 1)
      .setStrokeStyle(4, 0xc99462)
      .setAngle(-1.1)
      .setDepth(501.6);
    const headerWear = createMaterialSurface(this.scene, {
      x: 800,
      y: 235,
      width: 474,
      height: 50,
      kind: 'paper',
      seed: `run-event:${event.id}:header`,
      depth: 501.7,
      alpha: 0.72,
    }).setAngle(-1.1);
    const eyebrow = this.scene.add.text(800, 226, '⚠  STRANGE ENCOUNTER  ⚠', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '18px', color: '#ffe0a4', fontStyle: 'bold', letterSpacing: 1.4,
      stroke: '#23130d', strokeThickness: 5,
    }).setOrigin(0.5).setAngle(-1.1).setDepth(502);
    const routeTag = this.scene.add.rectangle(1120, 260, 170, 30, 0x31233d, 1)
      .setStrokeStyle(2, PANEL_VISUALS.neonPurple)
      .setAngle(1.4)
      .setDepth(501.8);
    const routeLabel = this.scene.add.text(1120, 260, 'REALITY BENT', {
      fontSize: '10px', color: '#f0d7ff', fontStyle: 'bold', stroke: '#100c13', strokeThickness: 3,
    }).setOrigin(0.5).setAngle(1.4).setDepth(502);

    const title = this.scene.add.text(800, 296, event.title.toUpperCase(), {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '29px', color: '#fff5e7',
      stroke: '#0d0e12', strokeThickness: 6, align: 'center', wordWrap: { width: 760 },
    }).setOrigin(0.5).setDepth(502);
    const storyPlate = this.scene.add.rectangle(800, 360, 770, 86, 0x0d1118, 0.9)
      .setStrokeStyle(2, 0x596678, 0.55)
      .setDepth(501.5);
    const storyWear = createMaterialSurface(this.scene, {
      x: 800,
      y: 360,
      width: 752,
      height: 70,
      kind: 'screen',
      seed: `run-event:${event.id}:story`,
      depth: 501.6,
      alpha: 0.55,
    });
    const body = this.scene.add.text(800, 360, event.body, {
      fontSize: '14px', color: '#d3ccd5', align: 'center', lineSpacing: 5, wordWrap: { width: 714 },
    }).setOrigin(0.5).setDepth(502);

    const statusPlate = this.scene.add.rectangle(800, 660, 694, 38, 0x151319, 0.96)
      .setStrokeStyle(2, 0x665763, 0.72)
      .setDepth(501.7);
    const status = this.scene.add.text(800, 660, 'ONE CHOICE • THE EVENT WILL NOT REROLL ON RELOAD', {
      fontSize: '10px', color: '#a49aa8', align: 'center', fontStyle: 'bold', letterSpacing: 0.6,
      wordWrap: { width: 650 },
    }).setOrigin(0.5).setDepth(502);

    this.objects.push(
      blocker, glowLeft, glowRight, shadow, panel, inner, wear,
      headerShadow, header, headerWear, eyebrow, routeTag, routeLabel,
      title, storyPlate, storyWear, body, statusPlate, status,
    );

    event.choices.slice(0, 2).forEach((choice, index) => {
      const x = 610 + index * 380;
      const y = 515;
      const accent = index === 0 ? PANEL_VISUALS.neonPurple : PANEL_VISUALS.electricBlue;
      const fill = index === 0 ? 0x2c2035 : 0x1b2b35;

      const cardShadow = this.scene.add.rectangle(x + 5, y + 7, 340, 210, 0x000000, 0.54).setDepth(501.8);
      const card = this.scene.add.rectangle(x, y, 340, 210, fill, 1)
        .setStrokeStyle(4, accent)
        .setDepth(502)
        .setInteractive({ useHandCursor: true });
      const cardInner = this.scene.add.rectangle(x, y, 324, 194, 0x181b22, 0.84)
        .setStrokeStyle(1, accent, 0.32)
        .setDepth(502.1);
      const cardWear = createMaterialSurface(this.scene, {
        x,
        y,
        width: 310,
        height: 180,
        kind: 'scrap',
        seed: `run-event:${event.id}:${choice.id}`,
        depth: 502.2,
        alpha: 0.58,
      });
      const indexPlate = this.scene.add.rectangle(x - 139, y - 80, 38, 38, 0x0d0f14, 1)
        .setStrokeStyle(3, accent)
        .setDepth(502.4);
      const indexText = this.scene.add.text(x - 139, y - 80, index === 0 ? 'A' : 'B', {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '18px', color: '#fff7eb',
        stroke: '#090a0d', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(503);
      const label = this.scene.add.text(x, y - 63, choice.label.toUpperCase(), {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '17px', color: '#fff5df', stroke: '#0c0d12', strokeThickness: 4,
        align: 'center', wordWrap: { width: 260 },
      }).setOrigin(0.5).setDepth(503);
      const divider = this.scene.add.rectangle(x, y - 25, 250, 2, accent, 0.42).setDepth(502.5);
      const description = this.scene.add.text(x, y + 17, choice.description, {
        fontSize: '12px', color: '#c7c0ca', align: 'center', lineSpacing: 4, wordWrap: { width: 272 },
      }).setOrigin(0.5).setDepth(503);

      const costWidth = choice.costCoins > 0 ? 126 : 110;
      const costPlate = this.scene.add.rectangle(x, y + 78, costWidth, 30, choice.costCoins > 0 ? 0x4e371d : 0x263d25, 1)
        .setStrokeStyle(2, choice.costCoins > 0 ? 0xffd56e : PANEL_VISUALS.neonLime)
        .setDepth(502.6);
      const cost = this.scene.add.text(x, y + 78, choice.costCoins > 0 ? `◈  COST ${choice.costCoins}` : '✓  NO COST', {
        fontSize: '10px', color: choice.costCoins > 0 ? '#ffe9a9' : '#dfffc4', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(503);

      const cardObjects = [cardShadow, card, cardInner, cardWear, indexPlate, indexText, label, divider, description, costPlate, cost];
      const setScale = (value: number): void => {
        for (const object of cardObjects) object.setScale(value);
      };
      const restore = (): void => {
        setScale(1);
        card.setFillStyle(fill).setStrokeStyle(4, accent);
      };

      card.on('pointerover', () => {
        card.setFillStyle(index === 0 ? 0x49305a : 0x254858).setStrokeStyle(5, accent);
        this.scene.tweens.add({ targets: cardObjects, scaleX: 1.018, scaleY: 1.018, duration: 120, ease: 'Quad.Out' });
      });
      card.on('pointerout', () => {
        this.scene.tweens.killTweensOf(cardObjects);
        restore();
      });
      card.on('pointerdown', () => setScale(0.985));
      card.on('pointerupoutside', restore);
      card.on('pointerup', () => {
        restore();
        if (!this.currentEvent) return;
        const chosenEvent = this.currentEvent;
        const result = this.onChoose(chosenEvent, choice);
        if (!result.ok) {
          status.setText(result.message.toUpperCase()).setColor('#ff9aaa');
          this.scene.tweens.add({
            targets: card,
            x: { from: x - 5, to: x + 5 },
            yoyo: true,
            repeat: 2,
            duration: 55,
            onComplete: () => card.setX(x),
          });
          return;
        }
        telemetry.track('run_event_choice', { eventId: chosenEvent.id, choiceId: choice.id });
        status.setText(result.message.toUpperCase()).setColor('#c9ff72');
        this.scene.time.delayedCall(180, () => this.hide());
      });

      this.objects.push(...cardObjects);
    });
  }

  hide(): void {
    for (const object of this.objects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }
    this.objects.length = 0;
    this.currentEvent = null;
  }
}
