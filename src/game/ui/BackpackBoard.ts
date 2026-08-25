import * as Phaser from 'phaser';
import {
  findFirstValidPlacement,
  rotateShape,
  validatePlacement,
  type InventoryState,
} from '../domain/inventory';
import {
  evaluateSynergies,
  SYNERGY_RULE_MAP,
  type ItemBonuses,
  type SynergyConnection,
  type SynergyId,
  type SynergySnapshot,
} from '../domain/synergies';
import type { Cell, ItemDefinition, PlacedItem } from '../domain/types';
import { BackpackSkin } from './BackpackSkin';
import { createItemGlyph } from './ItemGlyph';
import { PANEL_VISUALS, rarityVisual } from './visualTokens';

interface ItemView {
  readonly container: Phaser.GameObjects.Container;
  item: PlacedItem;
  dragStartItem: PlacedItem;
  dragValid: boolean | null;
}

export interface BackpackBoardSnapshot {
  readonly items: readonly PlacedItem[];
  readonly nextLootSequence: number;
}

export interface BackpackBoardOptions {
  readonly initialItems?: readonly PlacedItem[];
  readonly nextLootSequence?: number;
  readonly unlockedPocketCount?: number;
  readonly onStateChanged?: (snapshot: BackpackBoardSnapshot) => void;
}

const SYNERGY_COLORS: Record<SynergyId, number> = {
  'cat-laser': 0xff5577,
  'battery-device': 0xc9ff58,
  'poison-weapon': 0xb967ff,
  'duck-chaos': 0xffa64d,
  'magnet-metal': 0x58d7ff,
  'food-pet': 0xffdd66,
  'antenna-device': 0x7cf2ff,
  'slime-poison': 0x83ff72,
  'metal-weapon': 0xc8d0da,
  'chaos-laser': 0xff7df0,
};

const POCKET_UNLOCK_ORDER: readonly Cell[] = [
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
];

const connectionKey = (connection: SynergyConnection): string =>
  `${connection.ruleId}:${connection.sourceInstanceId}:${connection.targetInstanceId}`;

export class BackpackBoard {
  private readonly cellSize = 76;
  private readonly width = 6;
  private readonly height = 5;
  private readonly itemViews = new Map<string, ItemView>();
  private readonly previewCells: Phaser.GameObjects.Rectangle[] = [];
  private readonly gridObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly onStateChanged?: (snapshot: BackpackBoardSnapshot) => void;
  private readonly synergyGraphics: Phaser.GameObjects.Graphics;
  private readonly statusText: Phaser.GameObjects.Text;
  private selectedInstanceId: string | null = null;
  private nextLootSequence: number;
  private unlockedPocketCount: number;
  private blockedCells: readonly Cell[];
  private state: InventoryState;
  private synergySnapshot: SynergySnapshot;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly definitions: ReadonlyMap<string, ItemDefinition>,
    private readonly gridLeft: number,
    private readonly gridTop: number,
    options: BackpackBoardOptions = {},
  ) {
    this.nextLootSequence = Math.max(1, options.nextLootSequence ?? 1);
    this.unlockedPocketCount = this.normalizeUnlockCount(options.unlockedPocketCount ?? 0);
    this.blockedCells = this.blockedCellsFor(this.unlockedPocketCount);
    this.onStateChanged = options.onStateChanged;

    const items = options.initialItems === undefined ? this.initialItems() : this.sanitizeInitialItems(options.initialItems);
    this.state = { width: this.width, height: this.height, blockedCells: this.blockedCells, items };
    this.synergySnapshot = evaluateSynergies(this.state, this.definitions);

    new BackpackSkin(scene, gridLeft, gridTop, this.width, this.height, this.cellSize);
    this.drawGrid();
    this.synergyGraphics = this.scene.add.graphics().setDepth(12);
    this.createPreviewLayer();
    this.statusText = this.scene.add.text(
      this.gridLeft,
      this.gridTop + this.height * this.cellSize + 13,
      this.defaultStatusText(),
      {
        fontSize: '15px', color: '#c8bdba', fontStyle: 'bold', stroke: '#0d0c10', strokeThickness: 3,
        wordWrap: { width: 310 },
      },
    );
    this.createRotateButton();

    for (const item of this.state.items) this.createItemView(item, false);
    this.refreshSynergies(false);
  }

  getSnapshot(): BackpackBoardSnapshot {
    return {
      items: this.state.items.map((item) => ({ ...item, origin: { ...item.origin } })),
      nextLootSequence: this.nextLootSequence,
    };
  }

  setUnlockedPocketCount(requestedCount: number): boolean {
    const nextCount = Math.max(this.unlockedPocketCount, this.normalizeUnlockCount(requestedCount));
    if (nextCount === this.unlockedPocketCount) return false;

    const previousBlocked = new Set(this.blockedCells.map((cell) => `${cell.x}:${cell.y}`));
    this.unlockedPocketCount = nextCount;
    this.blockedCells = this.blockedCellsFor(nextCount);
    this.state = { ...this.state, blockedCells: this.blockedCells };
    this.drawGrid();

    const newlyUnlocked = POCKET_UNLOCK_ORDER.filter(
      (cell) => previousBlocked.has(`${cell.x}:${cell.y}`)
        && !this.blockedCells.some((blocked) => blocked.x === cell.x && blocked.y === cell.y),
    );
    for (const cell of newlyUnlocked) this.pulseUnlockedCell(cell);
    this.setStatus(`POCKET EXPANDED • ${this.unlockedPocketCount}/3 BONUS CELLS OPEN`, '#b8ff8e');
    return true;
  }

  addRewardItem(definitionId: string): boolean {
    const definition = this.definitions.get(definitionId);
    if (!definition) throw new Error(`Unknown reward item definition: ${definitionId}`);

    const instanceId = `loot-${this.nextLootSequence}-${definitionId}`;
    const placement = findFirstValidPlacement(this.state, this.definitions, definitionId, instanceId);
    if (!placement) {
      this.setStatus(`NO LEGAL SPACE FOR ${definition.name.toUpperCase()} • REPACK FIRST`, '#ffbd72');
      return false;
    }

    this.nextLootSequence += 1;
    this.state = { ...this.state, items: [...this.state.items, placement] };
    const view = this.createItemView(placement, true);
    const newConnections = this.refreshSynergies(true);
    this.rewardArrival(view);
    const synergyText = newConnections.length > 0
      ? ` • +${newConnections.length} LINK${newConnections.length === 1 ? '' : 'S'}`
      : '';
    this.setStatus(`${definition.name.toUpperCase()} AUTO-PACKED${synergyText}`, '#b8ff8e');
    this.notifyStateChanged();
    return true;
  }

  private initialItems(): PlacedItem[] {
    return [
      { instanceId: 'battery-1', definitionId: 'angry-battery', origin: { x: 3, y: 0 }, rotation: 0 },
      { instanceId: 'toaster-1', definitionId: 'cursed-toaster', origin: { x: 2, y: 0 }, rotation: 0 },
      { instanceId: 'cat-1', definitionId: 'laser-cat', origin: { x: 4, y: 0 }, rotation: 0 },
      { instanceId: 'duck-1', definitionId: 'mutant-duck', origin: { x: 0, y: 1 }, rotation: 0 },
      { instanceId: 'poison-1', definitionId: 'poison-flask', origin: { x: 4, y: 2 }, rotation: 0 },
      { instanceId: 'fish-1', definitionId: 'fish-blaster', origin: { x: 4, y: 1 }, rotation: 0 },
      { instanceId: 'magnet-1', definitionId: 'scrap-magnet', origin: { x: 2, y: 2 }, rotation: 0 },
      { instanceId: 'fan-1', definitionId: 'toxic-fan', origin: { x: 0, y: 4 }, rotation: 0 },
    ];
  }

  private sanitizeInitialItems(items: readonly PlacedItem[]): PlacedItem[] {
    const accepted: PlacedItem[] = [];
    const instanceIds = new Set<string>();
    for (const item of items) {
      if (instanceIds.has(item.instanceId) || !this.definitions.has(item.definitionId)) continue;
      const candidate: PlacedItem = {
        instanceId: item.instanceId,
        definitionId: item.definitionId,
        origin: { x: item.origin.x, y: item.origin.y },
        rotation: item.rotation,
      };
      const candidateState: InventoryState = {
        width: this.width, height: this.height, blockedCells: this.blockedCells, items: accepted,
      };
      if (!validatePlacement(candidateState, this.definitions, candidate).ok) continue;
      accepted.push(candidate);
      instanceIds.add(candidate.instanceId);
    }
    return accepted;
  }

  private drawGrid(): void {
    for (const object of this.gridObjects) object.destroy();
    this.gridObjects.length = 0;
    const blocked = new Set(this.blockedCells.map((cell) => `${cell.x}:${cell.y}`));

    for (let row = 0; row < this.height; row += 1) {
      for (let column = 0; column < this.width; column += 1) {
        const isBlocked = blocked.has(`${column}:${row}`);
        const x = this.gridLeft + (column + 0.5) * this.cellSize;
        const y = this.gridTop + (row + 0.5) * this.cellSize;
        const baseFill = (row + column) % 2 === 0 ? 0x25242c : 0x2a2932;
        const cell = this.scene.add.rectangle(x, y, this.cellSize - 7, this.cellSize - 7, isBlocked ? 0x121217 : baseFill, 1)
          .setStrokeStyle(2, isBlocked ? 0x443a3b : 0x5b514d).setDepth(1);
        const inset = this.scene.add.rectangle(x, y, this.cellSize - 17, this.cellSize - 17, isBlocked ? 0x15151b : 0x17171d, isBlocked ? 0.6 : 0.23)
          .setStrokeStyle(1, isBlocked ? 0x342c2f : 0x827066, 0.32).setDepth(1);
        this.gridObjects.push(cell, inset);

        if (isBlocked) {
          const bar = this.scene.add.rectangle(x, y - 10, 38, 7, 0x6e4c43, 1).setStrokeStyle(1, 0xb67868).setDepth(2);
          const label = this.scene.add.text(x, y + 8, 'POCKET\nLOCKED', {
            fontSize: '9px', color: '#7e7072', fontStyle: 'bold', align: 'center', lineSpacing: -2,
          }).setOrigin(0.5).setDepth(2);
          this.gridObjects.push(bar, label);
        } else {
          this.gridObjects.push(this.scene.add.circle(x - this.cellSize * 0.32, y - this.cellSize * 0.32, 2, 0xb89275, 0.35).setDepth(2));
        }
      }
    }
  }

  private createPreviewLayer(): void {
    for (let index = 0; index < this.width * this.height; index += 1) {
      this.previewCells.push(
        this.scene.add.rectangle(0, 0, this.cellSize - 10, this.cellSize - 10, PANEL_VISUALS.neonLime, 0.22)
          .setStrokeStyle(4, PANEL_VISUALS.neonLime).setVisible(false).setDepth(40),
      );
    }
  }

  private createRotateButton(): void {
    const x = this.gridLeft + this.width * this.cellSize - 78;
    const y = this.gridTop + this.height * this.cellSize + 30;
    const shadow = this.scene.add.rectangle(x + 3, y + 4, 156, 42, PANEL_VISUALS.ink, 0.62);
    const background = this.scene.add.rectangle(x, y, 156, 42, 0x342842, 1)
      .setStrokeStyle(3, PANEL_VISUALS.neonPurple).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, '↻  ROTATE JUNK', {
      fontSize: '15px', color: '#ecd7ff', fontStyle: 'bold', stroke: '#17121b', strokeThickness: 3,
    }).setOrigin(0.5);

    background.on('pointerover', () => background.setFillStyle(0x4d365e));
    background.on('pointerout', () => background.setFillStyle(0x342842));
    background.on('pointerdown', () => { background.setScale(0.96); label.setScale(0.96); shadow.setScale(0.96); });
    const restore = (): void => { background.setScale(1); label.setScale(1); shadow.setScale(1); };
    background.on('pointerupoutside', restore);
    background.on('pointerup', () => { restore(); this.rotateSelected(); });
  }

  private createItemView(item: PlacedItem, animateArrival: boolean): ItemView {
    const container = this.scene.add.container(0, 0).setDepth(20);
    const view: ItemView = { container, item, dragStartItem: item, dragValid: null };
    this.itemViews.set(item.instanceId, view);
    this.renderItem(view);
    this.snapView(view, false);
    if (animateArrival) container.setScale(0.8).setAlpha(0.5);

    container.on('pointerdown', () => this.select(item.instanceId));
    this.scene.input.on('dragstart', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
      if (target !== container) return;
      this.beginDrag(view);
    });
    this.scene.input.on('drag', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      if (target !== container) return;
      this.updateDrag(view, dragX, dragY);
    });
    this.scene.input.on('dragend', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
      if (target !== container) return;
      this.endDrag(view);
    });
    return view;
  }

  private beginDrag(view: ItemView): void {
    this.select(view.item.instanceId);
    view.dragStartItem = view.item;
    view.dragValid = null;
    this.scene.tweens.killTweensOf(view.container);
    view.container.setDepth(100).setAngle(-1.2);
    this.scene.tweens.add({ targets: view.container, scaleX: 1.07, scaleY: 1.07, duration: 90, ease: 'Quad.Out' });
    this.synergyGraphics.setAlpha(0.24);
    this.setStatus(`${this.definitionFor(view.item).name.toUpperCase()} LIFTED • FIND A CLEAN FIT`, '#d8c8e8');
  }

  private updateDrag(view: ItemView, dragX: number, dragY: number): void {
    view.container.setPosition(dragX, dragY);
    const candidate = this.candidateFromWorld(view, dragX, dragY);
    const result = validatePlacement(this.state, this.definitions, candidate, view.item.instanceId);
    this.showPreview(result.occupiedCells, result.ok);
    if (view.dragValid !== result.ok) {
      view.dragValid = result.ok;
      this.scene.tweens.killTweensOf(view.container);
      this.scene.tweens.add({
        targets: view.container,
        scaleX: result.ok ? 1.075 : 1.035,
        scaleY: result.ok ? 1.075 : 1.035,
        duration: 70,
        ease: 'Quad.Out',
      });
    }
    this.drawSynergyLinks();
  }

  private endDrag(view: ItemView): void {
    const candidate = this.candidateFromWorld(view, view.container.x, view.container.y);
    const result = validatePlacement(this.state, this.definitions, candidate, view.item.instanceId);
    this.hidePreview();
    this.synergyGraphics.setAlpha(1);
    view.container.setDepth(20).setAngle(0);
    view.dragValid = null;

    if (result.ok) {
      view.item = candidate;
      this.replaceStateItem(candidate);
      const newConnections = this.refreshSynergies(true);
      this.flashCells(result.occupiedCells, PANEL_VISUALS.neonLime);
      this.snapView(view, true, () => this.dropImpact(view, PANEL_VISUALS.neonLime));
      if (newConnections.length > 0) this.setStatus(this.synergyActivationText(newConnections), '#ffe477');
      else this.setStatus(`${this.definitionFor(view.item).name.toUpperCase()} PACKED • ${this.synergySnapshot.connections.length} ACTIVE LINKS`, '#b8ff8e');
      this.notifyStateChanged();
      return;
    }

    view.item = view.dragStartItem;
    this.flashCells(result.occupiedCells, PANEL_VISUALS.danger);
    this.snapView(view, true, () => this.invalidImpact(view));
    this.drawSynergyLinks();
    this.setStatus(this.reasonText(result.reason), '#ff8a9b');
  }

  private renderItem(view: ItemView): void {
    const definition = this.definitionFor(view.item);
    const shape = rotateShape(definition.shape, view.item.rotation);
    const shapeWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
    const shapeHeight = Math.max(...shape.map((cell) => cell.y)) + 1;
    const widthPx = shapeWidth * this.cellSize;
    const heightPx = shapeHeight * this.cellSize;
    const rarity = rarityVisual(definition.rarity);
    const selected = view.item.instanceId === this.selectedInstanceId;
    const activeLinkCount = this.activeConnectionsFor(view.item.instanceId).length;

    view.container.removeAll(true);
    view.container.setSize(widthPx, heightPx);
    view.container.add(this.scene.add.rectangle(4, 6, widthPx - 8, heightPx - 8, PANEL_VISUALS.ink, 0.58).setStrokeStyle(2, 0x090a0d, 0.55));

    for (const cell of shape) {
      const localX = (cell.x + 0.5) * this.cellSize - widthPx / 2;
      const localY = (cell.y + 0.5) * this.cellSize - heightPx / 2;
      const tile = this.scene.add.rectangle(localX, localY, this.cellSize - 11, this.cellSize - 11, rarity.fill, activeLinkCount > 0 ? 0.96 : 0.88)
        .setStrokeStyle(selected ? 4 : 3, selected ? 0xffffff : rarity.stroke);
      const inset = this.scene.add.rectangle(localX, localY, this.cellSize - 20, this.cellSize - 20, rarity.mid, 0.48)
        .setStrokeStyle(1, rarity.accent, activeLinkCount > 0 ? 0.62 : 0.28);
      view.container.add([tile, inset]);
    }

    const glyphSize = Math.min(58, Math.max(38, Math.min(widthPx, heightPx) * 0.62));
    view.container.add(createItemGlyph(this.scene, definition, 0, -Math.min(5, heightPx * 0.04), { size: glyphSize, selected, compact: true }));

    const labelWidth = Math.min(widthPx - 10, 120);
    const labelY = heightPx / 2 - 10;
    const tape = this.scene.add.rectangle(0, labelY, labelWidth, 18, PANEL_VISUALS.paper, 0.94).setStrokeStyle(1, 0x4c3b31, 0.65).setAngle(-1.5);
    const label = this.scene.add.text(0, labelY, definition.name.toUpperCase(), {
      fontSize: shapeWidth >= 2 ? '10px' : '8px', align: 'center', color: '#2b211d', fontStyle: 'bold', wordWrap: { width: labelWidth - 8 },
    }).setOrigin(0.5).setAngle(-1.5);
    view.container.add([tape, label]);

    if (activeLinkCount > 0) {
      const badgeX = widthPx / 2 - 16;
      const badgeY = -heightPx / 2 + 16;
      view.container.add([
        this.scene.add.circle(badgeX, badgeY, 13, PANEL_VISUALS.gold, 1).setStrokeStyle(3, 0x2c2134),
        this.scene.add.text(badgeX, badgeY, `×${activeLinkCount}`, { fontSize: '10px', color: '#241a20', fontStyle: 'bold' }).setOrigin(0.5),
      ]);
    }

    if (selected) {
      view.container.add([
        this.scene.add.rectangle(0, -heightPx / 2 + 8, Math.min(widthPx - 18, 92), 13, 0xffffff, 0.92),
        this.scene.add.text(0, -heightPx / 2 + 8, 'SELECTED', { fontSize: '7px', color: '#221c26', fontStyle: 'bold' }).setOrigin(0.5),
      ]);
    }

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
    if (!view) return;
    this.renderItem(view);
    this.scene.tweens.add({ targets: view.container, scaleX: 1.025, scaleY: 1.025, yoyo: true, duration: 70, ease: 'Sine.Out' });
    const definition = this.definitionFor(view.item);
    const links = this.activeConnectionsFor(instanceId).length;
    const bonusSummary = this.bonusSummaryFor(instanceId);
    const activeText = links > 0 ? ` • ${links} LINK${links === 1 ? '' : 'S'}${bonusSummary ? ` • ${bonusSummary}` : ''}` : '';
    this.setStatus(`${definition.name.toUpperCase()} • ${definition.description}${activeText}`, '#e8ddf2');
  }

  private rotateSelected(): void {
    if (!this.selectedInstanceId) {
      this.setStatus('SELECT AN ITEM FIRST.', '#ffd27d');
      return;
    }
    const view = this.itemViews.get(this.selectedInstanceId);
    if (!view) return;

    const nextRotation = ((view.item.rotation + 1) % 4) as 0 | 1 | 2 | 3;
    const candidate: PlacedItem = { ...view.item, rotation: nextRotation };
    const result = validatePlacement(this.state, this.definitions, candidate, view.item.instanceId);
    if (!result.ok) {
      this.setStatus(`ROTATION BLOCKED • ${this.reasonText(result.reason)}`, '#ff8a9b');
      this.invalidImpact(view);
      return;
    }

    view.item = candidate;
    this.replaceStateItem(candidate);
    const newConnections = this.refreshSynergies(true);
    this.renderItem(view);
    this.snapView(view, true, () => this.dropImpact(view, PANEL_VISUALS.neonPurple));
    if (newConnections.length > 0) this.setStatus(this.synergyActivationText(newConnections), '#ffe477');
    else this.setStatus(`${this.definitionFor(view.item).name.toUpperCase()} ROTATED • ${this.synergySnapshot.connections.length} ACTIVE LINKS`, '#b8ff8e');
    this.notifyStateChanged();
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

  private snapView(view: ItemView, animate: boolean, onComplete?: () => void): void {
    const definition = this.definitionFor(view.item);
    const shape = rotateShape(definition.shape, view.item.rotation);
    const shapeWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
    const shapeHeight = Math.max(...shape.map((cell) => cell.y)) + 1;
    const x = this.gridLeft + (view.item.origin.x + shapeWidth / 2) * this.cellSize;
    const y = this.gridTop + (view.item.origin.y + shapeHeight / 2) * this.cellSize;

    this.scene.tweens.killTweensOf(view.container);
    if (!animate) {
      view.container.setPosition(x, y).setScale(1).setAlpha(1);
      onComplete?.();
      return;
    }

    this.scene.tweens.add({
      targets: view.container,
      x,
      y,
      scaleX: 0.97,
      scaleY: 0.97,
      alpha: 1,
      duration: 135,
      ease: 'Back.Out',
      onUpdate: () => this.drawSynergyLinks(),
      onComplete: () => {
        this.scene.tweens.add({
          targets: view.container,
          scaleX: 1,
          scaleY: 1,
          duration: 85,
          ease: 'Quad.Out',
          onComplete: () => { this.drawSynergyLinks(); onComplete?.(); },
        });
      },
    });
  }

  private rewardArrival(view: ItemView): void {
    this.scene.tweens.killTweensOf(view.container);
    view.container.setScale(0.78).setAlpha(0.35).setAngle(-3);
    this.scene.tweens.add({
      targets: view.container, scaleX: 1.06, scaleY: 1.06, alpha: 1, angle: 0, duration: 190, ease: 'Back.Out',
      onComplete: () => this.scene.tweens.add({ targets: view.container, scaleX: 1, scaleY: 1, duration: 90, ease: 'Quad.Out' }),
    });
  }

  private dropImpact(view: ItemView, color: number): void {
    const ring = this.scene.add.circle(view.container.x, view.container.y, 18, color, 0).setStrokeStyle(4, color, 0.78).setDepth(38);
    this.scene.tweens.add({
      targets: ring, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 220, ease: 'Quad.Out', onComplete: () => ring.destroy(),
    });
  }

  private invalidImpact(view: ItemView): void {
    this.scene.tweens.killTweensOf(view.container);
    this.scene.tweens.add({
      targets: view.container,
      angle: { from: -2.5, to: 2.5 },
      scaleX: 0.985,
      scaleY: 0.985,
      yoyo: true,
      repeat: 2,
      duration: 48,
      onComplete: () => view.container.setAngle(0).setScale(1),
    });
  }

  private flashCells(cells: readonly Cell[], color: number): void {
    for (const cell of cells) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= this.width || cell.y >= this.height) continue;
      const flash = this.scene.add.rectangle(
        this.gridLeft + (cell.x + 0.5) * this.cellSize,
        this.gridTop + (cell.y + 0.5) * this.cellSize,
        this.cellSize - 8,
        this.cellSize - 8,
        color,
        0.28,
      ).setStrokeStyle(3, color, 0.9).setDepth(39);
      this.scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.08, scaleY: 1.08, duration: 210, ease: 'Quad.Out', onComplete: () => flash.destroy() });
    }
  }

  private showPreview(cells: readonly Cell[], ok: boolean): void {
    this.hidePreview();
    let previewIndex = 0;
    for (const cell of cells) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= this.width || cell.y >= this.height) continue;
      const preview = this.previewCells[previewIndex];
      if (!preview) break;
      const color = ok ? PANEL_VISUALS.neonLime : PANEL_VISUALS.danger;
      preview
        .setPosition(this.gridLeft + (cell.x + 0.5) * this.cellSize, this.gridTop + (cell.y + 0.5) * this.cellSize)
        .setFillStyle(color, ok ? 0.26 : 0.32)
        .setStrokeStyle(ok ? 3 : 4, color)
        .setScale(ok ? 0.96 : 0.92)
        .setVisible(true);
      previewIndex += 1;
    }
  }

  private hidePreview(): void {
    for (const preview of this.previewCells) preview.setVisible(false).setScale(1);
  }

  private refreshSynergies(pulseNew: boolean): SynergyConnection[] {
    const previousKeys = new Set(this.synergySnapshot.connections.map(connectionKey));
    this.synergySnapshot = evaluateSynergies(this.state, this.definitions);
    const newConnections = this.synergySnapshot.connections.filter((connection) => !previousKeys.has(connectionKey(connection)));
    for (const view of this.itemViews.values()) this.renderItem(view);
    this.drawSynergyLinks();
    if (pulseNew) for (const connection of newConnections) this.pulseConnection(connection);
    return newConnections;
  }

  private drawSynergyLinks(): void {
    this.synergyGraphics.clear();
    for (const connection of this.synergySnapshot.connections) {
      const source = this.itemViews.get(connection.sourceInstanceId);
      const target = this.itemViews.get(connection.targetInstanceId);
      if (!source || !target) continue;
      const color = SYNERGY_COLORS[connection.ruleId];
      const sx = source.container.x;
      const sy = source.container.y;
      const tx = target.container.x;
      const ty = target.container.y;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      this.synergyGraphics.lineStyle(10, color, 0.1).lineBetween(sx, sy, tx, ty);
      this.synergyGraphics.lineStyle(3, color, 0.94).lineBetween(sx, sy, tx, ty);
      this.synergyGraphics.fillStyle(color, 1).fillCircle(sx, sy, 5).fillCircle(tx, ty, 5).fillCircle(mx, my, 6);
      this.synergyGraphics.lineStyle(2, 0xffffff, 0.55).strokeCircle(mx, my, 9);
    }
  }

  private pulseConnection(connection: SynergyConnection): void {
    const source = this.itemViews.get(connection.sourceInstanceId);
    const target = this.itemViews.get(connection.targetInstanceId);
    if (!source || !target) return;
    const color = SYNERGY_COLORS[connection.ruleId];
    for (let index = 0; index < 3; index += 1) {
      const trail = this.scene.add.circle(source.container.x, source.container.y, 7 - index, color, 1 - index * 0.18).setDepth(35);
      this.scene.tweens.add({
        targets: trail,
        x: target.container.x,
        y: target.container.y,
        scaleX: 0.35,
        scaleY: 0.35,
        alpha: 0.35,
        delay: index * 38,
        duration: 190,
        ease: 'Quad.Out',
        onComplete: () => trail.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: [source.container, target.container], scaleX: 1.07, scaleY: 1.07, yoyo: true, duration: 120, ease: 'Sine.Out',
      onComplete: () => { source.container.setScale(1); target.container.setScale(1); },
    });
  }

  private pulseUnlockedCell(cell: Cell): void {
    const x = this.gridLeft + (cell.x + 0.5) * this.cellSize;
    const y = this.gridTop + (cell.y + 0.5) * this.cellSize;
    const pulse = this.scene.add.rectangle(x, y, this.cellSize - 6, this.cellSize - 6, PANEL_VISUALS.neonLime, 0.34)
      .setStrokeStyle(5, PANEL_VISUALS.neonLime).setDepth(15);
    const inner = this.scene.add.circle(x, y, 9, PANEL_VISUALS.neonLime, 0.8).setDepth(16);
    this.scene.tweens.add({ targets: pulse, alpha: 0, scaleX: 1.18, scaleY: 1.18, duration: 520, ease: 'Sine.Out', onComplete: () => pulse.destroy() });
    this.scene.tweens.add({ targets: inner, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 340, ease: 'Quad.Out', onComplete: () => inner.destroy() });
  }

  private activeConnectionsFor(instanceId: string): readonly SynergyConnection[] {
    return this.synergySnapshot.connections.filter(
      (connection) => connection.sourceInstanceId === instanceId || connection.targetInstanceId === instanceId,
    );
  }

  private bonusSummaryFor(instanceId: string): string {
    const bonuses = this.synergySnapshot.bonusesByInstanceId[instanceId];
    return bonuses ? this.formatBonuses(bonuses) : '';
  }

  private formatBonuses(bonuses: ItemBonuses): string {
    const parts: string[] = [];
    if (bonuses.triggerSpeedPct > 0) parts.push(`+${bonuses.triggerSpeedPct}% SPEED`);
    if (bonuses.poisonOnHit > 0) parts.push(`+${bonuses.poisonOnHit} POISON`);
    if (bonuses.bonusLaserShots > 0) parts.push(`+${bonuses.bonusLaserShots} LASER`);
    if (bonuses.chaosPower > 0) parts.push(`+${bonuses.chaosPower} CHAOS`);
    if (bonuses.scrapArmor > 0) parts.push(`+${bonuses.scrapArmor} ARMOR`);
    return parts.join(', ');
  }

  private synergyActivationText(connections: readonly SynergyConnection[]): string {
    const first = connections[0];
    if (!first) return 'SYNERGY ACTIVATED';
    const rule = SYNERGY_RULE_MAP.get(first.ruleId);
    if (!rule) return 'SYNERGY ACTIVATED';
    const extra = connections.length > 1 ? ` +${connections.length - 1} MORE` : '';
    return `⚡ SYNERGY • ${rule.label.toUpperCase()} • ${rule.effectText.toUpperCase()}${extra}`;
  }

  private replaceStateItem(item: PlacedItem): void {
    this.state = { ...this.state, items: this.state.items.map((current) => current.instanceId === item.instanceId ? item : current) };
  }

  private notifyStateChanged(): void { this.onStateChanged?.(this.getSnapshot()); }

  private definitionFor(item: PlacedItem): ItemDefinition {
    const definition = this.definitions.get(item.definitionId);
    if (!definition) throw new Error(`Unknown item definition: ${item.definitionId}`);
    return definition;
  }

  private normalizeUnlockCount(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(POCKET_UNLOCK_ORDER.length, Math.floor(value)));
  }

  private blockedCellsFor(unlockedCount: number): readonly Cell[] {
    return POCKET_UNLOCK_ORDER.slice(this.normalizeUnlockCount(unlockedCount)).map((cell) => ({ ...cell }));
  }

  private defaultStatusText(): string {
    const locked = POCKET_UNLOCK_ORDER.length - this.unlockedPocketCount;
    return locked > 0
      ? `DRAG JUNK • ${locked} POCKET CELL${locked === 1 ? '' : 'S'} STILL LOCKED`
      : 'FULL BAG OPEN • SIDE-CONTACT CREATES LIVE SYNERGIES';
  }

  private setStatus(message: string, color: string): void { this.statusText.setText(message).setColor(color); }

  private reasonText(reason: 'out-of-bounds' | 'blocked' | 'occupied' | undefined): string {
    if (reason === 'out-of-bounds') return 'SHAPE DOES NOT FIT INSIDE THE BAG';
    if (reason === 'blocked') return 'POCKET LOCKED • BEAT BOSSES TO OPEN IT';
    if (reason === 'occupied') return 'THOSE CELLS ARE ALREADY OCCUPIED';
    return 'INVALID PLACEMENT';
  }
}
