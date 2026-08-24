import * as Phaser from 'phaser';
import type { PerkDefinition } from '../domain/perks';

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

    const backdrop = this.scene.add.rectangle(800, 450, 1600, 900, 0x07080d, 0.82)
      .setInteractive()
      .setDepth(200);
    const panel = this.scene.add.rectangle(800, 450, 1050, 430, 0x171922, 1)
      .setStrokeStyle(6, 0xc36cff)
      .setDepth(201);
    const title = this.scene.add.text(800, 278, 'TV TYRANT DOWN — CHOOSE ONE WEIRD UPGRADE', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '29px',
      color: '#fff2a8',
      stroke: '#11121a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(202);
    const subtitle = this.scene.add.text(800, 318, 'The choice is permanent for this run and changes future combat.', {
      fontSize: '15px',
      color: '#bdb7c7',
    }).setOrigin(0.5).setDepth(202);
    this.objects.push(backdrop, panel, title, subtitle);

    choices.forEach((perk, index) => {
      const x = 495 + index * 305;
      const color = RARITY_COLORS[perk.rarity];
      const card = this.scene.add.rectangle(x, 478, 270, 225, 0x22242e, 1)
        .setStrokeStyle(4, color)
        .setInteractive({ useHandCursor: true })
        .setDepth(202);
      const rarity = this.scene.add.text(x, 393, perk.rarity.toUpperCase(), {
        fontSize: '11px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(203);
      const name = this.scene.add.text(x, 433, perk.name.toUpperCase(), {
        fontSize: '20px',
        color: '#fff8ec',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 235 },
      }).setOrigin(0.5).setDepth(203);
      const description = this.scene.add.text(x, 493, perk.description, {
        fontSize: '14px',
        color: '#d5cedd',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: 220 },
      }).setOrigin(0.5).setDepth(203);
      const pick = this.scene.add.text(x, 562, 'TAKE PERK', {
        fontSize: '14px',
        color: '#dfffc5',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(203);

      card.on('pointerover', () => card.setFillStyle(0x303341));
      card.on('pointerout', () => card.setFillStyle(0x22242e));
      card.on('pointerdown', () => card.setScale(0.97));
      card.on('pointerup', () => {
        card.setScale(1);
        if (!this.visible) return;
        this.onSelected(perk.id);
      });
      this.objects.push(card, rarity, name, description, pick);
    });
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }
}
