import * as Phaser from 'phaser';
import type { CollectionSnapshot, ItemCollectionEntry, RecipeCollectionEntry } from '../domain/collection';

export interface CollectionOverlayOptions {
  readonly getSnapshot: () => CollectionSnapshot;
}

const RARITY_LABELS: Record<ItemCollectionEntry['rarity'], string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
};

const RARITY_COLORS: Record<ItemCollectionEntry['rarity'], string> = {
  common: '#b9b5aa',
  uncommon: '#94df68',
  rare: '#63b9ff',
  epic: '#d87bff',
};

export class CollectionOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private visible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CollectionOverlayOptions,
  ) {}

  isVisible(): boolean {
    return this.visible;
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.render();
  }

  hide(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.visible = false;
  }

  private render(): void {
    const snapshot = this.options.getSnapshot();
    const blocker = this.scene.add.rectangle(800, 450, 1600, 900, 0x05060a, 0.84)
      .setDepth(600)
      .setInteractive();
    const panel = this.scene.add.rectangle(800, 450, 1240, 720, 0x141620, 1)
      .setStrokeStyle(6, 0x6e5a82)
      .setDepth(601);
    const title = this.scene.add.text(800, 117, 'DISCOVERY ARCHIVE', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '36px',
      color: '#f7f2e8',
      stroke: '#090a0d',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(602);
    const subtitle = this.scene.add.text(800, 162, 'ITEMDEX  +  RECIPE BOOK', {
      fontSize: '14px', color: '#cfa8ff', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(602);

    const close = this.scene.add.rectangle(1348, 120, 112, 34, 0x2b2933, 1)
      .setStrokeStyle(2, 0x8d8797)
      .setDepth(603)
      .setInteractive({ useHandCursor: true });
    const closeText = this.scene.add.text(1348, 120, 'CLOSE', {
      fontSize: '12px', color: '#e5e0e9', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(604);
    close.on('pointerover', () => close.setFillStyle(0x3a3744));
    close.on('pointerout', () => close.setFillStyle(0x2b2933));
    close.on('pointerup', () => this.hide());

    this.objects.push(blocker, panel, title, subtitle, close, closeText);
    this.renderItemdex(snapshot.items, snapshot.discoveredItemCount);
    this.renderRecipes(snapshot.recipes, snapshot.discoveredRecipeCount);
  }

  private renderItemdex(entries: readonly ItemCollectionEntry[], discoveredCount: number): void {
    const left = 220;
    const top = 205;
    const width = 620;
    const header = this.scene.add.text(left, top, `ITEMDEX  ${discoveredCount}/${entries.length}`, {
      fontSize: '21px', color: '#b5ff4d', fontStyle: 'bold',
    }).setDepth(602);
    const description = this.scene.add.text(left, top + 31, 'Find junk through shops, events and forbidden fusion.', {
      fontSize: '11px', color: '#918b99',
    }).setDepth(602);
    this.objects.push(header, description);

    const columns = 2;
    const columnWidth = width / columns;
    const rowHeight = 58;
    entries.forEach((entry, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = left + column * columnWidth;
      const y = top + 68 + row * rowHeight;
      this.renderItemEntry(entry, x, y, columnWidth - 18);
    });
  }

  private renderItemEntry(entry: ItemCollectionEntry, x: number, y: number, width: number): void {
    const border = entry.discovered ? 0x5a5365 : 0x33313b;
    const background = this.scene.add.rectangle(x + width / 2, y + 22, width, 48, 0x1c1e28, 1)
      .setStrokeStyle(2, border)
      .setDepth(602);
    const name = this.scene.add.text(x + 10, y + 5, entry.displayName.toUpperCase(), {
      fontSize: '12px',
      color: entry.discovered ? '#f7f2e8' : '#625e69',
      fontStyle: 'bold',
    }).setDepth(603);
    const meta = this.scene.add.text(
      x + 10,
      y + 25,
      entry.discovered
        ? `${RARITY_LABELS[entry.rarity]}  •  ${entry.tags.slice(0, 4).join(' • ').toUpperCase()}`
        : 'UNDISCOVERED JUNK',
      {
        fontSize: '9px',
        color: entry.discovered ? RARITY_COLORS[entry.rarity] : '#4c4952',
      },
    ).setDepth(603);
    this.objects.push(background, name, meta);
  }

  private renderRecipes(entries: readonly RecipeCollectionEntry[], discoveredCount: number): void {
    const left = 895;
    const top = 205;
    const width = 480;
    const header = this.scene.add.text(left, top, `RECIPE BOOK  ${discoveredCount}/${entries.length}`, {
      fontSize: '21px', color: '#ffcf69', fontStyle: 'bold',
    }).setDepth(602);
    const description = this.scene.add.text(left, top + 31, 'Hints survive between runs. Results reveal only after successful fusion.', {
      fontSize: '11px', color: '#918b99', wordWrap: { width },
    }).setDepth(602);
    this.objects.push(header, description);

    entries.forEach((entry, index) => {
      const y = top + 80 + index * 82;
      this.renderRecipeEntry(entry, left, y, width);
    });
  }

  private renderRecipeEntry(entry: RecipeCollectionEntry, x: number, y: number, width: number): void {
    const card = this.scene.add.rectangle(x + width / 2, y + 29, width, 68, 0x1c1a25, 1)
      .setStrokeStyle(2, entry.discovered ? 0x7e5a9d : 0x3d3944)
      .setDepth(602);
    const hint = this.scene.add.text(x + 12, y + 7, entry.hint, {
      fontSize: '11px', color: entry.discovered ? '#dcb7ff' : '#918a9a', fontStyle: 'bold',
      wordWrap: { width: width - 24 },
    }).setDepth(603);
    const result = this.scene.add.text(x + 12, y + 34, `→  ${entry.displayName.toUpperCase()}`, {
      fontSize: '13px', color: entry.discovered ? '#ffd56e' : '#615c67', fontStyle: 'bold',
    }).setDepth(603);
    this.objects.push(card, hint, result);
  }
}
