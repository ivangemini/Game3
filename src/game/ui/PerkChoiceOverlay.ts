import * as Phaser from 'phaser';
import type { PerkDefinition } from '../domain/perks';
import { createMaterialSurface } from './materialSurface';
import { PANEL_VISUALS, rarityVisual } from './visualTokens';

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

    const backdrop = this.scene.add.rectangle(800, 450, 1600, 900, 0x05060a, 0.9)
      .setInteractive()
      .setDepth(200);
    const glowA = this.scene.add.circle(1240, 360, 330, 0x8621bc, 0.12).setDepth(200.2);
    const glowB = this.scene.add.circle(405, 610, 260, 0x4b7f3c, 0.08).setDepth(200.2);
    const shadow = this.scene.add.rectangle(808, 462, 1110, 520, 0x000000, 0.58).setDepth(201);
    const panel = this.scene.add.rectangle(800, 450, 1110, 520, PANEL_VISUALS.leatherDark, 1)
      .setStrokeStyle(7, PANEL_VISUALS.leatherEdge)
      .setDepth(201.2);
    const material = createMaterialSurface(this.scene, {
      x: 800,
      y: 450,
      width: 1088,
      height: 496,
      kind: 'leather',
      seed: `perk-choice:${choices.map((perk) => perk.id).join('|')}`,
      depth: 201.4,
      alpha: 0.95,
    });

    const headerShadow = this.scene.add.rectangle(800, 275, 720, 82, 0x000000, 0.45).setDepth(202);
    const header = this.scene.add.rectangle(800, 269, 710, 78, PANEL_VISUALS.scrap, 1)
      .setStrokeStyle(5, 0x8d637d)
      .setAngle(-0.8)
      .setDepth(202.1);
    const headerWear = createMaterialSurface(this.scene, {
      x: 800,
      y: 269,
      width: 688,
      height: 58,
      kind: 'scrap',
      seed: 'perk-choice-header',
      depth: 202.2,
      alpha: 0.85,
    });
    const title = this.scene.add.text(800, 247, 'BOSS SCRAPPED  //  CHOOSE A PERK', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '30px',
      color: '#fff1b8',
      stroke: '#0d0b0f',
      strokeThickness: 7,
    }).setOrigin(0.5).setAngle(-0.8).setDepth(203);
    const subtitle = this.scene.add.text(800, 298, 'ONE CARD. PERMANENT FOR THIS RUN. PICK THE MACHINE YOU WANT TO BECOME.', {
      fontSize: '12px',
      color: '#c9c0cd',
      fontStyle: 'bold',
      letterSpacing: 0.6,
    }).setOrigin(0.5).setDepth(203);
    this.objects.push(backdrop, glowA, glowB, shadow, panel, material, headerShadow, header, headerWear, title, subtitle);

    choices.forEach((perk, index) => this.createPerkCard(perk, index));

    const footer = this.scene.add.text(800, 684, 'SURVIVE. UPGRADE. JUNK THEM ALL.', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '15px', color: '#b6ff58', stroke: '#11120f', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(203);
    this.objects.push(footer);
  }

  hide(): void {
    for (const object of this.objects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }
    this.objects.length = 0;
    this.visible = false;
  }

  private createPerkCard(perk: PerkDefinition, index: number): void {
    const x = 490 + index * 310;
    const y = 495;
    const token = rarityVisual(perk.rarity);

    const shadow = this.scene.add.rectangle(x + 6, y + 9, 282, 292, 0x000000, 0.55).setDepth(202);
    const outer = this.scene.add.rectangle(x, y, 282, 292, token.fill, 1)
      .setStrokeStyle(6, token.stroke)
      .setInteractive({ useHandCursor: true })
      .setDepth(202.2);
    const wear = createMaterialSurface(this.scene, {
      x,
      y,
      width: 264,
      height: 274,
      kind: 'scrap',
      seed: `perk-card:${perk.id}`,
      depth: 202.35,
      alpha: 0.68,
    });
    const inner = this.scene.add.rectangle(x, y + 2, 254, 260, token.mid, 0.38)
      .setStrokeStyle(2, token.accent, 0.55)
      .setDepth(202.4);

    const emblemShadow = this.scene.add.circle(x + 3, y - 83, 40, 0x000000, 0.45).setDepth(202.5);
    const emblem = this.scene.add.circle(x, y - 87, 40, PANEL_VISUALS.ink, 1)
      .setStrokeStyle(5, token.accent)
      .setDepth(202.6);
    const emblemText = this.scene.add.text(x, y - 88, perkSymbol(perk), {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '31px', color: token.text, stroke: '#0a0b0f', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(203);

    const rarityPlate = this.scene.add.rectangle(x, y - 135, 112, 26, PANEL_VISUALS.ink, 0.95)
      .setStrokeStyle(2, token.stroke)
      .setDepth(202.7);
    const rarity = this.scene.add.text(x, y - 135, token.label, {
      fontSize: '10px', color: token.text, fontStyle: 'bold', letterSpacing: 0.8,
    }).setOrigin(0.5).setDepth(203);

    const name = this.scene.add.text(x, y - 25, perk.name.toUpperCase(), {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '20px',
      color: '#fff8e9',
      stroke: '#0f1016',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 230 },
    }).setOrigin(0.5).setDepth(203);
    const description = this.scene.add.text(x, y + 48, perk.description, {
      fontSize: '13px',
      color: '#ddd6e0',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: 226 },
    }).setOrigin(0.5).setDepth(203);

    const meter = this.scene.add.graphics().setDepth(203);
    const pipCount = rarityPips(perk.rarity);
    const startX = x - 48;
    for (let pip = 0; pip < 5; pip += 1) {
      const active = pip < pipCount;
      meter.fillStyle(active ? token.accent : 0x242630, active ? 0.95 : 1);
      meter.fillCircle(startX + pip * 24, y + 98, 6);
      meter.lineStyle(2, active ? token.stroke : 0x626673, 0.9);
      meter.strokeCircle(startX + pip * 24, y + 98, 6);
    }

    const pickShadow = this.scene.add.rectangle(x + 3, y + 132, 210, 42, 0x000000, 0.45).setDepth(202.8);
    const pickPlate = this.scene.add.rectangle(x, y + 128, 210, 42, PANEL_VISUALS.ink, 0.95)
      .setStrokeStyle(3, token.stroke)
      .setDepth(202.9);
    const pick = this.scene.add.text(x, y + 128, 'TAKE THIS PERK', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '13px', color: token.text,
      stroke: '#0b0c10', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(203);

    const cardObjects = [outer, wear, inner, emblemShadow, emblem, emblemText, rarityPlate, rarity, name, description, meter, pickShadow, pickPlate, pick];
    const setScale = (value: number): void => {
      for (const object of cardObjects) object.setScale(value);
      shadow.setScale(value);
    };
    const restore = (): void => {
      setScale(1);
      outer.setFillStyle(token.fill).setStrokeStyle(6, token.stroke);
    };

    outer.on('pointerover', () => {
      outer.setFillStyle(token.mid).setStrokeStyle(7, token.accent);
      this.scene.tweens.add({ targets: [...cardObjects, shadow], scaleX: 1.025, scaleY: 1.025, duration: 140, ease: 'Quad.Out' });
    });
    outer.on('pointerout', () => {
      this.scene.tweens.killTweensOf([...cardObjects, shadow]);
      restore();
    });
    outer.on('pointerdown', () => setScale(0.985));
    outer.on('pointerupoutside', restore);
    outer.on('pointerup', () => {
      restore();
      if (!this.visible) return;
      this.onSelected(perk.id);
    });

    this.objects.push(shadow, ...cardObjects);
  }
}

function rarityPips(rarity: PerkDefinition['rarity']): number {
  if (rarity === 'epic') return 5;
  if (rarity === 'rare') return 4;
  if (rarity === 'uncommon') return 3;
  return 2;
}

function perkSymbol(perk: PerkDefinition): string {
  const id = perk.id.toLowerCase();
  if (id.includes('pocket') || id.includes('bag')) return '+';
  if (id.includes('laser') || id.includes('speed') || id.includes('trigger')) return '⚡';
  if (id.includes('shield') || id.includes('armor') || id.includes('health')) return '◆';
  if (id.includes('coin') || id.includes('shop') || id.includes('cheap')) return '$';
  if (id.includes('poison') || id.includes('slime')) return '☣';
  return '✦';
}
