import * as Phaser from 'phaser';
import { createHudActionLayout, type HudActionId, type HudActionPlacement } from '../domain/hudLayout';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';
import { createMaterialSurface } from './materialSurface';
import { REQUEST_NEW_RUN_EVENT } from './runUiEvents';

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
  readonly shadow: Phaser.GameObjects.Rectangle;
  readonly highlight: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;
  readonly icon?: Phaser.GameObjects.Image;
}

const CONFIRM_WINDOW_MS = 3200;

export class TopHudActions {
  private readonly root: Phaser.GameObjects.Container;
  private readonly visuals = new Map<HudActionId, ActionVisual>();
  private readonly options: TopHudActionsOptions;
  private displayWidthCss: number;
  private armedAction: HudActionId | null = null;
  private confirmTimer?: Phaser.Time.TimerEvent;

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
    const onRequestNewRun = (): void => {
      this.clearConfirmation();
      this.options.onReset();
    };
    scene.scale.on('resize', onResize);
    scene.events.on(REQUEST_NEW_RUN_EVENT, onRequestNewRun);
    scene.events.once('shutdown', () => {
      scene.scale.off('resize', onResize);
      scene.events.off(REQUEST_NEW_RUN_EVENT, onRequestNewRun);
      this.confirmTimer?.destroy();
    });
  }

  private rebuild(): void {
    this.root.removeAll(true);
    this.visuals.clear();
    const layout = createHudActionLayout(this.displayWidthCss);
    for (const placement of layout.actions) {
      const palette = paletteFor(placement.id, placement.id === 'daily' && this.options.dailyActive);
      const shadow = this.scene.add.rectangle(
        placement.x + 3,
        placement.y + 4,
        placement.width,
        placement.height,
        0x050609,
        0.7,
      );
      const rect = this.scene.add.rectangle(
        placement.x,
        placement.y,
        placement.width,
        placement.height,
        palette.fill,
        1,
      ).setStrokeStyle(3, palette.stroke).setInteractive({ useHandCursor: true });
      const wear = createMaterialSurface(this.scene, {
        x: placement.x,
        y: placement.y,
        width: placement.width - 8,
        height: placement.height - 6,
        kind: 'scrap',
        seed: `hud-action:${placement.id}:${layout.mode}`,
        alpha: 0.52,
      });
      const highlight = this.scene.add.rectangle(
        placement.x,
        placement.y - placement.height / 2 + 3,
        placement.width - 10,
        2,
        palette.stroke,
        0.36,
      );

      const icon = createActionIcon(this.scene, placement);
      const textOffset = icon ? (placement.compactLabel ? 9 : 8) : 0;
      const text = this.scene.add.text(
        placement.x + textOffset,
        placement.y,
        labelFor(placement.id, placement.compactLabel, this.options.dailyKey, this.options.dailyActive),
        {
          fontFamily: 'Arial Black, Impact, sans-serif',
          fontSize: placement.compactLabel ? '11px' : placement.id === 'daily' ? '10px' : '9px',
          color: palette.text,
          stroke: '#090a0e',
          strokeThickness: 3,
          letterSpacing: placement.compactLabel ? 0.15 : 0.35,
        },
      ).setOrigin(0.5);

      const fastenerLeft = this.scene.add.circle(
        placement.x - placement.width / 2 + 7,
        placement.y,
        2.2,
        0xa9afb8,
        0.75,
      );
      const fastenerRight = this.scene.add.circle(
        placement.x + placement.width / 2 - 7,
        placement.y,
        2.2,
        0xa9afb8,
        0.75,
      );

      rect.on('pointerover', () => {
        rect.setFillStyle(palette.hover).setStrokeStyle(4, palette.activeStroke);
        highlight.setFillStyle(palette.activeStroke, 0.7);
      });
      rect.on('pointerout', () => {
        rect.setFillStyle(palette.fill).setStrokeStyle(3, palette.stroke);
        highlight.setFillStyle(palette.stroke, 0.36);
      });
      rect.on('pointerdown', () => this.setPressed(rect, shadow, highlight, text, icon, true));
      const restore = (): void => this.setPressed(rect, shadow, highlight, text, icon, false);
      rect.on('pointerupoutside', restore);
      rect.on('pointerup', () => {
        restore();
        this.activate(placement, text);
      });

      this.root.add([shadow, rect, wear, highlight]);
      if (icon) this.root.add(icon);
      this.root.add([text, fastenerLeft, fastenerRight]);
      this.visuals.set(placement.id, { placement, rect, shadow, highlight, text, icon });
    }
  }

  private setPressed(
    rect: Phaser.GameObjects.Rectangle,
    shadow: Phaser.GameObjects.Rectangle,
    highlight: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text,
    icon: Phaser.GameObjects.Image | undefined,
    pressed: boolean,
  ): void {
    const scale = pressed ? 0.965 : 1;
    rect.setScale(scale);
    shadow.setScale(scale);
    highlight.setScale(scale);
    text.setScale(scale);
    icon?.setAlpha(pressed ? 0.76 : 1);
  }

  private activate(placement: HudActionPlacement, text: Phaser.GameObjects.Text): void {
    const requiresConfirmation = placement.id === 'reset';
    if (!requiresConfirmation) {
      callbackFor(placement.id, this.options)();
      return;
    }

    if (this.armedAction === placement.id) {
      this.clearConfirmation();
      callbackFor(placement.id, this.options)();
      return;
    }

    this.clearConfirmation();
    this.armedAction = placement.id;
    text.setText(confirmLabelFor(placement.id, placement.compactLabel));
    const visual = this.visuals.get(placement.id);
    visual?.rect.setStrokeStyle(4, 0xff9a72);
    this.confirmTimer = this.scene.time.delayedCall(CONFIRM_WINDOW_MS, () => this.clearConfirmation());
  }

  private clearConfirmation(): void {
    const armed = this.armedAction;
    this.armedAction = null;
    this.confirmTimer?.destroy();
    this.confirmTimer = undefined;
    if (!armed) return;
    const visual = this.visuals.get(armed);
    if (!visual) return;
    const palette = paletteFor(armed, armed === 'daily' && this.options.dailyActive);
    visual.rect.setStrokeStyle(3, palette.stroke);
    visual.text.setText(labelFor(armed, visual.placement.compactLabel, this.options.dailyKey, this.options.dailyActive));
  }
}

function createActionIcon(scene: Phaser.Scene, placement: HudActionPlacement): Phaser.GameObjects.Image | undefined {
  const texture = resolveAuthoredTexture(scene, uiArtKey(placement.id));
  if (!texture) return undefined;
  const size = placement.compactLabel ? 18 : 15;
  const left = placement.x - placement.width / 2 + (placement.compactLabel ? 17 : 18);
  const icon = scene.add.image(left, placement.y, texture.textureKey, texture.frame);
  const maxSide = Math.max(1, icon.width, icon.height);
  icon.setScale(size / maxSide);
  return icon;
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

function confirmLabelFor(id: HudActionId, compact: boolean): string {
  if (id === 'daily') return compact ? 'AGAIN?' : 'TAP AGAIN • REPLACE RUN';
  return compact ? 'SURE?' : 'TAP AGAIN • RESET RUN';
}

function labelFor(id: HudActionId, compact: boolean, _dailyKey: string, dailyActive: boolean): string {
  if (compact) {
    if (id === 'daily') return dailyActive ? 'DAILY' : 'DAILY';
    if (id === 'archive') return 'DEX';
    if (id === 'trophies') return 'TROPHY';
    if (id === 'help') return 'HELP';
    if (id === 'settings') return 'SET';
    return 'NEW';
  }
  if (id === 'daily') return dailyActive ? 'DAILY ACTIVE' : 'CHALLENGES';
  if (id === 'archive') return 'ARCHIVE';
  if (id === 'trophies') return 'TROPHIES';
  if (id === 'help') return 'HELP';
  if (id === 'settings') return 'SETTINGS';
  return 'NEW RUN';
}

function paletteFor(id: HudActionId, activeDaily: boolean): Readonly<{
  fill: number;
  hover: number;
  stroke: number;
  activeStroke: number;
  text: string;
}> {
  if (id === 'daily') return activeDaily
    ? { fill: 0x354124, hover: 0x45562d, stroke: 0x93c94e, activeStroke: 0xbaff57, text: '#e4ffc5' }
    : { fill: 0x2e3527, hover: 0x3c472e, stroke: 0x6f8f4d, activeStroke: 0xa4d969, text: '#d8e8c5' };
  if (id === 'archive') return { fill: 0x342a3b, hover: 0x483750, stroke: 0x8f5ba5, activeStroke: 0xc57ae2, text: '#f1dcf7' };
  if (id === 'trophies') return { fill: 0x352b25, hover: 0x4a392d, stroke: 0x9b754f, activeStroke: 0xe0ad69, text: '#f7e7cb' };
  if (id === 'help') return { fill: 0x263137, hover: 0x33424a, stroke: 0x5f8394, activeStroke: 0x83cce8, text: '#d9f0f7' };
  if (id === 'settings') return { fill: 0x2c3037, hover: 0x3a414b, stroke: 0x727f90, activeStroke: 0xa5b7ca, text: '#e1e8f0' };
  return { fill: 0x352528, hover: 0x4a3035, stroke: 0x8a555e, activeStroke: 0xff8a76, text: '#f2d9d5' };
}
