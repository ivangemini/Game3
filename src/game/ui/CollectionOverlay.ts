import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import type { FusionRecipe } from '../domain/fusions';
import {
  createCollectionSnapshot,
  type CollectionDiscoveryState,
  type CollectionSnapshot,
  type ItemdexEntry,
  type RecipeBookEntry,
} from '../domain/collection';
import type { Cell, ItemDefinition, Rarity } from '../domain/types';
import { dismissOverlay, pressPulse, revealOverlay } from './uiMotion';

export type CollectionTab = 'items' | 'recipes';

export interface CollectionTabViewEvent {
  readonly tab: CollectionTab;
  readonly tracedRecipes: number;
  readonly almostSolvedRecipes: number;
}

export interface CollectionOverlayOptions {
  readonly onTabViewed?: (event: CollectionTabViewEvent) => void;
}

const DEPTH = 1200;
const ITEM_PAGE_SIZE = 15;
const RECIPE_PAGE_SIZE = 12;
const RARITY_COLORS: Readonly<Record<Rarity, number>> = {
  common: 0x7d8494,
  uncommon: 0x7fd68f,
  rare: 0x77b7ff,
  epic: 0xd18cff,
};

export class CollectionOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private readonly getDiscovery: () => CollectionDiscoveryState;
  private readonly allItems: readonly ItemDefinition[];
  private readonly shopItems: readonly ItemDefinition[];
  private readonly recipes: readonly FusionRecipe[];
  private tab: CollectionTab = 'items';
  private itemPage = 0;
  private recipePage = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    allItems: readonly ItemDefinition[],
    shopItems: readonly ItemDefinition[],
    recipes: readonly FusionRecipe[],
    getDiscovery: () => CollectionDiscoveryState,
    private readonly options: CollectionOverlayOptions = {},
  ) {
    this.allItems = allItems;
    this.shopItems = shopItems;
    this.recipes = recipes;
    this.getDiscovery = getDiscovery;
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    this.content = scene.add.container(0, 0);
    this.root.add(this.content);

    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x06070a, 0.94)
      .setInteractive({ useHandCursor: false });
    const panel = scene.add.rectangle(800, 458, 1480, 800, 0x11141d, 1)
      .setStrokeStyle(3, 0x4c5264, 1);
    this.root.add([blocker, panel]);
    this.root.bringToTop(this.content);

    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(tab: CollectionTab = this.tab): void {
    this.tab = tab;
    const snapshot = this.refresh();
    this.notifyTabViewed(snapshot);
    revealOverlay(this.scene, this.root, this.content);
  }

  hide(): void {
    if (!this.root.visible) return;
    dismissOverlay(this.scene, this.root, this.content);
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  private refresh(): CollectionSnapshot {
    this.content.removeAll(true);
    const snapshot = createCollectionSnapshot(this.allItems, this.shopItems, this.recipes, this.getDiscovery());
    this.drawChrome(snapshot);
    if (this.tab === 'items') this.drawItems(snapshot);
    else this.drawRecipes(snapshot);
    return snapshot;
  }

  private notifyTabViewed(snapshot: CollectionSnapshot): void {
    const event: CollectionTabViewEvent = {
      tab: this.tab,
      tracedRecipes: snapshot.recipeClueProgress.traced,
      almostSolvedRecipes: snapshot.recipeClueProgress.almostSolved,
    };
    telemetry.track('archive_tab_viewed', event);
    this.options.onTabViewed?.(event);
  }

  private drawChrome(snapshot: CollectionSnapshot): void {
    this.content.add(this.scene.add.text(94, 76, 'JUNK ARCHIVE', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '36px', color: '#f7f2e8',
      stroke: '#090a0d', strokeThickness: 7,
    }));
    this.content.add(this.scene.add.text(94, 122, 'COLLECTION • UNKNOWN JUNK LEAVES SILHOUETTES • KNOWN INGREDIENTS REVEAL RECIPE CLUES', {
      fontSize: '12px', color: '#9fa5b6', fontStyle: 'bold',
    }));

    this.addTabButton(94, 158, 205, 'ITEMDEX', 'items');
    this.addTabButton(311, 158, 235, 'RECIPE BOOK', 'recipes');

    this.content.add(this.scene.add.text(590, 162,
      `ITEMS ${snapshot.itemProgress.discovered}/${snapshot.itemProgress.total} • ${snapshot.itemProgress.percent}%`,
      { fontSize: '15px', color: '#b5ff4d', fontStyle: 'bold' }));
    this.content.add(this.scene.add.text(850, 162,
      `RECIPES ${snapshot.recipeProgress.discovered}/${snapshot.recipeProgress.total} • ${snapshot.recipeProgress.percent}%`,
      { fontSize: '15px', color: '#ff91e6', fontStyle: 'bold' }));
    this.content.add(this.scene.add.text(1112, 162,
      `TRACES ${snapshot.recipeClueProgress.traced} • ALMOST ${snapshot.recipeClueProgress.almostSolved}`,
      { fontSize: '12px', color: snapshot.recipeClueProgress.almostSolved > 0 ? '#ffd56e' : '#8ceeff', fontStyle: 'bold' }));
    this.drawProgressBar(590, 194, 220, snapshot.itemProgress.percent, 0xb5ff4d);
    this.drawProgressBar(850, 194, 220, snapshot.recipeProgress.percent, 0xff91e6);

    const close = this.scene.add.rectangle(1454, 105, 116, 40, 0x2b2e3a, 1)
      .setStrokeStyle(2, 0x7f8496)
      .setInteractive({ useHandCursor: true });
    const closeText = this.scene.add.text(1454, 105, 'CLOSE  ×', {
      fontSize: '13px', color: '#f7f2e8', fontStyle: 'bold',
    }).setOrigin(0.5);
    close.on('pointerover', () => close.setFillStyle(0x414655));
    close.on('pointerout', () => close.setFillStyle(0x2b2e3a));
    close.on('pointerdown', () => pressPulse(this.scene, [close, closeText]));
    close.on('pointerup', () => this.hide());
    this.content.add([close, closeText]);
  }

  private addTabButton(x: number, y: number, width: number, label: string, tab: CollectionTab): void {
    const active = this.tab === tab;
    const rect = this.scene.add.rectangle(x + width / 2, y + 20, width, 40, active ? 0x3a3150 : 0x20232d, 1)
      .setStrokeStyle(2, active ? 0xd18cff : 0x555b6b)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x + width / 2, y + 20, label, {
      fontSize: '14px', color: active ? '#f4dfff' : '#c4c7d0', fontStyle: 'bold',
    }).setOrigin(0.5);
    rect.on('pointerover', () => { if (!active) rect.setFillStyle(0x303440); });
    rect.on('pointerout', () => { if (!active) rect.setFillStyle(0x20232d); });
    rect.on('pointerdown', () => {
      rect.setScale(0.98);
      text.setScale(0.98);
    });
    rect.on('pointerup', () => {
      rect.setScale(1);
      text.setScale(1);
      if (this.tab === tab) return;
      this.tab = tab;
      const snapshot = this.refresh();
      this.notifyTabViewed(snapshot);
    });
    this.content.add([rect, text]);
  }

  private drawItems(snapshot: CollectionSnapshot): void {
    const maxPage = Math.max(0, Math.ceil(snapshot.items.length / ITEM_PAGE_SIZE) - 1);
    this.itemPage = Math.min(this.itemPage, maxPage);
    const start = this.itemPage * ITEM_PAGE_SIZE;
    const entries = snapshot.items.slice(start, start + ITEM_PAGE_SIZE);
    entries.forEach((entry, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      this.drawItemCard(entry, 92 + col * 287, 225 + row * 184);
    });
    this.drawPagination(this.itemPage, maxPage, (next) => { this.itemPage = next; this.refresh(); });
  }

  private drawItemCard(entry: ItemdexEntry, x: number, y: number): void {
    const width = 268; const height = 166;
    if (!entry.discovered) {
      const card = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x151821, 1)
        .setStrokeStyle(2, 0x3a3e4c);
      this.content.add(card);
      this.drawShape(entry.silhouetteShape, x + width / 2, y + 48, 0x59606d, 0.72, 16);
      const mark = this.scene.add.text(x + width / 2, y + 88, '???', {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '22px', color: '#737a89',
      }).setOrigin(0.5);
      const label = this.scene.add.text(x + width / 2, y + 116, 'UNKNOWN SILHOUETTE', {
        fontSize: '10px', color: '#777d8c', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hint = this.scene.add.text(x + width / 2, y + 139, 'Recognize the shape, then find it in a run.', {
        fontSize: '9px', color: '#555b68',
      }).setOrigin(0.5);
      this.content.add([mark, label, hint]);
      return;
    }

    const definition = entry.definition;
    const rarityColor = RARITY_COLORS[definition.rarity];
    const card = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x1c202a, 1)
      .setStrokeStyle(2, rarityColor);
    const title = this.scene.add.text(x + 14, y + 12, definition.name.toUpperCase(), {
      fontSize: '15px', color: '#f7f2e8', fontStyle: 'bold',
    });
    const meta = this.scene.add.text(x + 14, y + 37,
      `${definition.rarity.toUpperCase()} • ${entry.source === 'shop' ? 'RUN DROP' : 'FUSION'}`,
      { fontSize: '10px', color: '#aeb4c3', fontStyle: 'bold' });
    const tags = this.scene.add.text(x + 14, y + 58, definition.tags.map((tag) => tag.toUpperCase()).join(' • '), {
      fontSize: '9px', color: '#b5ff4d', wordWrap: { width: 235 },
    });
    const description = this.scene.add.text(x + 14, y + 91, definition.description, {
      fontSize: '10px', color: '#c3c0c9', wordWrap: { width: 180 }, lineSpacing: 2,
    });
    this.content.add([card, title, meta, tags, description]);
    this.drawShape(definition.shape, x + 213, y + 108, 0xf7f2e8, 0.85, 13);
  }

  private drawShape(
    shape: readonly Cell[],
    x: number,
    y: number,
    color: number,
    alpha: number,
    cell: number,
  ): void {
    if (shape.length === 0) return;
    const xs = shape.map((part) => part.x);
    const ys = shape.map((part) => part.y);
    const width = (Math.max(...xs) + 1) * cell;
    const height = (Math.max(...ys) + 1) * cell;
    const startX = x - width / 2;
    const startY = y - height / 2;
    for (const part of shape) {
      const square = this.scene.add.rectangle(
        startX + part.x * cell + cell / 2,
        startY + part.y * cell + cell / 2,
        cell - 2, cell - 2, color, alpha,
      ).setStrokeStyle(1, 0x11141d);
      this.content.add(square);
    }
  }

  private drawRecipes(snapshot: CollectionSnapshot): void {
    const maxPage = Math.max(0, Math.ceil(snapshot.recipes.length / RECIPE_PAGE_SIZE) - 1);
    this.recipePage = Math.min(this.recipePage, maxPage);
    const start = this.recipePage * RECIPE_PAGE_SIZE;
    const entries = snapshot.recipes.slice(start, start + RECIPE_PAGE_SIZE);
    entries.forEach((entry, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      this.drawRecipeCard(entry, 92 + col * 358, 225 + row * 184);
    });
    this.drawPagination(this.recipePage, maxPage, (next) => { this.recipePage = next; this.refresh(); });
  }

  private drawRecipeCard(entry: RecipeBookEntry, x: number, y: number): void {
    const width = 338; const height = 166;
    if (!entry.discovered) {
      if (entry.clue.state === 'traced') {
        this.drawTracedRecipe(entry, x, y, width, height);
        return;
      }
      if (entry.clue.state === 'almost-solved') {
        this.drawAlmostSolvedRecipe(entry, x, y, width, height);
        return;
      }

      const card = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x151821, 1)
        .setStrokeStyle(2, 0x3a3e4c);
      const title = this.scene.add.text(x + width / 2, y + 49, '???  +  ???', {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '23px', color: '#676d7b',
      }).setOrigin(0.5);
      const arrow = this.scene.add.text(x + width / 2, y + 88, '↓', { fontSize: '22px', color: '#505562' }).setOrigin(0.5);
      const hint = this.scene.add.text(x + width / 2, y + 126, 'DISCOVER AN INGREDIENT TO TRACE THIS RECIPE', {
        fontSize: '9px', color: '#626875', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.content.add([card, title, arrow, hint]);
      return;
    }

    const secondStage = entry.stage === 'second-stage';
    const card = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, secondStage ? 0x241b30 : 0x1c202a, 1)
      .setStrokeStyle(2, secondStage ? 0xff91e6 : 0xb5ff4d);
    const stage = this.scene.add.text(x + 14, y + 12, secondStage ? 'SECRET SECOND-STAGE • DISCOVERED' : 'DISCOVERED RECIPE', {
      fontSize: '9px', color: secondStage ? '#ff91e6' : '#b5ff4d', fontStyle: 'bold',
    });
    const title = this.scene.add.text(x + 14, y + 34, entry.resultDefinition.name.toUpperCase(), {
      fontSize: '16px', color: '#f7f2e8', fontStyle: 'bold',
    });
    const ingredients = this.scene.add.text(x + 14, y + 68,
      entry.ingredientDefinitions.map((definition) => definition.name).join('  +  '),
      { fontSize: '11px', color: '#c9c5d1', wordWrap: { width: 310 } });
    const arrow = this.scene.add.text(x + 14, y + 101, '→', { fontSize: '18px', color: '#8d93a4', fontStyle: 'bold' });
    const result = this.scene.add.text(x + 40, y + 105, entry.resultDefinition.tags.map((tag) => tag.toUpperCase()).join(' • '), {
      fontSize: '9px', color: '#f0c3ff', wordWrap: { width: 278 },
    });
    const note = this.scene.add.text(x + 14, y + 139, 'ARCHIVE NOTE • FUSE THIS EXACT PAIR TO RECREATE IT', {
      fontSize: '8px', color: '#777d8c', fontStyle: 'bold',
    });
    this.content.add([card, stage, title, ingredients, arrow, result, note]);
  }

  private drawTracedRecipe(
    entry: Extract<RecipeBookEntry, { discovered: false }>,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (entry.clue.state !== 'traced') return;
    const knownCount = entry.clue.knownIngredientDefinitions.length;
    const missingCount = entry.clue.missingIngredientClues.length;
    const total = knownCount + missingCount;
    const card = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x17212a, 1)
      .setStrokeStyle(2, 0x66c8df);
    const stage = this.scene.add.text(x + 14, y + 12, `RECIPE TRACE • ${knownCount}/${total} INGREDIENTS KNOWN`, {
      fontSize: '9px', color: '#8ceeff', fontStyle: 'bold',
    });
    const known = entry.clue.knownIngredientDefinitions.map((definition) => definition.name.toUpperCase());
    const title = this.scene.add.text(x + 14, y + 38, [...known, ...Array(missingCount).fill('???')].join('  +  '), {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#e8f7ff',
      wordWrap: { width: 310 },
    });
    const missing = entry.clue.missingIngredientClues.map((clue) =>
      `${clue.rarity.toUpperCase()} ${clue.primaryTag.toUpperCase()} • ${clue.cellCount} CELL${clue.cellCount === 1 ? '' : 'S'}`);
    const clueText = this.scene.add.text(x + 14, y + 87, `MISSING TRACE\n${missing.join(' • ')}`, {
      fontSize: '9px', color: '#a8cad5', fontStyle: 'bold', wordWrap: { width: 310 }, lineSpacing: 3,
    });
    const note = this.scene.add.text(x + 14, y + 137, 'Find the missing silhouette; the result stays classified.', {
      fontSize: '9px', color: '#667f89',
    });
    this.content.add([card, stage, title, clueText, note]);
  }

  private drawAlmostSolvedRecipe(
    entry: Extract<RecipeBookEntry, { discovered: false }>,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (entry.clue.state !== 'almost-solved') return;
    const secret = entry.clue.stage === 'second-stage';
    const accent = secret ? 0xff91e6 : 0xffd56e;
    const card = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, secret ? 0x2b1c30 : 0x292519, 1)
      .setStrokeStyle(3, accent);
    const stage = this.scene.add.text(x + 14, y + 12, secret ? 'FORBIDDEN PAIR • ALMOST SOLVED' : 'ALMOST SOLVED • ALL INGREDIENTS FOUND', {
      fontSize: '9px', color: secret ? '#ff91e6' : '#ffd56e', fontStyle: 'bold',
    });
    const ingredients = this.scene.add.text(x + 14, y + 39,
      entry.clue.ingredientDefinitions.map((definition) => definition.name.toUpperCase()).join('  +  '),
      { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '14px', color: '#fff7df', wordWrap: { width: 310 } });
    const hint = this.scene.add.text(x + 14, y + 88, `ARCHIVE SIGNAL • ${entry.clue.authoredHint}`, {
      fontSize: '9px', color: secret ? '#ffc8f4' : '#f5dca0', fontStyle: 'bold', wordWrap: { width: 310 },
    });
    const result = this.scene.add.text(x + 14, y + 132, 'RESULT ??? • PUT BOTH IN THE FUSION LAB', {
      fontSize: '9px', color: '#d7d1c5', fontStyle: 'bold',
    });
    this.content.add([card, stage, ingredients, hint, result]);
  }

  private drawProgressBar(x: number, y: number, width: number, percent: number, color: number): void {
    const safePercent = Math.max(0, Math.min(100, percent));
    const track = this.scene.add.rectangle(x + width / 2, y, width, 5, 0x0d0f15, 1)
      .setStrokeStyle(1, 0x323643);
    this.content.add(track);
    const fillWidth = width * safePercent / 100;
    if (fillWidth <= 0) return;
    this.content.add(this.scene.add.rectangle(x, y, fillWidth, 3, color, 1).setOrigin(0, 0.5));
  }

  private drawPagination(page: number, maxPage: number, onChange: (page: number) => void): void {
    const y = 814;
    this.content.add(this.scene.add.text(800, y, `PAGE ${page + 1} / ${maxPage + 1}`, {
      fontSize: '12px', color: '#9ea4b2', fontStyle: 'bold',
    }).setOrigin(0.5));
    this.addPageButton(672, y, '‹ PREV', page > 0, () => onChange(page - 1));
    this.addPageButton(928, y, 'NEXT ›', page < maxPage, () => onChange(page + 1));
  }

  private addPageButton(x: number, y: number, label: string, enabled: boolean, callback: () => void): void {
    const rect = this.scene.add.rectangle(x, y, 120, 36, enabled ? 0x2a2e3a : 0x181a21, 1)
      .setStrokeStyle(2, enabled ? 0x666d7e : 0x30333d);
    const text = this.scene.add.text(x, y, label, {
      fontSize: '11px', color: enabled ? '#e7e4ec' : '#555965', fontStyle: 'bold',
    }).setOrigin(0.5);
    if (enabled) {
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerover', () => rect.setFillStyle(0x3a3f4d));
      rect.on('pointerout', () => rect.setFillStyle(0x2a2e3a));
      rect.on('pointerdown', () => {
        rect.setScale(0.98);
        text.setScale(0.98);
      });
      rect.on('pointerup', () => {
        rect.setScale(1);
        text.setScale(1);
        callback();
      });
    }
    this.content.add([rect, text]);
  }
}
