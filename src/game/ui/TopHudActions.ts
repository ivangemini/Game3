import * as Phaser from 'phaser';
import { createHudActionLayout, type HudActionId, type HudActionPlacement } from '../domain/hudLayout';

export interface TopHudActionsOptions {
  readonly dailyKey: string;
  readonly dailyActive: boolean;
  readonly onDaily: () => void;
  readonly onArchive: () => void;
  readonly onTrophies: () => void;
  readonly onHelp: () => void;
  readonly onSettings: () => void;
  readonly onReset: () => void;
}

interface ActionVisual {
  readonly placement: HudActionPlacement;
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;
}

export class TopHudActions {
  private readonly root: Phaser.GameObjects.Container;
  private readonly visuals = new Map<HudActionId, ActionVisual>();
  private readonly options: TopHudActionsOptions;
  private displayWidthCss: number;

  constructor(
    private readonly scene: Phaser.Scene,
    options: TopHudActionsOptions,
  ) {
    this.options = options;
    this.root = scene.add.container(0, 0).setDepth(90);
    this.displayWidthCss = readDisplayWidth(scene);
    this.rebuild();

    const onResize = (): void => {
      const nextWidth = readDisplayWidth(scene);
      const previousMode = createHudActionLayout(this.displayWidthCss).mode;
      const nextMode = createHudActionLayout(nextWidth).mode;
      this.displayWidthCss = nextWidth;
      if (previousMode !== nextMode) this.rebuild();
    };
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
  }

  private rebuild(): void {
    this.root.removeAll(true);
    this.visuals.clear();
    const layout = createHudActionLayout(this.displayWidthCss);
    for (const placement of layout.actions) {
      const palette = paletteFor(placement.id, placement.id === 'daily' && this.options.dailyActive);
      const rect = this.scene.add.rectangle(
        placement.x,
        placement.y,
        placement.width,
        placement.height,
        palette.fill,
        1,
      ).setStrokeStyle(2, palette.stroke).setInteractive({ useHandCursor: true });
      const text = this.scene.add.text(
        placement.x,
        placement.y,
        labelFor(placement.id, placement.compactLabel, this.options.dailyKey, this.options.dailyActive),
        {
          fontSize: placement.compactLabel ? '10px' : '11px',
          color: palette.text,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      rect.on('pointerover', () => rect.setFillStyle(palette.hover));
      rect.on('pointerout', () => rect.setFillStyle(palette.fill));
      rect.on('pointerdown', () => { rect.setScale(0.97); text.setScale(0.97); });
      rect.on('pointerup', () => {
        rect.setScale(1);
        text.setScale(1);
        callbackFor(placement.id, this.options)();
      });
      this.root.add([rect, text]);
      this.visuals.set(placement.id, { placement, rect, text });
    }
  }
}

function readDisplayWidth(scene: Phaser.Scene): number {
  const parentWidth = scene.scale.parentSize?.width;
  if (typeof parentWidth === 'number' && Number.isFinite(parentWidth) && parentWidth > 0) return parentWidth;
  const canvasWidth = scene.game.canvas?.clientWidth;
  return typeof canvasWidth === 'number' && canvasWidth > 0 ? canvasWidth : 1600;
}

function callbackFor(id: HudActionId, options: TopHudActionsOptions): () => void {
  if (id === 'daily') return options.onDaily;
  if (id === 'archive') return options.onArchive;
  if (id === 'trophies') return options.onTrophies;
  if (id === 'help') return options.onHelp;
  if (id === 'settings') return options.onSettings;
  return options.onReset;
}

function labelFor(id: HudActionId, compact: boolean, dailyKey: string, dailyActive: boolean): string {
  if (id === 'daily') {
    if (compact) return dailyActive ? 'DAILY • ACTIVE' : `DAILY • ${dailyKey.slice(5)}`;
    return dailyActive ? `DAILY ${dailyKey} • ACTIVE` : `DAILY RUN • ${dailyKey}`;
  }
  if (id === 'archive') return compact ? 'ARCHIVE ◆' : 'JUNK ARCHIVE ◆';
  if (id === 'trophies') return compact ? 'TROPHIES ✦' : 'TROPHY SHELF ✦';
  if (id === 'help') return compact ? '? HELP' : '? HOW TO PLAY';
  if (id === 'settings') return compact ? '⚙ SET' : '⚙ SETTINGS';
  return compact ? 'RESET' : 'NEW RUN / RESET';
}

function paletteFor(id: HudActionId, activeDaily: boolean): Readonly<{
  fill: number;
  hover: number;
  stroke: number;
  text: string;
}> {
  if (id === 'daily') return activeDaily
    ? { fill: 0x314421, hover: 0x415b2b, stroke: 0xb5ff4d, text: '#dfffba' }
    : { fill: 0x263224, hover: 0x354630, stroke: 0x71994a, text: '#c8e6a8' };
  if (id === 'archive') return { fill: 0x33243f, hover: 0x493258, stroke: 0xb26bd0, text: '#f4dfff' };
  if (id === 'trophies') return { fill: 0x2a2233, hover: 0x3b2e48, stroke: 0x8b6aa2, text: '#e7c8f5' };
  if (id === 'help') return { fill: 0x202c34, hover: 0x2e3d48, stroke: 0x6b93a6, text: '#d1edf7' };
  if (id === 'settings') return { fill: 0x252b34, hover: 0x343d49, stroke: 0x7b8fa6, text: '#d7e7f6' };
  return { fill: 0x252631, hover: 0x363843, stroke: 0x777381, text: '#d2ced7' };
}
