import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { findAvailableFusions, type FusionCandidate, type FusionRecipe } from '../domain/fusions';
import type { ItemDefinition, PlacedItem } from '../domain/types';
import { createItemGlyph } from './ItemGlyph';
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
    this.recipeText = scene.add.text(left + 12, top + 33, '', {
      fontSize: '12px', color: '#f7f2e8', fontStyle: 'bold', stroke: '#141119', strokeThickness: 3,
      wordWrap: { width: 112 },
    });
    this.hintText = scene.add.text(left + 12, top + 58, '', {
      fontSize: '10px', color: '#b9b0c0', wordWrap: { width: 112 }, lineSpacing: 1,
    });
    this.countText = scene.add.text(left + 132, top + 78, '', {
      fontSize: '10px', color: '#ffd56e', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.statusText = scene.add.text(left + 12, top + 87, '', {
      fontSize: '10px', color: '#8f8797', wordWrap: { width: 176 },
    });

    this.fuseButton = scene.add.rectangle(left + 66, top + 106, 106, 25, 0x542b60, 1)
      .setStrokeStyle(2, PANEL_VISUALS.neonPurple).setInteractive({ useHandCursor: true });
    this.fuseLabel = scene.add.text(left + 66, top + 106, '⚡ FUSE', {
      fontSize: '11px', color: '#ffe7ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.nextButton = scene.add.rectangle(left + 158, top + 106, 60, 25, 0x292735, 1)
      .setStrokeStyle(2, 0x777381).setInteractive({ useHandCursor: true });
    this.nextLabel = scene.add.text(left + 158, top + 106, 'NEXT ›', {
      fontSize: '10px', color: '#e0dbe6', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.fuseButton.on('pointerover', () => this.fuseButton.setFillStyle(0x754080));
    this.fuseButton.on('pointerout', () => this.fuseButton.setFillStyle(0x542b60));
    this.fuseButton.on('pointerdown', () => { this.fuseButton.setScale(0.97); this.fuseLabel.setScale(0.97); });
    this.fuseButton.on('pointerup', () => { this.fuseButton.setScale(1); this.fuseLabel.setScale(1); this.tryFuseSelected(); });
    this.nextButton.on('pointerover', () => this.nextButton.setFillStyle(0x3b3949));
    this.nextButton.on('pointerout', () => this.nextButton.setFillStyle(0x292735));
    this.nextButton.on('pointerup', () => {
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
    this.scene.add.rectangle(this.left + 103, this.top + 61, 206, 122, PANEL_VISUALS.ink, 0.55).setPosition(this.left + 105, this.top + 64);
    this.scene.add.rectangle(this.left + 100, this.top + 58, 200, 116, 0x21172a, 1)
      .setStrokeStyle(4, 0x8e55ac);
    this.scene.add.rectangle(this.left + 100, this.top + 58, 188, 104, 0x171522, 1)
      .setStrokeStyle(1, 0x3f3149);
    this.scene.add.rectangle(this.left + 100, this.top + 13, 158, 25, 0x4d3156, 1)
      .setStrokeStyle(2, 0xc981e4).setAngle(1.2);
    this.scene.add.text(this.left + 100, this.top + 12, 'FUSION LAB', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#f4ccff',
      stroke: '#1b1020', strokeThickness: 4,
    }).setOrigin(0.5).setAngle(1.2);
    this.scene.add.circle(this.left + 187, this.top + 14, 5, 0x737986, 1).setStrokeStyle(1, 0xd4dae3);
  }

  private render(): void {
    this.clearPreview();
    const unlocked = this.options.isUnlocked();
    if (!unlocked) {
      this.recipeText.setText('SEALED');
      this.hintText.setText('Beat Boss 1 to power the illegal fusion coil.');
      this.countText.setText('');
      this.statusText.setText('2 ingredients → 1 stranger item').setColor('#8f8797');
      this.drawLockedPreview();
      this.setButtonsEnabled(false);
      return;
    }

    const candidate = this.available[this.selectedIndex];
    if (!candidate) {
      this.recipeText.setText('NO RECIPE READY');
      this.hintText.setText('Compatible junk will make the coil start screaming.');
      this.countText.setText('0 READY');
      this.statusText.setText('Fusion permanently consumes both ingredients.').setColor('#8f8797');
      this.drawEmptyPreview();
      this.setButtonsEnabled(false);
      return;
    }

    const output = this.definitions.get(candidate.recipe.resultDefinitionId);
    this.recipeText.setText(output?.name.toUpperCase() ?? candidate.recipe.name.toUpperCase());
    this.hintText.setText(candidate.recipe.hint);
    this.countText.setText(`${this.selectedIndex + 1}/${this.available.length}`);
    this.statusText.setText('RESULT AUTO-PACKS • INGREDIENTS VANISH').setColor('#a9a1b2');
    if (output) this.drawOutputPreview(output);
    this.setButtonsEnabled(true);
  }

  private drawOutputPreview(output: ItemDefinition): void {
    const rarity = rarityVisual(output.rarity);
    const halo = this.scene.add.circle(this.left + 158, this.top + 55, 31, rarity.stroke, 0.08)
      .setStrokeStyle(2, rarity.stroke, 0.55);
    const glyph = createItemGlyph(this.scene, output, this.left + 158, this.top + 55, { size: 48, compact: true });
    const label = this.scene.add.text(this.left + 158, this.top + 84, rarity.label, {
      fontSize: '8px', color: `#${rarity.stroke.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewObjects.push(halo, glyph, label);
  }

  private drawLockedPreview(): void {
    const plate = this.scene.add.rectangle(this.left + 158, this.top + 54, 50, 50, 0x22202a, 1)
      .setStrokeStyle(2, 0x5b5262);
    const text = this.scene.add.text(this.left + 158, this.top + 54, '🔒', { fontSize: '22px', color: '#817887' }).setOrigin(0.5);
    this.previewObjects.push(plate, text);
  }

  private drawEmptyPreview(): void {
    const plate = this.scene.add.rectangle(this.left + 158, this.top + 54, 50, 50, 0x201d27, 1)
      .setStrokeStyle(2, 0x4b4652);
    const text = this.scene.add.text(this.left + 158, this.top + 54, '?', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '25px', color: '#77717e',
    }).setOrigin(0.5);
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
      this.statusText.setText('NO LEGAL SPACE FOR THE RESULT.').setColor('#ff9aab');
      return;
    }
    telemetry.track('fusion_used', {
      recipeId: candidate.recipe.id,
      resultDefinitionId: candidate.recipe.resultDefinitionId,
    });
    this.options.onFeedback?.({ kind: 'success', recipe: candidate.recipe });
    this.statusText.setText('FUSION COMPLETE • HOLD ONTO SOMETHING').setColor('#c9ff72');
    this.refresh(true);
  }

  private setButtonsEnabled(enabled: boolean): void {
    this.fuseButton.setAlpha(enabled ? 1 : 0.35);
    this.fuseLabel.setAlpha(enabled ? 1 : 0.45);
    this.nextButton.setAlpha(enabled && this.available.length > 1 ? 1 : 0.35);
    this.nextLabel.setAlpha(enabled && this.available.length > 1 ? 1 : 0.45);
  }
}
