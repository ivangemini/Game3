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

  isVisible(): boolean { return this.visible; }

  show(): void {
    this.hide();
    if (this.heroes.length === 0) return;
    this.visible = true;

    const backdrop = this.scene.add.rectangle(800, 450, 1600, 900, 0x07080d, 0.34).setInteractive().setDepth(220);
    const art = addProductionPlate(this.scene, 800, 450, 1600, 900, { region: 'full', depth: 220.05, alpha: 0.78 });
    const shade = this.scene.add.rectangle(800, 450, 1600, 900, 0x07080d, 0.18).setDepth(220.1);
    const titlePlate = createMaterialSurface(this.scene, { x: 800, y: 122, width: 650, height: 116, kind: 'scrap', seed: 'hero-lineup:title', depth: 221, alpha: 0.88 });
    const title = this.scene.add.text(800, 100, 'CHOOSE YOUR JUNK PILOT', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '42px', color: '#fff0a8', stroke: '#17100d', strokeThickness: 9,
    }).setOrigin(0.5).setAngle(-1).setDepth(223);
    const subtitle = this.scene.add.text(800, 151, 'PICK A PILOT  •  RAID THE JUNKYARD  •  BREAK THE BOSSES', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#b5ff4d', stroke: '#17100d', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(223);
    this.objects.push(backdrop, shade, titlePlate, title, subtitle);
    if (art) this.objects.push(art);

    this.heroes.slice(0, 4).forEach((hero, index) => {
      const x = 330 + index * 315;
      const y = 478 + (index % 2 === 0 ? -7 : 8);
      const angle = [-2.4, 1.5, -1.2, 2.1][index] ?? 0;
      const shadow = this.scene.add.rectangle(x + 9, y + 12, 270, 430, 0x050508, 0.58).setAngle(angle).setDepth(221.4);
      const card = this.scene.add.rectangle(x, y, 270, 430, 0x3a2b20, 0.42)
        .setStrokeStyle(6, index === 0 ? 0xb5ff4d : 0xd0a66b, 0.9).setAngle(angle).setInteractive({ useHandCursor: true }).setDepth(222);
      const painted = addProductionPlate(this.scene, x, y, 256, 416, {
        region: index === 0 ? 'hero' : index === 3 ? 'perk' : 'backpack', depth: 222.05, alpha: index === 0 ? 0.88 : 0.62, flipX: index >= 2,
        tint: index === 1 ? 0xe2f7ff : index === 2 ? 0xf4e2ff : undefined,
      });
      painted?.setAngle(angle);
      const wear = createMaterialSurface(this.scene, { x, y, width: 256, height: 416, kind: index === 0 ? 'leather' : 'paper', seed: `hero-lineup:${hero.id}`, depth: 222.2, alpha: 0.42 });
      wear.setAngle(angle);
      const tape = this.scene.add.rectangle(x, y - 215, 128, 24, 0xe8d29c, 0.96).setStrokeStyle(2, 0x6d4c2d, 0.8).setAngle(angle + (index % 2 ? -4 : 4)).setDepth(224);
      const portrait = createAuthoredPortraitSlot(this.scene, heroArtKey(hero.id), x, y - 72, 178, 178, 223);
      portrait.setAngle(angle * 0.3);
      const portraitFrame = this.scene.add.rectangle(x, y - 72, 194, 194, 0x090a0f, 0.04).setStrokeStyle(5, index === 0 ? 0xb5ff4d : 0xc36cff, 0.82).setAngle(angle).setDepth(223.4);
      const name = this.scene.add.text(x, y + 54, hero.name.toUpperCase(), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '25px', color: '#fff8e9', stroke: '#17100d', strokeThickness: 6, align: 'center', wordWrap: { width: 226 },
      }).setOrigin(0.5).setAngle(angle).setDepth(224);
      const role = this.scene.add.text(x, y + 91, hero.title.toUpperCase(), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '12px', color: '#b5ff4d', stroke: '#17100d', strokeThickness: 4,
      }).setOrigin(0.5).setAngle(angle).setDepth(224);
      const description = this.scene.add.text(x, y + 137, hero.description, {
        fontSize: '12px', color: '#fff5df', align: 'center', lineSpacing: 3, stroke: '#17100d', strokeThickness: 3, wordWrap: { width: 218 },
      }).setOrigin(0.5).setAngle(angle).setDepth(224);
      const pickPlate = this.scene.add.rectangle(x, y + 190, 166, 38, 0x17100d, 0.82).setStrokeStyle(3, 0xb5ff4d, 0.85).setAngle(angle).setDepth(223.5);
      const pick = this.scene.add.text(x, y + 190, 'GRAB & GO!', { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#fff3b2', stroke: '#17100d', strokeThickness: 4 }).setOrigin(0.5).setAngle(angle).setDepth(224);

      card.on('pointerover', () => { card.setScale(1.045); portrait.setScale(1.07); painted?.setAlpha(0.94); });
      card.on('pointerout', () => { card.setScale(1); portrait.setScale(1); painted?.setAlpha(index === 0 ? 0.88 : 0.62); });
      card.on('pointerdown', () => { card.setScale(0.98); portrait.setScale(1.02); });
      card.on('pointerup', () => {
        card.setScale(1.045); portrait.setScale(1.07);
        if (!this.visible) return;
        telemetry.track('hero_selected', { heroId: hero.id });
        this.onSelected(hero.id);
      });
      this.objects.push(shadow, card, wear, tape, portrait, portraitFrame, name, role, description, pickPlate, pick);
      if (painted) this.objects.push(painted);
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }
}
