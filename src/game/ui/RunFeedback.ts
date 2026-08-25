import * as Phaser from 'phaser';

export class RunFeedback {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {}

  purchase(name: string): void {
    this.toast(`PACKED • ${name.toUpperCase()}`, 0xb5ff4d, 650);
    this.burst(440, 640, 0xb5ff4d, 8);
  }

  rewardCoins(amount: number): void {
    this.toast(`+${Math.max(0, Math.floor(amount))} SCRAP COINS`, 0xffd56e, 698);
    this.burst(760, 690, 0xffd56e, 7);
  }

  fusion(name: string): void {
    const label = this.scene.add.text(800, 445, `FUSION COMPLETE\n${name.toUpperCase()}`, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '30px',
      align: 'center',
      color: '#ffe7ff',
      stroke: '#411a4a',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(930);
    const ring = this.scene.add.circle(800, 445, 86, 0xd87bff, 0.08).setStrokeStyle(6, 0xe18aff, 0.9).setDepth(929);
    if (!this.reducedMotion) {
      label.setScale(0.82);
      this.scene.tweens.add({ targets: label, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
      this.scene.tweens.add({ targets: ring, scaleX: 1.65, scaleY: 1.65, alpha: 0, duration: 360, ease: 'Quad.Out' });
      this.burst(800, 445, 0xe18aff, 14);
    }
    this.scene.time.delayedCall(this.reducedMotion ? 140 : 430, () => { label.destroy(); ring.destroy(); });
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
    this.toast(`EVENT DROP • ${name.toUpperCase()}`, 0xff91e6, 650);
    this.burst(440, 640, 0xff91e6, 8);
  }

  private toast(text: string, color: number, y: number): void {
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const label = this.scene.add.text(800, y, text, {
      fontSize: '15px', color: hex, fontStyle: 'bold',
      stroke: '#090a0d', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(920);
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
      const dot = this.scene.add.circle(x, y, 3 + (index % 2), color, 0.9).setDepth(919);
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
}
