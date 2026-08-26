import * as Phaser from 'phaser';

const FEEDBACK_DEPTH = 920;

export class RunFeedback {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {}

  purchase(name: string): void {
    this.itemReveal('PACKED', name, 0xb5ff4d, 650);
    this.burst(440, 640, 0xb5ff4d, 8);
  }

  rewardCoins(amount: number): void {
    const safeAmount = Math.max(0, Math.floor(amount));
    this.coinReveal(safeAmount, 698);
    this.burst(760, 690, 0xffd56e, 7);
  }

  fusion(name: string): void {
    const centerX = 800;
    const centerY = 445;
    const ring = this.scene.add.circle(centerX, centerY, 82, 0xd87bff, 0.08)
      .setStrokeStyle(6, 0xe18aff, 0.92)
      .setDepth(FEEDBACK_DEPTH + 8);
    const outerRing = this.scene.add.circle(centerX, centerY, 106, 0xd87bff, 0)
      .setStrokeStyle(2, 0xffd8ff, 0.5)
      .setDepth(FEEDBACK_DEPTH + 7);
    const card = this.createRevealCard('FUSION COMPLETE', name, 0xe18aff, centerX, centerY);
    card.setDepth(FEEDBACK_DEPTH + 10);

    if (!this.reducedMotion) {
      card.setScale(0.78).setAlpha(0);
      ring.setScale(0.72).setAlpha(0);
      outerRing.setScale(0.72).setAlpha(0);
      this.scene.tweens.add({
        targets: card,
        scaleX: 1.04,
        scaleY: 1.04,
        alpha: 1,
        duration: 170,
        ease: 'Back.Out',
        onComplete: () => {
          this.scene.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 100, ease: 'Quad.Out' });
        },
      });
      this.scene.tweens.add({
        targets: ring,
        scaleX: 1.65,
        scaleY: 1.65,
        alpha: 0,
        duration: 380,
        ease: 'Quad.Out',
      });
      this.scene.tweens.add({
        targets: outerRing,
        scaleX: 1.35,
        scaleY: 1.35,
        alpha: 0,
        delay: 55,
        duration: 430,
        ease: 'Quad.Out',
      });
      this.burst(centerX, centerY, 0xe18aff, 16);
    }

    const lifetime = this.reducedMotion ? 520 : 880;
    if (!this.reducedMotion) {
      this.scene.tweens.add({
        targets: card,
        y: centerY - 8,
        alpha: 0,
        delay: 590,
        duration: 220,
        ease: 'Quad.In',
      });
    }
    this.scene.time.delayedCall(lifetime, () => {
      card.destroy();
      ring.destroy();
      outerRing.destroy();
    });
  }

  pocketUnlock(): void {
    this.toast('BACKPACK POCKET UNLOCKED', 0x7cf2ff, 632);
    const flash = this.scene.add.rectangle(431, 599, 225, 74, 0x7cf2ff, 0.16)
      .setStrokeStyle(5, 0x7cf2ff, 0.9).setDepth(185);
    if (!this.reducedMotion) {
      this.scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.06, scaleY: 1.06, duration: 360, ease: 'Quad.Out' });
    }
    this.scene.time.delayedCall(this.reducedMotion ? 180 : 380, () => flash.destroy());
  }

  eventItem(name: string): void {
    this.itemReveal('EVENT DROP', name, 0xff91e6, 650);
    this.burst(440, 640, 0xff91e6, 10);
  }

  milestone(kicker: string, value: string, color: number): void {
    const centerX = 800;
    const centerY = 430;
    const hex = this.toHex(color);
    const root = this.scene.add.container(centerX, centerY).setDepth(FEEDBACK_DEPTH + 24);
    const shadow = this.scene.add.rectangle(7, 9, 520, 114, 0x050609, 0.78);
    const plate = this.scene.add.rectangle(0, 0, 520, 114, 0x11141c, 0.985).setStrokeStyle(5, color, 0.95);
    const inner = this.scene.add.rectangle(0, 0, 496, 90, 0x1b2029, 0.88).setStrokeStyle(1, color, 0.28);
    const kickerText = this.scene.add.text(0, -27, kicker.toUpperCase(), {
      fontSize: '13px', color: hex, fontStyle: 'bold', letterSpacing: 2,
      stroke: '#08090d', strokeThickness: 4,
    }).setOrigin(0.5);
    const valueText = this.scene.add.text(0, 16, value.toUpperCase(), {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '28px', color: '#fff8ef',
      fontStyle: 'bold', stroke: '#08090d', strokeThickness: 6,
    }).setOrigin(0.5);
    root.add([shadow, plate, inner, kickerText, valueText]);

    const flash = this.scene.add.rectangle(centerX, centerY, 1600, 900, color, this.reducedMotion ? 0.035 : 0.08)
      .setDepth(FEEDBACK_DEPTH + 18);
    if (!this.reducedMotion) {
      root.setScale(0.86).setAlpha(0);
      this.scene.tweens.add({ targets: root, scaleX: 1.03, scaleY: 1.03, alpha: 1, duration: 210, ease: 'Back.Out' });
      this.scene.tweens.add({ targets: root, scaleX: 1, scaleY: 1, duration: 90, delay: 210, ease: 'Quad.Out' });
      this.scene.tweens.add({ targets: flash, alpha: 0, duration: 280, ease: 'Quad.Out' });
      this.scene.tweens.add({ targets: root, y: centerY - 8, alpha: 0, delay: 780, duration: 220, ease: 'Quad.In' });
      this.burst(centerX, centerY, color, 20);
    }
    this.scene.time.delayedCall(this.reducedMotion ? 680 : 1040, () => {
      root.destroy();
      flash.destroy();
    });
  }

  private itemReveal(kicker: string, name: string, color: number, y: number): void {
    const card = this.createRevealCard(kicker, name, color, 800, y);
    card.setDepth(FEEDBACK_DEPTH + 4);

    const accentLeft = this.scene.add.rectangle(646, y, 6, 58, color, 0.95).setDepth(FEEDBACK_DEPTH + 3);
    const accentRight = this.scene.add.rectangle(954, y, 6, 58, color, 0.95).setDepth(FEEDBACK_DEPTH + 3);

    if (!this.reducedMotion) {
      card.setScale(0.92).setAlpha(0).setY(y + 12);
      accentLeft.setScale(1, 0.2).setAlpha(0);
      accentRight.setScale(1, 0.2).setAlpha(0);
      this.scene.tweens.add({
        targets: card,
        y,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 180,
        ease: 'Back.Out',
      });
      this.scene.tweens.add({
        targets: [accentLeft, accentRight],
        scaleY: 1,
        alpha: 1,
        duration: 140,
        ease: 'Quad.Out',
      });
      this.scene.tweens.add({
        targets: [card, accentLeft, accentRight],
        alpha: 0,
        y: '-=8',
        delay: 560,
        duration: 180,
        ease: 'Quad.In',
      });
    }

    this.scene.time.delayedCall(this.reducedMotion ? 560 : 780, () => {
      card.destroy();
      accentLeft.destroy();
      accentRight.destroy();
    });
  }

  private coinReveal(amount: number, y: number): void {
    const card = this.createRevealCard('SCRAP PAYOUT', `+${amount} COINS`, 0xffd56e, 800, y);
    card.setDepth(FEEDBACK_DEPTH + 4);

    const coins = [-1, 0, 1].map((offset) => {
      const coin = this.scene.add.circle(800 + offset * 28, y - 39, 8, 0xffd56e, 1)
        .setStrokeStyle(2, 0x7a5520, 0.95)
        .setDepth(FEEDBACK_DEPTH + 5);
      const shine = this.scene.add.circle(797 + offset * 28, y - 42, 2, 0xfff3b0, 0.9)
        .setDepth(FEEDBACK_DEPTH + 6);
      return { coin, shine, offset };
    });

    if (!this.reducedMotion) {
      card.setAlpha(0).setScale(0.94).setY(y + 10);
      this.scene.tweens.add({
        targets: card,
        y,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 170,
        ease: 'Back.Out',
      });
      for (const { coin, shine, offset } of coins) {
        coin.setY(y - 22).setAlpha(0).setScale(0.55);
        shine.setY(y - 25).setAlpha(0).setScale(0.55);
        this.scene.tweens.add({
          targets: [coin, shine],
          y: y - 39,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          delay: 50 + (offset + 1) * 45,
          duration: 190,
          ease: 'Back.Out',
        });
      }
      this.scene.tweens.add({
        targets: [card, ...coins.flatMap(({ coin, shine }) => [coin, shine])],
        alpha: 0,
        y: '-=8',
        delay: 610,
        duration: 180,
        ease: 'Quad.In',
      });
    }

    this.scene.time.delayedCall(this.reducedMotion ? 580 : 830, () => {
      card.destroy();
      for (const { coin, shine } of coins) {
        coin.destroy();
        shine.destroy();
      }
    });
  }

  private createRevealCard(kicker: string, value: string, color: number, x: number, y: number): Phaser.GameObjects.Container {
    const hex = this.toHex(color);
    const container = this.scene.add.container(x, y);
    const shadow = this.scene.add.rectangle(4, 5, 300, 66, 0x07090d, 0.72).setStrokeStyle(2, 0x07090d, 0.4);
    const plate = this.scene.add.rectangle(0, 0, 300, 66, 0x171820, 0.97).setStrokeStyle(3, color, 0.95);
    const inset = this.scene.add.rectangle(0, 0, 286, 52, 0x22242d, 0.82).setStrokeStyle(1, color, 0.25);
    const kickerText = this.scene.add.text(0, -16, kicker, {
      fontSize: '10px', color: hex, fontStyle: 'bold', letterSpacing: 1,
      stroke: '#090a0d', strokeThickness: 3,
    }).setOrigin(0.5);
    const valueText = this.scene.add.text(0, 8, value.toUpperCase(), {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '19px', color: '#fff8ef', fontStyle: 'bold',
      stroke: '#090a0d', strokeThickness: 4,
    }).setOrigin(0.5);
    container.add([shadow, plate, inset, kickerText, valueText]);
    return container;
  }

  private toast(text: string, color: number, y: number): void {
    const hex = this.toHex(color);
    const label = this.scene.add.text(800, y, text, {
      fontSize: '15px', color: hex, fontStyle: 'bold',
      stroke: '#090a0d', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(FEEDBACK_DEPTH);
    if (!this.reducedMotion) {
      label.setY(y + 8).setAlpha(0);
      this.scene.tweens.add({ targets: label, y, alpha: 1, duration: 140, ease: 'Quad.Out' });
      this.scene.tweens.add({ targets: label, alpha: 0, delay: 520, duration: 180, ease: 'Quad.In' });
    }
    this.scene.time.delayedCall(this.reducedMotion ? 500 : 760, () => label.destroy());
  }

  private burst(x: number, y: number, color: number, count: number): void {
    if (this.reducedMotion) return;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const radius = 30 + (index % 3) * 10;
      const dot = this.scene.add.circle(x, y, 3 + (index % 2), color, 0.9).setDepth(FEEDBACK_DEPTH - 1);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        scaleX: 0.4,
        scaleY: 0.4,
        duration: 260 + (index % 3) * 35,
        ease: 'Quad.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private toHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
