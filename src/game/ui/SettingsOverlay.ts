import * as Phaser from 'phaser';
import type { SaveSettings } from '../../persistence/save';
import { createMaterialSurface } from './materialSurface';
import { normalizeSettingsDraft, stepVolume, volumePercent, type SettingsDraft } from './settingsModel';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';

export interface SettingsOverlayOptions {
  readonly getSettings: () => SaveSettings;
  readonly onApply: (settings: SaveSettings) => void;
}

const DEPTH = 970;
const PANEL_X = 800;
const PANEL_Y = 450;

export class SettingsOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly musicValue: Phaser.GameObjects.Text;
  private readonly sfxValue: Phaser.GameObjects.Text;
  private readonly motionValue: Phaser.GameObjects.Text;
  private readonly motionLamp: Phaser.GameObjects.Arc;
  private readonly meter: Phaser.GameObjects.Graphics;
  private draft: SettingsDraft = { musicVolume: 0.8, sfxVolume: 0.9, reducedMotion: false };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: SettingsOverlayOptions,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.9).setInteractive();
    this.panel = scene.add.container(0, 0);

    const shadow = scene.add.rectangle(PANEL_X + 9, PANEL_Y + 11, 760, 590, 0x010204, 0.7);
    const shell = scene.add.rectangle(PANEL_X, PANEL_Y, 754, 584, 0x211b1c, 1)
      .setStrokeStyle(5, 0x765845);
    const inset = scene.add.rectangle(PANEL_X, PANEL_Y, 730, 560, 0x11141b, 1)
      .setStrokeStyle(2, 0x59606a, 0.75);
    const wear = createMaterialSurface(scene, {
      x: PANEL_X,
      y: PANEL_Y,
      width: 714,
      height: 544,
      kind: 'scrap',
      seed: 'settings:mixer-console:v1',
      depth: DEPTH + 0.2,
      alpha: 0.72,
    });

    const headerShadow = scene.add.rectangle(806, 194, 424, 60, 0x030405, 0.7);
    const header = scene.add.rectangle(800, 188, 424, 58, 0x60412f, 1)
      .setStrokeStyle(4, 0xb67d55)
      .setAngle(-0.7);
    const headerWear = createMaterialSurface(scene, {
      x: 800,
      y: 188,
      width: 406,
      height: 42,
      kind: 'paper',
      seed: 'settings:header',
      depth: DEPTH + 0.4,
      alpha: 0.54,
    }).setAngle(-0.7);

    const iconTexture = resolveAuthoredTexture(scene, uiArtKey('settings'));
    const icon = iconTexture
      ? scene.add.image(648, 188, iconTexture.textureKey, iconTexture.frame).setDisplaySize(34, 34)
      : scene.add.circle(648, 188, 15, 0xa9b6c4, 0.22).setStrokeStyle(2, 0xa9b6c4);
    const title = scene.add.text(814, 185, 'JUNK MIXER', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '30px', color: '#ffe7b4', stroke: '#1e120d', strokeThickness: 6,
    }).setOrigin(0.5).setAngle(-0.7);
    const subtitle = scene.add.text(800, 236, 'FIELD AUDIO // FEEL CONTROLS', {
      fontSize: '11px', color: '#a9afb9', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5);

    this.meter = scene.add.graphics();
    const musicRail = this.drawChannelShell(800, 348, 'MUSIC BUS', 'LOOP / AMBIENCE', 0x79cfff);
    const sfxRail = this.drawChannelShell(800, 448, 'IMPACT BUS', 'HITS / UI / BOSSES', 0xffc66d);

    this.musicValue = scene.add.text(916, 326, '', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#d9f0ff',
    }).setOrigin(1, 0.5);
    this.sfxValue = scene.add.text(916, 426, '', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#ffe3b0',
    }).setOrigin(1, 0.5);

    const musicMinus = this.makeButton(522, 357, '−', 58, () => {
      this.draft = { ...this.draft, musicVolume: stepVolume(this.draft.musicVolume, -1) };
      this.render();
    }, 0x253139, 0x668ea0);
    const musicPlus = this.makeButton(1078, 357, '+', 58, () => {
      this.draft = { ...this.draft, musicVolume: stepVolume(this.draft.musicVolume, 1) };
      this.render();
    }, 0x253139, 0x668ea0);
    const sfxMinus = this.makeButton(522, 457, '−', 58, () => {
      this.draft = { ...this.draft, sfxVolume: stepVolume(this.draft.sfxVolume, -1) };
      this.render();
    }, 0x3b3026, 0x9e7445);
    const sfxPlus = this.makeButton(1078, 457, '+', 58, () => {
      this.draft = { ...this.draft, sfxVolume: stepVolume(this.draft.sfxVolume, 1) };
      this.render();
    }, 0x3b3026, 0x9e7445);

    const motionShell = scene.add.rectangle(800, 552, 570, 70, 0x181922, 1)
      .setStrokeStyle(3, 0x736188, 0.76);
    const motionTape = scene.add.rectangle(588, 522, 155, 23, 0x58422f, 1)
      .setStrokeStyle(2, 0xa97a52)
      .setAngle(1.2);
    const motionLabel = scene.add.text(588, 522, 'MOTION DAMPER', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '9px', color: '#f4d9ae',
      stroke: '#1b120d', strokeThickness: 3,
    }).setOrigin(0.5).setAngle(1.2);
    this.motionLamp = scene.add.circle(604, 557, 11, 0x7658a1, 0.3).setStrokeStyle(3, 0xb694e1, 0.75);
    this.motionValue = scene.add.text(635, 547, '', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: '#eadcff',
    }).setOrigin(0, 0.5);
    const motionHint = scene.add.text(635, 570, 'Cuts decorative shakes and transition movement.', {
      fontSize: '10px', color: '#928b9d', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const motionToggle = this.makeButton(1010, 557, 'FLIP SWITCH', 148, () => {
      this.draft = { ...this.draft, reducedMotion: !this.draft.reducedMotion };
      this.render();
    }, 0x312a3b, 0x8e6fad);

    const footerLine = scene.add.rectangle(800, 616, 610, 2, 0x6b6166, 0.38);
    const apply = this.makeButton(706, 666, 'SAVE MIX', 210, () => this.applyAndClose(), 0x314421, 0xb5ff4d, true);
    const cancel = this.makeButton(930, 666, 'CLOSE', 170, () => this.hide(), 0x292c38, 0x777381);

    const fasteners: Phaser.GameObjects.Arc[] = [];
    for (const [x, y] of [[449, 181], [1151, 181], [449, 719], [1151, 719]] as const) {
      fasteners.push(scene.add.circle(x, y, 5, 0x555b63, 1).setStrokeStyle(1, 0xc0c5ca, 0.62));
    }

    this.panel.add([
      shadow, shell, inset, wear, headerShadow, header, headerWear, icon, title, subtitle,
      ...musicRail, ...sfxRail, this.musicValue, this.sfxValue, this.meter,
      ...musicMinus, ...musicPlus, ...sfxMinus, ...sfxPlus,
      motionShell, motionTape, motionLabel, this.motionLamp, this.motionValue, motionHint,
      ...motionToggle, footerLine, ...apply, ...cancel, ...fasteners,
    ]);
    this.root.add([blocker, this.panel]);

    const onEscape = (): void => { if (this.isVisible()) this.hide(); };
    scene.input.keyboard?.on('keydown-ESC', onEscape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', onEscape));
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  show(): void {
    if (this.isVisible()) return;
    this.draft = normalizeSettingsDraft(this.options.getSettings());
    this.render();
    this.root.setVisible(true).setAlpha(1);
    this.panel.setScale(1);
    if (!this.draft.reducedMotion) {
      this.root.setAlpha(0);
      this.panel.setScale(0.98);
      this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 150, ease: 'Quad.Out' });
      this.scene.tweens.add({ targets: this.panel, scaleX: 1, scaleY: 1, duration: 170, ease: 'Back.Out' });
    }
  }

  hide(): void {
    if (!this.isVisible()) return;
    this.scene.tweens.killTweensOf([this.root, this.panel]);
    this.root.setAlpha(1).setVisible(false);
    this.panel.setScale(1);
  }

  private applyAndClose(): void {
    const next = normalizeSettingsDraft(this.draft);
    this.hide();
    this.options.onApply({
      musicVolume: next.musicVolume,
      sfxVolume: next.sfxVolume,
      reducedMotion: next.reducedMotion,
    });
  }

  private render(): void {
    const music = volumePercent(this.draft.musicVolume);
    const sfx = volumePercent(this.draft.sfxVolume);
    this.musicValue.setText(`${music}%`);
    this.sfxValue.setText(`${sfx}%`);
    this.motionValue.setText(this.draft.reducedMotion ? 'REDUCED MOTION // ON' : 'FULL MOTION // ON');
    this.motionLamp
      .setFillStyle(this.draft.reducedMotion ? 0xb5ff4d : 0x7658a1, this.draft.reducedMotion ? 0.92 : 0.34)
      .setStrokeStyle(3, this.draft.reducedMotion ? 0xe5ffba : 0xb694e1, 0.8);
    this.meter.clear();
    this.drawMeter(596, 368, 408, music / 100, 0x79cfff);
    this.drawMeter(596, 468, 408, sfx / 100, 0xffc66d);
  }

  private drawChannelShell(
    x: number,
    y: number,
    title: string,
    subtitle: string,
    accent: number,
  ): readonly Phaser.GameObjects.GameObject[] {
    const shell = this.scene.add.rectangle(x, y, 570, 82, 0x171a21, 1).setStrokeStyle(3, accent, 0.55);
    const lip = this.scene.add.rectangle(x, y - 39, 556, 4, accent, 0.32);
    const titleText = this.scene.add.text(x - 204, y - 22, title, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '13px', color: '#f1edf3',
    }).setOrigin(0, 0.5);
    const subtitleText = this.scene.add.text(x - 204, y - 2, subtitle, {
      fontSize: '9px', color: '#838894', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0, 0.5);
    return [shell, lip, titleText, subtitleText];
  }

  private drawMeter(x: number, y: number, width: number, ratio: number, color: number): void {
    const segments = 12;
    const gap = 5;
    const segmentWidth = (width - gap * (segments - 1)) / segments;
    const active = Math.round(Math.max(0, Math.min(1, ratio)) * segments);
    for (let index = 0; index < segments; index += 1) {
      const left = x + index * (segmentWidth + gap);
      this.meter.fillStyle(index < active ? color : 0x2c3038, index < active ? 0.96 : 1);
      this.meter.fillRoundedRect(left, y, segmentWidth, 12, 2);
      this.meter.lineStyle(1, index < active ? color : 0x4a4f59, index < active ? 0.55 : 0.72);
      this.meter.strokeRoundedRect(left, y, segmentWidth, 12, 2);
    }
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    width: number,
    onClick: () => void,
    fill = 0x292c38,
    stroke = 0x777381,
    primary = false,
  ): readonly [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text] {
    const shadow = this.scene.add.rectangle(x + 3, y + 4, width, 42, 0x030405, 0.65);
    const rect = this.scene.add.rectangle(x, y, width, 42, fill, 1)
      .setStrokeStyle(primary ? 3 : 2, stroke).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: primary ? '13px' : '12px', color: primary ? '#f2ffe5' : '#f4eff8',
      fontStyle: 'bold', stroke: '#0b0c10', strokeThickness: primary ? 3 : 2,
    }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(primary ? 0x425b2f : fill + 0x080808).setStrokeStyle(3, stroke));
    rect.on('pointerout', () => rect.setFillStyle(fill).setStrokeStyle(primary ? 3 : 2, stroke));
    rect.on('pointerdown', () => { rect.setScale(0.97); text.setScale(0.97); shadow.setScale(0.97); });
    const restore = (): void => { rect.setScale(1); text.setScale(1); shadow.setScale(1); };
    rect.on('pointerupoutside', restore);
    rect.on('pointerup', () => { restore(); onClick(); });
    // Keep the helper tuple shape stable for callers while the shadow remains part of the owning panel.
    this.panel?.add?.(shadow);
    return [rect, text];
  }
}
