import * as Phaser from 'phaser';
import type { PerkDefinition } from '../domain/perks';
import { createMaterialSurface } from './materialSurface';
import { addProductionPlate } from './productionPlate';

const RARITY_COLORS = {
  common: 0xb9b5aa,
  uncommon: 0x94df68,
  rare: 0x63b9ff,
  epic: 0xd87bff,
} as const;

export class PerkChoiceOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private visible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly perks: ReadonlyMap<string, PerkDefinition>,
    private readonly onSelected: (perkId: string) => void,
  ) {}

  show(perkIds: readonly string[]): void {
    this.hide();
    const choices = perkIds
      .map((id) => this.perks.get(id))
      .filter((perk): perk is PerkDefinition => perk !== undefined)
      .slice(0, 3);
    if (choices.length === 0) return;
    this.visible = true;

    const backdrop = this.scene.add.rectangle(800, 450, 1600, 900, 0x07080d, 0.84)
      .setInteractive()
      .setDepth(200);
    const panel = this.scene.add.rectangle(800, 450, 1050, 430, 0x171922, 0.96)
      .setStrokeStyle(6, 0xc36cff)
      .setDepth(201);
    const paintedPanel = addProductionPlate(this.scene, 800, 450, 1028, 408, {
      region: 'full', depth: 201.05, alpha: 0.16, tint: 0xf2ddff,
    });
    const panelWear = createMaterialSurface(this.scene, {
      x: 800, y: 450, width: 1024, height: 404, kind: 'scrap', seed: 'perk-choice:panel',
      depth: 201.1, alpha: 0.42,
    });
    const titleTape = this.scene.add.rectangle(800, 278, 666, 49, 0x4f315b, 0.92)
      .setStrokeStyle(2, 0xd59bff, 0.62).setAngle(-0.6).setDepth(201.8);
    const title = this.scene.add.text(800, 278, 'TV TYRANT DOWN — CHOOSE ONE WEIRD UPGRADE', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '29px',
      color: '#fff2a8',
      stroke: '#11121a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(202);
    const subtitle = this.scene.add.text(800, 318, 'The choice is permanent for this run and changes future combat.', {
      fontSize: '15px',
      color: '#d2c9d9',
    }).setOrigin(0.5).setDepth(202);
    this.objects.push(backdrop, panel, panelWear, titleTape, title, subtitle);
    if (paintedPanel) this.objects.push(paintedPanel);

    choices.forEach((perk, index) => {
      const x = 495 + index * 305;
      const color = RARITY_COLORS[perk.rarity];
      const card = this.scene.add.rectangle(x, 478, 270, 225, 0x22242e, 0.94)
        .setStrokeStyle(4, color)
        .setInteractive({ useHandCursor: true })
        .setDepth(202);
      const paintedCard = addProductionPlate(this.scene, x, 478, 254, 209, {
        region: index === 1 ? 'boss' : 'backpack',
        depth: 202.05,
        alpha: perk.rarity === 'epic' ? 0.32 : 0.22,
        flipX: index === 2,
        tint: color,
      });
      const cardWear = createMaterialSurface(this.scene, {
        x, y: 478, width: 254, height: 209, kind: 'scrap', seed: `perk-choice:${perk.id}`,
        depth: 202.1, alpha: 0.32,
      });
      const rarityTape = this.scene.add.rectangle(x, 393, 108, 22, 0x11131a, 0.78)
        .setStrokeStyle(1, color, 0.7).setAngle(index === 1 ? 1.4 : -1.4).setDepth(202.8);
      const rarity = this.scene.add.text(x, 393, perk.rarity.toUpperCase(), {
        fontSize: '11px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        stroke: '#11121a', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(203);
      const name = this.scene.add.text(x, 433, perk.name.toUpperCase(), {
        fontSize: '20px',
        color: '#fff8ec',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#11121a', strokeThickness: 4,
        wordWrap: { width: 235 },
      }).setOrigin(0.5).setDepth(203);
      const description = this.scene.add.text(x, 493, perk.description, {
        fontSize: '14px',
        color: '#e2dbe8',
        align: 'center',
        lineSpacing: 5,
        stroke: '#11121a', strokeThickness: 2,
        wordWrap: { width: 220 },
      }).setOrigin(0.5).setDepth(203);
      const pickPlate = this.scene.add.rectangle(x, 562, 132, 30, 0x27331f, 0.9)
        .setStrokeStyle(2, 0xb5ff4d, 0.58).setDepth(202.8);
      const pick = this.scene.add.text(x, 562, 'TAKE PERK', {
        fontSize: '14px',
        color: '#dfffc5',
        fontStyle: 'bold',
        stroke: '#10150d', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(203);

      card.on('pointerover', () => {
        card.setFillStyle(0x303341, 0.88);
        paintedCard?.setAlpha(perk.rarity === 'epic' ? 0.42 : 0.31);
        pickPlate.setScale(1.04);
      });
      card.on('pointerout', () => {
        card.setFillStyle(0x22242e, 0.94);
        paintedCard?.setAlpha(perk.rarity === 'epic' ? 0.32 : 0.22);
        pickPlate.setScale(1);
      });
      card.on('pointerdown', () => {
        card.setScale(0.97);
        pickPlate.setScale(0.98);
        pick.setScale(0.98);
      });
      card.on('pointerup', () => {
        card.setScale(1);
        pickPlate.setScale(1.04);
        pick.setScale(1);
        if (!this.visible) return;
        this.onSelected(perk.id);
      });
      this.objects.push(card, cardWear, rarityTape, rarity, name, description, pickPlate, pick);
      if (paintedCard) this.objects.push(paintedCard);
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }
}
