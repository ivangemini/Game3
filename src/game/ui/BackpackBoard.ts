import * as Phaser from 'phaser';
import {
  cellsForPlacement,
  rotateShape,
  validatePlacement,
  type InventoryState,
} from '../domain/inventory';
import type { Cell, ItemDefinition, PlacedItem, Rarity } from '../domain/types';

interface ItemView {
  readonly container: Phaser.GameObjects.Container;
  item: PlacedItem;
  dragStartItem: PlacedItem;
}

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xb9b5aa,
  uncommon: 0x94df68,
  rare: 0x63b9ff,
  epic: 0xd87bff,
};

const ITEM_LABELS: Readonly<Record<string, string>> = {
  'laser-cat': 'CAT\nLASER',
  'angry-battery': 'ANGRY\nBATTERY',
  'cursed-toaster': 'CURSED\nTOASTER',
  'mutant-duck': 'MUTANT\nDUCK',
  'toxic-fan': 'TOXIC\nFAN',
  'fish-blaster': 'FISH\nBLASTER',
  'poison-flask': 'POISON',
  'scrap-magnet': 'SCRAP\nMAGNET',
};

export class BackpackBoard {
  private readonly cellSize = 76;
  private readonly width = 6;
  private readonly height = 5;
  private readonly blockedCells: readonly Cell[] = [
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
  ];
  private readonly itemViews = new Map<string, ItemView>();
  private readonly previewCells: Phaser.GameObjects.Rectangle[] = [];
  private readonly statusText: Phaser.GameObjects.Text;
  private selectedInstanceId: string | null = null;
  private state: InventoryState;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly definitions: ReadonlyMap<string, ItemDefinition>,
    private readonly gridLeft: number,
    private readonly gridTop: number,
  ) {
    this.state = {
      width: this.width,
      height: this.height,
      blockedCells: this.blockedCells,
      items: this.initialItems(),
    };

    this.drawFrame();
    this.drawGrid();
    this.createPreviewLayer();
    this.statusText = this.scene.add.text(this.gridLeft, this.gridTop + this.height * this.cellSize + 18, 'Drag junk. Tap an item, then ROTATE.', {
      fontSize: '16px',
      color: '#b7b0bd',
    });
    this.createRotateButton();

    for (const item of this.state.items) this.createItemView(item);
  }

  private initialItems(): PlacedItem[] {
    return [
      { instanceId: 'battery-1', definitionId: 'angry-battery', origin: { x: 3, y: 0 }, rotation: 0 },
      { instanceId: 'toaster-1', definitionId: 'cursed-toaster', origin: { x: 2, y: 0 }, rotation: 0 },
      { instanceId: 'cat-1', definitionId: 'laser-cat', origin: { x: 4, y: 0 }, rotation: 0 },
      { instanceId: 'duck-1', definitionId: 'mutant-duck', origin: { x: 0, y: 1 }, rotation: 0 },
      { instanceId: 'poison-1', definitionId: 'poison-flask', origin: { x: 3, y: 2 }, rotation: 0 },
      { instanceId: 'fish-1', definitionId: 'fish-blaster', origin: { x: 4, y: 2 }, rotation: 0 },
      { instanceId: 'magnet-1', definitionId: 'scrap-magnet', origin: { x: 2, y: 2 }, rotation: 0 },
      { instanceId: 'fan-1', definitionId: 'toxic-fan', origin: { x: 0, y: 4 }, rotation: 0 },
    ];
  }

  private drawFrame(): void {
    const boardWidth = this.width * this.cellSize;
    const boardHeight = this.height * this.cellSize;
    this.scene.add.rectangle(
      this.gridLeft + boardWidth / 2,
      this.gridTop + boardHeight / 2,
      boardWidth + 36,
      boardHeight + 36,
      0x171922,
      1,
    ).setStrokeStyle(5, 0x715b48);
  }

  private drawGrid(): void {
    const blocked = new Set(this.blockedCells.map((cell) => `${cell.x}:${cell.y}`));
    for (let row = 0; row < this.height; row += 1) {
      for (let column = 0; column < this.width; column += 1) {
        const isBlocked = blocked.has(`${column}:${row}`);
        const x = this.gridLeft + (column + 0.5) * this.cellSize;
        const y = this.gridTop + (row + 0.5) * this.cellSize;
        this.scene.add.rectangle(x, y, this.cellSize - 7, this.cellSize - 7, isBlocked ? 0x111219 : 0x292733, 1)
          .setStrokeStyle(2, isBlocked ? 0x3a3741 : 0x4b4857);
        if (isBlocked) {
          this.scene.add.text(x, y, 'LOCK', { fontSize: '12px', color: '#66616d', fontStyle: 'bold' }).setOrigin(0.5);
        }
      }
    }
  }

  private createPreviewLayer(): void {
    for (let index = 0; index < this.width * this.height; index += 1) {
      const preview = this.scene.add.rectangle(0, 0, this.cellSize - 10, this.cellSize - 10, 0xa9ff68, 0.22)
        .setStrokeStyle(3, 0xa9ff68)
        .setVisible(false)
        .setDepth(40);
      this.previewCells.push(preview);
    }
  }

  private createRotateButton(): void {
    const x = this.gridLeft + this.width * this.cellSize - 78;
    const y = this.gridTop + this.height * this.cellSize + 30;
    const background = this.scene.add.rectangle(x, y, 156, 42, 0x2f2940, 1)
      .setStrokeStyle(2, 0xb779ff)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, '↻  ROTATE', { fontSize: '17px', color: '#e3c6ff', fontStyle: 'bold' }).setOrigin(0.5);

    background.on('pointerover', () => background.setFillStyle(0x45365e));
    background.on('pointerout', () => background.setFillStyle(0x2f2940));
    background.on('pointerdown', () => {
      background.setScale(0.96);
      label.setScale(0.96);
    });
    background.on('pointerup', () => {
      background.setScale(1);
      label.setScale(1);
      this.rotateSelected();
    });
  }

  private createItemView(item: PlacedItem): void {
    const container = this.scene.add.container(0, 0).setDepth(20);
    const view: ItemView = { container, item, dragStartItem: item };
    this.itemViews.set(item.instanceId, view);
    this.renderItem(view);
    this.snapView(view, false);

    container.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(container);

    container.on('pointerdown', () => this.select(item.instanceId));
    this.scene.input.on('dragstart', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
      if (target !== container) return;
      this.select(item.instanceId);
      view.dragStartItem = view.item;
      container.setDepth(100).setScale(1.05);
    });
    this.scene.input.on('drag', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      if (target !== container) return;
      container.setPosition(dragX, dragY);
      const candidate = this.candidateFromWorld(view, dragX, dragY);
      const result = validatePlacement(this.state, this.definitions, candidate, view.item.instanceId);
      this.showPreview(result.occupiedCells, result.ok);
    });
    this.scene.input.on('dragend', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
      if (target !== container) return;
      this.hidePreview();
      container.setDepth(20).setScale(1);
      const candidate = this.candidateFromWorld(view, container.x, container.y);
      const result = validatePlacement(this.state, this.definitions, candidate, view.item.instanceId);
      if (result.ok) {
        view.item = candidate;
        this.replaceStateItem(candidate);
        this.snapView(view, true);
        this.setStatus(`${this.definitionFor(view.item).name} packed.`, '#b8ff8e');
      } else {
        view.item = view.dragStartItem;
        this.snapView(view, true);
        this.setStatus(this.reasonText(result.reason), '#ff8a9b');
      }
    });
  }

  private renderItem(view: ItemView): void {
    const definition = this.definitionFor(view.item);
    const shape = rotateShape(definition.shape, view.item.rotation);
    const shapeWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
    const shapeHeight = Math.max(...shape.map((cell) => cell.y)) + 1;
    const widthPx = shapeWidth * this.cellSize;
    const heightPx = shapeHeight * this.cellSize;
    const color = RARITY_COLORS[definition.rarity];
    const selected = view.item.instanceId === this.selectedInstanceId;

    view.container.removeAll(true);
    view.container.setSize(widthPx, heightPx);

    for (const cell of shape) {
      const localX = (cell.x + 0.5) * this.cellSize - widthPx / 2;
      const localY = (cell.y + 0.5) * this.cellSize - heightPx / 2;
      const tile = this.scene.add.rectangle(localX, localY, this.cellSize - 12, this.cellSize - 12, color, 0.2)
        .setStrokeStyle(selected ? 4 : 3, selected ? 0xffffff : color);
      view.container.add(tile);
    }

    const label = this.scene.add.text(0, 0, ITEM_LABELS[definition.id] ?? definition.name.toUpperCase(), {
      fontSize: shapeWidth >= 2 ? '13px' : '11px',
      align: 'center',
      color: '#fff8ec',
      fontStyle: 'bold',
      stroke: '#17151d',
      strokeThickness: 4,
    }).setOrigin(0.5);
    view.container.add(label);

    // Rebuild the hit area after a rotation changes the dimensions.
    view.container.disableInteractive();
    view.container.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(view.container);
  }

  private select(instanceId: string): void {
    const previous = this.selectedInstanceId;
    this.selectedInstanceId = instanceId;
    if (previous && previous !== instanceId) {
      const oldView = this.itemViews.get(previous);
      if (oldView) this.renderItem(oldView);
    }
    const view = this.itemViews.get(instanceId);
    if (view) {
      this.renderItem(view);
      const definition = this.definitionFor(view.item);
      this.setStatus(`${definition.name}: ${definition.description}`, '#e8ddf2');
    }
  }

  private rotateSelected(): void {
    if (!this.selectedInstanceId) {
      this.setStatus('Select an item first.', '#ffd27d');
      return;
    }
    const view = this.itemViews.get(this.selectedInstanceId);
    if (!view) return;

    const nextRotation = ((view.item.rotation + 1) % 4) as 0 | 1 | 2 | 3;
    const candidate: PlacedItem = { ...view.item, rotation: nextRotation };
    const result = validatePlacement(this.state, this.definitions, candidate, view.item.instanceId);
    if (!result.ok) {
      this.setStatus(`Cannot rotate: ${this.reasonText(result.reason).toLowerCase()}`, '#ff8a9b');
      this.scene.tweens.add({ targets: view.container, angle: { from: -2, to: 2 }, yoyo: true, repeat: 2, duration: 55, onComplete: () => view.container.setAngle(0) });
      return;
    }

    view.item = candidate;
    this.replaceStateItem(candidate);
    this.renderItem(view);
    this.snapView(view, true);
    this.setStatus(`${this.definitionFor(view.item).name} rotated.`, '#b8ff8e');
  }

  private candidateFromWorld(view: ItemView, worldX: number, worldY: number): PlacedItem {
    const definition = this.definitionFor(view.item);
    const shape = rotateShape(definition.shape, view.item.rotation);
    const shapeWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
    const shapeHeight = Math.max(...shape.map((cell) => cell.y)) + 1;
    const originX = Math.round((worldX - this.gridLeft - (shapeWidth * this.cellSize) / 2) / this.cellSize);
    const originY = Math.round((worldY - this.gridTop - (shapeHeight * this.cellSize) / 2) / this.cellSize);
    return { ...view.item, origin: { x: originX, y: originY } };
  }

  private snapView(view: ItemView, animate: boolean): void {
    const definition = this.definitionFor(view.item);
    const shape = rotateShape(definition.shape, view.item.rotation);
    const shapeWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
    const shapeHeight = Math.max(...shape.map((cell) => cell.y)) + 1;
    const x = this.gridLeft + (view.item.origin.x + shapeWidth / 2) * this.cellSize;
    const y = this.gridTop + (view.item.origin.y + shapeHeight / 2) * this.cellSize;

    if (animate) {
      this.scene.tweens.add({ targets: view.container, x, y, duration: 150, ease: 'Back.Out' });
    } else {
      view.container.setPosition(x, y);
    }
  }

  private showPreview(cells: readonly Cell[], ok: boolean): void {
    this.hidePreview();
    let previewIndex = 0;
    for (const cell of cells) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= this.width || cell.y >= this.height) continue;
      const preview = this.previewCells[previewIndex];
      if (!preview) break;
      const color = ok ? 0xa9ff68 : 0xff667d;
      preview
        .setPosition(this.gridLeft + (cell.x + 0.5) * this.cellSize, this.gridTop + (cell.y + 0.5) * this.cellSize)
        .setFillStyle(color, 0.24)
        .setStrokeStyle(3, color)
        .setVisible(true);
      previewIndex += 1;
    }
  }

  private hidePreview(): void {
    for (const preview of this.previewCells) preview.setVisible(false);
  }

  private replaceStateItem(item: PlacedItem): void {
    this.state = {
      ...this.state,
      items: this.state.items.map((current) => current.instanceId === item.instanceId ? item : current),
    };
  }

  private definitionFor(item: PlacedItem): ItemDefinition {
    const definition = this.definitions.get(item.definitionId);
    if (!definition) throw new Error(`Unknown item definition: ${item.definitionId}`);
    return definition;
  }

  private setStatus(message: string, color: string): void {
    this.statusText.setText(message).setColor(color);
  }

  private reasonText(reason: 'out-of-bounds' | 'blocked' | 'occupied' | undefined): string {
    if (reason === 'out-of-bounds') return 'That shape does not fit inside the backpack.';
    if (reason === 'blocked') return 'Those pocket cells are locked.';
    if (reason === 'occupied') return 'Another item already occupies those cells.';
    return 'That placement is invalid.';
  }
}
