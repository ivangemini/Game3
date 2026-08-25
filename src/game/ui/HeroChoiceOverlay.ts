import * as Phaser from 'phaser';
import type { HeroDefinition, HeroId } from '../domain/heroes';

export class HeroChoiceOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private visible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly heroes: readonly HeroDefinition[],
    private readonly onSelected: (heroId: HeroId) => void,
  ) {}

  isVisible(): boolean {
    return this.visible;
  }

  show(): void {
    this.hide();
    if (this.heroes.length === 0) return;
    this.visible = true;

    const backdrop = this.scene.add.rectangle(800, 450, 1600, 900, 0x07080d, 0.9)
      .setInteractive()
      .setDepth(220);
    const panel = this.scene.add.rectangle(800, 450, 1180, 470, 0x171922, 1)
      .setStrokeStyle(6, 0xb5ff4d)
      .setDepth(221);
    const title = this.scene.add.text(800, 250, 'CHOOSE YOUR JUNK PILOT', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '32px',
      color: '#fff2a8',
      stroke: '#11121a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(222);
    const subtitle = this.scene.add.text(800, 294, 'A light rule-bender for this run — not a class lock.', {
      fontSize: '16px', color: '#bdb7c7',
    }).setOrigin(0.5).setDepth(222);
    this.objects.push(backdrop, panel, title, subtitle);

    this.heroes.slice(0, 4).forEach((hero, index) => {
      const x = 365 + index * 290;
      const card = this.scene.add.rectangle(x, 474, 250, 270, 0x22242e, 1)
        .setStrokeStyle(4, 0x7e9360)
        .setInteractive({ useHandCursor: true })
        .setDepth(222);
      const titleText = this.scene.add.text(x, 375, hero.title.toUpperCase(), {
        fontSize: '11px', color: '#b5ff4d', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(223);
      const name = this.scene.add.text(x, 414, hero.name.toUpperCase(), {
        fontSize: '22px', color: '#fff8ec', fontStyle: 'bold', align: 'center',
        wordWrap: { width: 220 },
      }).setOrigin(0.5).setDepth(223);
      const description = this.scene.add.text(x, 495, hero.description, {
        fontSize: '13px', color: '#d5cedd', align: 'center', lineSpacing: 4,
        wordWrap: { width: 210 },
      }).setOrigin(0.5).setDepth(223);
      const pick = this.scene.add.text(x, 587, 'START WITH HERO', {
        fontSize: '13px', color: '#dfffc5', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(223);

      card.on('pointerover', () => card.setFillStyle(0x303341));
      card.on('pointerout', () => card.setFillStyle(0x22242e));
      card.on('pointerdown', () => card.setScale(0.97));
      card.on('pointerup', () => {
        card.setScale(1);
        if (!this.visible) return;
        this.onSelected(hero.id);
      });
      this.objects.push(card, titleText, name, description, pick);
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }
}
