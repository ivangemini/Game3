import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { findAvailableFusions, type FusionCandidate, type FusionRecipe } from '../domain/fusions';
import type { ItemDefinition, PlacedItem } from '../domain/types';
import { createItemGlyph } from './ItemGlyph';
import { createMaterialSurface } from './materialSurface';
import { PANEL_VISUALS, rarityVisual } from './visualTokens';

export type FusionFeedbackEvent =
  | { readonly kind: 'cycle' }
  | { readonly kind: 'success'; readonly recipe: FusionRecipe }
  | { readonly kind: 'error' };

export interface FusionPanelOptions {
  readonly getItems: () => readonly PlacedItem[];
  readonly isUnlocked: () => boolean;
  readonly onFuse: (recipe: FusionRecipe) => boolean;
  readonly onFeedback?: (event: FusionFeedbackEvent) => void;
}

export class FusionPanel {
  private readonly recipeText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly fuseButton: Phaser.GameObjects.Rectangle;
  private readonly fuseLabel: Phaser.GameObjects.Text;
  private readonly nextButton: Phaser.GameObjects.Rectangle;
  private readonly nextLabel: Phaser.GameObjects.Text;
  private readonly previewObjects: Phaser.GameObjects.GameObject[] = [];
  private available: FusionCandidate[] = [];
  private selectedIndex = 0;
  private lastSignature = '';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly left: number,
    private readonly top: number,
    private readonly recipes: readonly FusionRecipe[],
    private readonly definitions: ReadonlyMap<string, ItemDefinition>,
    private readonly options: FusionPanelOptions,
  ) {
    this.drawShell();

    this.recipeText = scene.add.text(left + 16, top + 34, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '12px', color: '#f7f2e8', fontStyle: 'bold', stroke: '#141119', strokeThickness: 3,
      wordWrap: { width: 112 },
    }).setDepth(2.4);
    this.hintText = scene.add.text(left + 16, top + 58, '', {
      fontSize: '9px', color: '#b9b0c0', wordWrap: { width: 112 }, lineSpacing: 1,
    }).setDepth(2.4);
    this.countText = scene.add.text(left + 178, top + 91, '', {
      fontSize: '9px', color: '#ffd56e', fontStyle: 'bold', stroke: '#120d13', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2.5);
    this.statusText = scene.add.text(left + 13, top + 94, '', {
      fontSize: '8px', color: '#8f8797', wordWrap: { width: 214 }, fontStyle: 'bold',
    }).setDepth(2.4);

    this.fuseButton = scene.add.rectangle(left + 72, top + 117, 124, 30, 0x572463, 1)
      .setStrokeStyle(3, PANEL_VISUALS.neonPurple)
      .setInteractive({ useHandCursor: true })
      .setDepth(2.8);
    this.fuseLabel = scene.add.text(left + 72, top + 117, '⚡ FUSE IT', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '11px', color: '#ffe7ff', fontStyle: 'bold', stroke: '#170a1b', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.nextButton = scene.add.rectangle(left + 181, top + 117, 72, 30, 0x252733, 1)
      .setStrokeStyle(2, 0x777d88)
      .setInteractive({ useHandCursor: true })
      .setDepth(2.8);
    this.nextLabel = scene.add.text(left + 181, top + 117, 'NEXT ›', {
      fontSize: '9px', color: '#e0dbe6', fontStyle: 'bold', stroke: '#111218', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.fuseButton.on('pointerover', () => this.fuseButton.setFillStyle(0x7c3588));
    this.fuseButton.on('pointerout', () => this.fuseButton.setFillStyle(0x572463));
    this.fuseButton.on('pointerdown', () => {
      this.fuseButton.setScale(0.97);
      this.fuseLabel.setScale(0.97);
    });
    this.fuseButton.on('pointerupoutside', () => {
      this.fuseButton.setScale(1);
      this.fuseLabel.setScale(1);
    });
    this.fuseButton.on('pointerup', () => {
      this.fuseButton.setScale(1);
      this.fuseLabel.setScale(1);
      this.tryFuseSelected();
    });

    this.nextButton.on('pointerover', () => this.nextButton.setFillStyle(0x3b3e4c));
    this.nextButton.on('pointerout', () => this.nextButton.setFillStyle(0x252733));
    this.nextButton.on('pointerdown', () => {
      this.nextButton.setScale(0.97);
      this.nextLabel.setScale(0.97);
    });
    this.nextButton.on('pointerupoutside', () => {
      this.nextButton.setScale(1);
      this.nextLabel.setScale(1);
    });
    this.nextButton.on('pointerup', () => {
      this.nextButton.setScale(1);
      this.nextLabel.setScale(1);
      if (this.available.length <= 1) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.available.length;
      this.options.onFeedback?.({ kind: 'cycle' });
      this.render();
    });

    const timer = scene.time.addEvent({ delay: 250, loop: true, callback: () => this.refresh() });
    scene.events.once('shutdown', () => timer.destroy());
    this.refresh(true);
  }

  refresh(force = false): void {
    const unlocked = this.options.isUnlocked();
    const items = this.options.getItems();
    const signature = `${unlocked}:${items.map((item) => `${item.instanceId}:${item.definitionId}`).sort().join('|')}`;
    if (!force && signature === this.lastSignature) return;
    this.lastSignature = signature;
    this.available = unlocked ? findAvailableFusions(items, this.recipes) : [];
    if (this.selectedIndex >= this.available.length) this.selectedIndex = 0;
    this.render();
  }

  private drawShell(): void {
    const cx = this.left + 118;
    const cy = this.top + 68;

    this.scene.add.rectangle(cx + 6, cy + 7, 236, 136, PANEL_VISUALS.ink, 0.68).setDepth(0.4);
    this.scene.add.rectangle(cx, cy, 234, 134, 0x27202b, 1)
      .setStrokeStyle(5, 0x70437e)
      .setDepth(0.6);
    this.scene.add.rectangle(cx, cy, 222, 122, 0x141720, 1)
      .setStrokeStyle(2, 0x4b3e50)
      .setDepth(0.8);
    createMaterialSurface(this.scene, {
      x: cx,
      y: cy,
      width: 214,
      height: 114,
      kind: 'scrap',
      seed: 'fusion-lab:machine-shell',
      depth: 0.9,
      alpha: 0.76,
    });

    // Heavy title plate and bolts make this read as a machine rather than a web card.
    this.scene.add.rectangle(this.left + 76, this.top + 14, 146, 28, 0x51303e, 1)
      .setStrokeStyle(3, 0xc46cbb)
      .setAngle(-1.2)
      .setDepth(1.3);
    createMaterialSurface(this.scene, {
      x: this.left + 76,
      y: this.top + 14,
      width: 136,
      height: 18,
      kind: 'paper',
      seed: 'fusion-lab:title-plate-v2',
      depth: 1.4,
      alpha: 0.5,
    }).setAngle(-1.2);
    this.scene.add.text(this.left + 76, this.top + 14, 'FUSION LAB', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#f4ccff',
      stroke: '#1b1020', strokeThickness: 4,
    }).setOrigin(0.5).setAngle(-1.2).setDepth(1.6);

    const chamberX = this.left + 178;
    const chamberY = this.top + 59;
    this.scene.add.rectangle(chamberX + 3, chamberY + 4, 80, 76, 0x05060a, 0.7).setDepth(1.1);
    this.scene.add.rectangle(chamberX, chamberY, 78, 74, 0x0d1118, 1)
      .setStrokeStyle(3, 0x6b6f7c)
      .setDepth(1.2);
    this.scene.add.circle(chamberX, chamberY, 31, 0x1c1623, 1)
      .setStrokeStyle(3, PANEL_VISUALS.neonPurple, 0.55)
      .setDepth(1.3);
    this.scene.add.circle(chamberX, chamberY, 25, 0x07090e, 1)
      .setStrokeStyle(1, PANEL_VISUALS.electricBlue, 0.28)
      .setDepth(1.35);

    const coil = this.scene.add.graphics().setDepth(1.45);
    coil.lineStyle(2, PANEL_VISUALS.neonPurple, 0.4);
    for (let index = 0; index < 5; index += 1) {
      const y = chamberY - 18 + index * 9;
      coil.lineBetween(chamberX - 35, y, chamberX - 26, y + (index % 2 === 0 ? 5 : -5));
      coil.lineBetween(chamberX + 26, y + (index % 2 === 0 ? -5 : 5), chamberX + 35, y);
    }

    // Hazard tape under the reaction chamber.
    const hazard = this.scene.add.graphics().setDepth(1.5);
    hazard.fillStyle(0xe3b13d, 0.8);
    hazard.fillRect(this.left + 139, this.top + 88, 78, 7);
    hazard.lineStyle(5, 0x191a1f, 1);
    for (let x = this.left + 142; x < this.left + 217; x += 16) {
      hazard.lineBetween(x, this.top + 88, x + 8, this.top + 95);
    }

    for (const [x, y] of [
      [this.left + 10, this.top + 9],
      [this.left + 226, this.top + 9],
      [this.left + 10, this.top + 127],
      [this.left + 226, this.top + 127],
    ] as const) {
      this.scene.add.circle(x, y, 5, 0x4b505a, 1).setStrokeStyle(1, 0xbcc3cd, 0.65).setDepth(1.8);
      this.scene.add.circle(x - 1, y - 1, 1.5, 0xdce1e8, 0.65).setDepth(1.9);
    }

    this.scene.add.text(this.left + 18, this.top + 20, '2 IN', {
      fontSize: '8px', color: '#8f8797', fontStyle: 'bold',
    }).setDepth(1.8);
    this.scene.add.text(this.left + 210, this.top + 20, '1 OUT', {
      fontSize: '8px', color: '#a58caf', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(1.8);
  }

  private render(): void {
    this.clearPreview();
    const unlocked = this.options.isUnlocked();
    if (!unlocked) {
      this.recipeText.setText('COIL SEALED');
      this.hintText.setText('Drop Boss 1 to wake the illegal machine.');
      this.countText.setText('OFFLINE');
      this.statusText.setText('TWO INGREDIENTS → ONE STRANGER ITEM').setColor('#8f8797');
      this.drawLockedPreview();
      this.setButtonsEnabled(false);
      return;
    }

    const candidate = this.available[this.selectedIndex];
    if (!candidate) {
      this.recipeText.setText('COIL IS QUIET');
      this.hintText.setText('Pack compatible junk and the chamber will light up.');
      this.countText.setText('0 READY');
      this.statusText.setText('FUSION CONSUMES BOTH INGREDIENTS').setColor('#8f8797');
      this.drawEmptyPreview();
      this.setButtonsEnabled(false);
      return;
    }

    const output = this.definitions.get(candidate.recipe.resultDefinitionId);
    this.recipeText.setText(output?.name.toUpperCase() ?? candidate.recipe.name.toUpperCase());
    this.hintText.setText(candidate.recipe.hint);
    this.countText.setText(`${this.selectedIndex + 1} / ${this.available.length}`);
    this.statusText.setText('READY • RESULT AUTO-PACKS').setColor('#cdb8d5');
    if (output) this.drawOutputPreview(output);
    this.setButtonsEnabled(true);
  }

  private drawOutputPreview(output: ItemDefinition): void {
    const rarity = rarityVisual(output.rarity);
    const chamberX = this.left + 178;
    const chamberY = this.top + 59;
    const halo = this.scene.add.circle(chamberX, chamberY, 29, rarity.stroke, 0.11)
      .setStrokeStyle(2, rarity.stroke, 0.65)
      .setDepth(2);
    const glyph = createItemGlyph(this.scene, output, chamberX, chamberY, { size: 54, compact: true });
    glyph.setDepth(2.2);
    const labelPlate = this.scene.add.rectangle(chamberX, this.top + 86, 68, 14, 0x0b0c11, 0.9)
      .setStrokeStyle(1, rarity.stroke, 0.42)
      .setDepth(2.2);
    const label = this.scene.add.text(chamberX, this.top + 86, rarity.label, {
      fontSize: '7px', color: `#${rarity.stroke.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2.3);
    this.previewObjects.push(halo, glyph, labelPlate, label);
  }

  private drawLockedPreview(): void {
    const x = this.left + 178;
    const y = this.top + 59;
    const plate = this.scene.add.circle(x, y, 26, 0x171922, 1)
      .setStrokeStyle(2, 0x5b5262)
      .setDepth(2);
    const shackle = this.scene.add.graphics().setDepth(2.2);
    shackle.lineStyle(4, 0x817887, 1);
    shackle.strokeCircle(x, y - 8, 10);
    shackle.fillStyle(0x817887, 1);
    shackle.fillRoundedRect(x - 13, y - 2, 26, 22, 4);
    shackle.fillStyle(0x22242c, 1);
    shackle.fillCircle(x, y + 7, 3);
    this.previewObjects.push(plate, shackle);
  }

  private drawEmptyPreview(): void {
    const x = this.left + 178;
    const y = this.top + 59;
    const plate = this.scene.add.circle(x, y, 26, 0x14161e, 1)
      .setStrokeStyle(2, 0x4b4652)
      .setDepth(2);
    const text = this.scene.add.text(x, y - 1, '?', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '25px', color: '#77717e',
    }).setOrigin(0.5).setDepth(2.2);
    this.previewObjects.push(plate, text);
  }

  private clearPreview(): void {
    for (const object of this.previewObjects) object.destroy();
    this.previewObjects.length = 0;
  }

  private tryFuseSelected(): void {
    const candidate = this.available[this.selectedIndex];
    if (!candidate || !this.options.isUnlocked()) return;
    const fused = this.options.onFuse(candidate.recipe);
    if (!fused) {
      this.options.onFeedback?.({ kind: 'error' });
      this.statusText.setText('RESULT HAS NOWHERE TO LAND').setColor('#ff9aab');
      return;
    }
    telemetry.track('fusion_used', {
      recipeId: candidate.recipe.id,
      resultDefinitionId: candidate.recipe.resultDefinitionId,
    });
    this.options.onFeedback?.({ kind: 'success', recipe: candidate.recipe });
    this.statusText.setText('FUSION COMPLETE • BAG UPDATED').setColor('#c9ff72');
    this.refresh(true);
  }

  private setButtonsEnabled(enabled: boolean): void {
    this.fuseButton.setAlpha(enabled ? 1 : 0.34);
    this.fuseLabel.setAlpha(enabled ? 1 : 0.44);
    const canCycle = enabled && this.available.length > 1;
    this.nextButton.setAlpha(canCycle ? 1 : 0.32);
    this.nextLabel.setAlpha(canCycle ? 1 : 0.42);
  }
}
