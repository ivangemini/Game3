import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import type { HeroDefinition, HeroId } from '../domain/heroes';
import { createAuthoredPortraitSlot, heroArtKey } from './authoredArt';
import { createMaterialSurface } from './materialSurface';
import { addProductionPlate } from './productionPlate';

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
    const panel = this.scene.add.rectangle(800, 450, 1240, 520, 0x171922, 1)
      .setStrokeStyle(6, 0xb5ff4d)
      .setDepth(221);
    const paintedPanel = addProductionPlate(this.scene, 800, 450, 1218, 498, {
      region: 'full',
      depth: 221.05,
      alpha: 0.13,
    });
    const panelWear = createMaterialSurface(this.scene, {
      x: 800,
      y: 450,
      width: 1218,
      height: 498,
      kind: 'scrap',
      seed: 'hero-choice:panel',
      depth: 221.2,
      alpha: 0.56,
    });
    const title = this.scene.add.text(800, 215, 'CHOOSE YOUR JUNK PILOT', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '32px',
      color: '#fff2a8',
      stroke: '#11121a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(222);
    const subtitle = this.scene.add.text(800, 258, 'ONE TAP → STRAIGHT INTO THE RUN  •  HELP OPENS THE FIELD MANUAL ANYTIME', {
      fontSize: '14px', color: '#bdb7c7', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(222);
    this.objects.push(backdrop, panel, panelWear, title, subtitle);
    if (paintedPanel) this.objects.push(paintedPanel);

    this.heroes.slice(0, 4).forEach((hero, index) => {
      const x = 365 + index * 290;
      const card = this.scene.add.rectangle(x, 480, 254, 326, 0x22242e, 0.94)
        .setStrokeStyle(4, 0x7e9360)
        .setInteractive({ useHandCursor: true })
        .setDepth(222);
      const paintedCard = addProductionPlate(this.scene, x, 480, 238, 310, {
        region: index % 2 === 0 ? 'backpack' : 'boss',
        depth: 222.05,
        alpha: 0.22,
        flipX: index >= 2,
        tint: index % 2 === 0 ? 0xe6ffd0 : 0xf2d8ff,
      });
      const cardWear = createMaterialSurface(this.scene, {
        x,
        y: 480,
        width: 238,
        height: 310,
        kind: 'scrap',
        seed: `hero-choice:${hero.id}`,
        depth: 222.1,
        alpha: 0.42,
      });
      const tape = this.scene.add.rectangle(x, 319, 116, 19, 0xe8d8ae, 0.88)
        .setStrokeStyle(1, 0x8b7351, 0.65)
        .setAngle(index % 2 === 0 ? -2.2 : 1.8)
        .setDepth(223);
      const tapeWear = createMaterialSurface(this.scene, {
        x,
        y: 319,
        width: 108,
        height: 13,
        kind: 'paper',
        seed: `hero-choice:tape:${hero.id}`,
        depth: 223.1,
        alpha: 0.7,
      });
      const titleText = this.scene.add.text(x, 334, hero.title.toUpperCase(), {
        fontSize: '11px', color: '#b5ff4d', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(224);
      const name = this.scene.add.text(x, 365, hero.name.toUpperCase(), {
        fontSize: '22px', color: '#fff8ec', fontStyle: 'bold', align: 'center',
        wordWrap: { width: 220 },
      }).setOrigin(0.5).setDepth(224);
      const portrait = createAuthoredPortraitSlot(this.scene, heroArtKey(hero.id), x, 438, 124, 124, 223);
      const portraitFrame = this.scene.add.rectangle(x, 438, 136, 136, 0x090a0f, 0.08)
        .setStrokeStyle(2, index % 2 === 0 ? 0xb5ff4d : 0xc36cff, 0.62)
        .setDepth(223.4);
      const description = this.scene.add.text(x, 541, hero.description, {
        fontSize: '12px', color: '#d5cedd', align: 'center', lineSpacing: 3,
        wordWrap: { width: 216 },
      }).setOrigin(0.5).setDepth(224);
      const pick = this.scene.add.text(x, 622, 'PICK & PLAY', {
        fontSize: '13px', color: '#dfffc5', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(224);

      card.on('pointerover', () => {
        card.setFillStyle(0x303341, 0.88);
        portrait.setScale(1.04);
        paintedCard?.setAlpha(0.3);
      });
      card.on('pointerout', () => {
        card.setFillStyle(0x22242e, 0.94);
        portrait.setScale(1);
        paintedCard?.setAlpha(0.22);
      });
      card.on('pointerdown', () => {
        card.setScale(0.97);
        portrait.setScale(0.98);
      });
      card.on('pointerup', () => {
        card.setScale(1);
        portrait.setScale(1.04);
        if (!this.visible) return;
        telemetry.track('hero_selected', { heroId: hero.id });
        this.onSelected(hero.id);
      });
      this.objects.push(card, cardWear, tape, tapeWear, titleText, name, portrait, portraitFrame, description, pick);
      if (paintedCard) this.objects.push(paintedCard);
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }
}
