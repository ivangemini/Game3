import * as Phaser from 'phaser';
import { findAvailableFusions, type FusionCandidate, type FusionRecipe } from '../domain/fusions';
import type { ItemDefinition, PlacedItem } from '../domain/types';

export interface FusionPanelOptions {
  readonly getItems: () => readonly PlacedItem[];
  readonly isUnlocked: () => boolean;
  readonly onFuse: (recipe: FusionRecipe) => boolean;
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
    scene.add.rectangle(left + 100, top + 58, 200, 116, 0x171522, 1).setStrokeStyle(3, 0x7f50a8);
    scene.add.text(left + 12, top + 8, 'FUSION LAB', {
      fontSize: '17px', color: '#f1bdff', fontStyle: 'bold',
    });
    this.recipeText = scene.add.text(left + 12, top + 34, '', {
      fontSize: '12px', color: '#f7f2e8', fontStyle: 'bold', wordWrap: { width: 176 },
    });
    this.hintText = scene.add.text(left + 12, top + 52, '', {
      fontSize: '9px', color: '#aaa5b2', wordWrap: { width: 176 },
    });
    this.countText = scene.add.text(left + 12, top + 69, '', { fontSize: '9px', color: '#ffd56e' });
    this.statusText = scene.add.text(left + 12, top + 88, '', {
      fontSize: '8px', color: '#817b89', wordWrap: { width: 176 },
    });

    this.fuseButton = scene.add.rectangle(left + 69, top + 105, 112, 24, 0x4a2e56, 1)
      .setStrokeStyle(2, 0xe18aff).setInteractive({ useHandCursor: true });
    this.fuseLabel = scene.add.text(left + 69, top + 105, 'FUSE', {
      fontSize: '10px', color: '#ffe7ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.nextButton = scene.add.rectangle(left + 157, top + 105, 52, 24, 0x292735, 1)
      .setStrokeStyle(2, 0x777381).setInteractive({ useHandCursor: true });
    this.nextLabel = scene.add.text(left + 157, top + 105, 'NEXT', {
      fontSize: '9px', color: '#d9d4df', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.fuseButton.on('pointerover', () => this.fuseButton.setAlpha(0.82));
    this.fuseButton.on('pointerout', () => this.fuseButton.setAlpha(1));
    this.fuseButton.on('pointerup', () => this.tryFuseSelected());
    this.nextButton.on('pointerover', () => this.nextButton.setAlpha(0.82));
    this.nextButton.on('pointerout', () => this.nextButton.setAlpha(1));
    this.nextButton.on('pointerup', () => {
      if (this.available.length <= 1) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.available.length;
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

  private render(): void {
    const unlocked = this.options.isUnlocked();
    if (!unlocked) {
      this.recipeText.setText('LOCKED');
      this.hintText.setText('Defeat Boss 1 to unlock dangerous item fusion.');
      this.countText.setText('');
      this.statusText.setText('Two ingredients become one stronger, stranger item.');
      this.setButtonsEnabled(false);
      return;
    }

    const candidate = this.available[this.selectedIndex];
    if (!candidate) {
      this.recipeText.setText('NO RECIPE READY');
      this.hintText.setText('Collect compatible junk. Secret combinations will appear here.');
      this.countText.setText('0 available');
      this.statusText.setText('Fusion consumes both ingredients permanently.');
      this.setButtonsEnabled(false);
      return;
    }

    const output = this.definitions.get(candidate.recipe.resultDefinitionId);
    this.recipeText.setText(output?.name.toUpperCase() ?? candidate.recipe.name.toUpperCase());
    this.hintText.setText(candidate.recipe.hint);
    this.countText.setText(`${this.selectedIndex + 1}/${this.available.length} READY`);
    this.statusText.setText('Consumes both ingredients • result is auto-packed.');
    this.setButtonsEnabled(true);
  }

  private tryFuseSelected(): void {
    const candidate = this.available[this.selectedIndex];
    if (!candidate || !this.options.isUnlocked()) return;
    const fused = this.options.onFuse(candidate.recipe);
    if (!fused) {
      this.statusText.setText('Fusion failed: result needs legal backpack space.').setColor('#ff9aab');
      return;
    }
    this.statusText.setText('FUSION COMPLETE').setColor('#c9ff72');
    this.refresh(true);
  }

  private setButtonsEnabled(enabled: boolean): void {
    this.fuseButton.setAlpha(enabled ? 1 : 0.35);
    this.fuseLabel.setAlpha(enabled ? 1 : 0.45);
    this.nextButton.setAlpha(enabled && this.available.length > 1 ? 1 : 0.35);
    this.nextLabel.setAlpha(enabled && this.available.length > 1 ? 1 : 0.45);
  }
}
