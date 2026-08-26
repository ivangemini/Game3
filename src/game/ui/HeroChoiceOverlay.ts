import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import type { HeroDefinition, HeroId } from '../domain/heroes';
import { createAuthoredPortraitSlot, heroArtKey } from './authoredArt';
import { createMaterialSurface } from './materialSurface';

const HERO_ACCENTS: Record<HeroId, number> = {
  scavenger: 0xffcf69,
  engineer: 0x68e7ff,
  alchemist: 0xb7ff5d,
  beastfriend: 0xff86c9,
};

function heroBuildHook(hero: HeroDefinition): string {
  if (hero.startingCoinsBonus > 0) return `+${hero.startingCoinsBonus} STARTING SCRAP`;
  if (hero.bonuses.poisonOnHit && hero.bonuses.poisonOnHit > 0) return `POISON TRIGGERS +${hero.bonuses.poisonOnHit}`;
  if (hero.bonuses.triggerSpeedPct && hero.bonuses.triggerSpeedPct > 0) {
    return `${(hero.targetTag ?? 'TAG').toUpperCase()} +${hero.bonuses.triggerSpeedPct}% SPEED`;
  }
  return 'FLEXIBLE START';
}

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

    const backdrop = this.scene.add.rectangle(800, 450, 1600, 900, 0x05060a, 0.93)
      .setInteractive()
      .setDepth(220);
    const haloLeft = this.scene.add.circle(260, 700, 330, 0x748f32, 0.055).setDepth(220.1);
    const haloRight = this.scene.add.circle(1370, 220, 360, 0x8731b0, 0.07).setDepth(220.1);
    const panelShadow = this.scene.add.rectangle(808, 459, 1282, 554, 0x010205, 0.62).setDepth(220.4);
    const panel = this.scene.add.rectangle(800, 450, 1274, 548, 0x171922, 1)
      .setStrokeStyle(6, 0x7f9850)
      .setDepth(221);
    const panelInner = this.scene.add.rectangle(800, 450, 1252, 526, 0x10131a, 0.96)
      .setStrokeStyle(2, 0x555b66, 0.62)
      .setDepth(221.1);
    const panelWear = createMaterialSurface(this.scene, {
      x: 800,
      y: 450,
      width: 1238,
      height: 512,
      kind: 'scrap',
      seed: 'hero-choice:panel-v2',
      depth: 221.2,
      alpha: 0.75,
    });

    const titlePlate = this.scene.add.rectangle(800, 213, 520, 58, 0x4d3528, 1)
      .setStrokeStyle(4, 0xc38c5d)
      .setAngle(-0.7)
      .setDepth(221.5);
    const titleWear = createMaterialSurface(this.scene, {
      x: 800,
      y: 213,
      width: 500,
      height: 42,
      kind: 'paper',
      seed: 'hero-choice:title',
      depth: 221.6,
      alpha: 0.56,
    }).setAngle(-0.7);
    const title = this.scene.add.text(800, 211, 'PICK YOUR JUNK PILOT', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '32px',
      color: '#fff0ad',
      stroke: '#11121a',
      strokeThickness: 7,
    }).setOrigin(0.5).setAngle(-0.7).setDepth(222);
    const subtitle = this.scene.add.text(800, 258, 'FOUR PILOTS • FOUR OPENING ANGLES • EVERY BUILD CAN STILL PIVOT', {
      fontSize: '12px', color: '#bdb7c7', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5).setDepth(222);
    this.objects.push(
      backdrop, haloLeft, haloRight, panelShadow, panel, panelInner, panelWear,
      titlePlate, titleWear, title, subtitle,
    );

    this.heroes.slice(0, 4).forEach((hero, index) => {
      const x = 365 + index * 290;
      const accent = HERO_ACCENTS[hero.id] ?? 0xb5ff4d;
      const cardShadow = this.scene.add.rectangle(x + 5, 485, 258, 338, 0x030407, 0.66).setDepth(221.7);
      const card = this.scene.add.rectangle(x, 480, 258, 338, 0x22242e, 1)
        .setStrokeStyle(4, accent, 0.78)
        .setInteractive({ useHandCursor: true })
        .setDepth(222);
      const inner = this.scene.add.rectangle(x, 480, 244, 324, 0x171a22, 0.98)
        .setStrokeStyle(1, 0x646a75, 0.46)
        .setDepth(222.05);
      const cardWear = createMaterialSurface(this.scene, {
        x,
        y: 480,
        width: 236,
        height: 316,
        kind: 'scrap',
        seed: `hero-choice:${hero.id}:v2`,
        depth: 222.1,
        alpha: 0.62,
      });

      const tape = this.scene.add.rectangle(x, 318, 126, 20, 0xe8d8ae, 0.92)
        .setStrokeStyle(1, 0x8b7351, 0.65)
        .setAngle(index % 2 === 0 ? -2.2 : 1.8)
        .setDepth(223);
      const tapeWear = createMaterialSurface(this.scene, {
        x,
        y: 318,
        width: 116,
        height: 13,
        kind: 'paper',
        seed: `hero-choice:tape:${hero.id}`,
        depth: 223.1,
        alpha: 0.7,
      }).setAngle(index % 2 === 0 ? -2.2 : 1.8);
      const titleText = this.scene.add.text(x, 333, hero.title.toUpperCase(), {
        fontSize: '10px', color: `#${accent.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(224);
      const name = this.scene.add.text(x, 360, hero.name.toUpperCase(), {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '21px', color: '#fff8ec', fontStyle: 'bold', align: 'center',
        stroke: '#101117', strokeThickness: 4, wordWrap: { width: 220 },
      }).setOrigin(0.5).setDepth(224);

      const portraitFrame = this.scene.add.rectangle(x, 440, 144, 136, 0x0c0f15, 1)
        .setStrokeStyle(3, accent, 0.72)
        .setDepth(222.7);
      const portrait = createAuthoredPortraitSlot(this.scene, heroArtKey(hero.id), x, 440, 132, 124, 223);

      const hookPlate = this.scene.add.rectangle(x, 514, 208, 28, 0x101219, 0.98)
        .setStrokeStyle(2, accent, 0.64)
        .setDepth(223.2);
      const hook = this.scene.add.text(x, 514, heroBuildHook(hero), {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '10px', color: `#${accent.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
        stroke: '#0d0f14', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(224);

      const description = this.scene.add.text(x, 559, hero.description, {
        fontSize: '10px', color: '#d5cedd', align: 'center', lineSpacing: 2,
        wordWrap: { width: 216 },
      }).setOrigin(0.5).setDepth(224);

      const pickButton = this.scene.add.rectangle(x, 625, 172, 36, 0x293b25, 1)
        .setStrokeStyle(3, accent, 0.9)
        .setDepth(223.2);
      const pick = this.scene.add.text(x, 625, 'TAKE THE BAG', {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '11px', color: '#efffe0', fontStyle: 'bold', stroke: '#0b1009', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(224);

      const bolts: Phaser.GameObjects.Arc[] = [];
      for (const [boltX, boltY] of [
        [x - 119, 324], [x + 119, 324], [x - 119, 636], [x + 119, 636],
      ] as const) {
        bolts.push(this.scene.add.circle(boltX, boltY, 4, 0x555b65, 1)
          .setStrokeStyle(1, 0xbac1cb, 0.58)
          .setDepth(224));
      }

      card.on('pointerover', () => {
        card.setFillStyle(0x303341).setStrokeStyle(5, accent, 1);
        portrait.setScale(1.04);
        pickButton.setFillStyle(0x3b5735);
      });
      card.on('pointerout', () => {
        card.setFillStyle(0x22242e).setStrokeStyle(4, accent, 0.78);
        portrait.setScale(1);
        pickButton.setFillStyle(0x293b25);
      });
      card.on('pointerdown', () => {
        card.setScale(0.985);
        portrait.setScale(0.99);
        pickButton.setScale(0.97);
        pick.setScale(0.97);
      });
      const restore = (): void => {
        card.setScale(1);
        portrait.setScale(1.04);
        pickButton.setScale(1);
        pick.setScale(1);
      };
      card.on('pointerupoutside', restore);
      card.on('pointerup', () => {
        restore();
        if (!this.visible) return;
        telemetry.track('hero_selected', { heroId: hero.id });
        this.onSelected(hero.id);
      });
      this.objects.push(
        cardShadow, card, inner, cardWear, tape, tapeWear, titleText, name, portraitFrame, portrait,
        hookPlate, hook, description, pickButton, pick, ...bolts,
      );
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }
}
