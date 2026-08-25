import * as Phaser from 'phaser';
import type { SaveSettings } from '../../persistence/save';
import { normalizeSettingsDraft, stepVolume, volumePercent, type SettingsDraft } from './settingsModel';

export interface SettingsOverlayOptions {
  readonly getSettings: () => SaveSettings;
  readonly onApply: (settings: SaveSettings) => void;
}

export class SettingsOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly musicValue: Phaser.GameObjects.Text;
  private readonly sfxValue: Phaser.GameObjects.Text;
  private readonly motionValue: Phaser.GameObjects.Text;
  private readonly meter: Phaser.GameObjects.Graphics;
  private draft: SettingsDraft = { musicVolume: 0.8, sfxVolume: 0.9, reducedMotion: false };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: SettingsOverlayOptions,
  ) {
    this.root = scene.add.container(0, 0).setDepth(970).setVisible(false);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x07080d, 0.82).setInteractive();
    this.panel = scene.add.container(0, 0);
    const card = scene.add.rectangle(800, 450, 650, 500, 0x171a24, 1).setStrokeStyle(4, 0x6f6a7b);
    const title = scene.add.text(800, 245, 'SETTINGS', {
      fontSize: '34px', color: '#f7f2e8', fontStyle: 'bold',
    }).setOrigin(0.5);
    const subtitle = scene.add.text(800, 286, 'Audio is live. Reduced Motion applies after the presentation scene refreshes.', {
      fontSize: '12px', color: '#aaa5b2',
    }).setOrigin(0.5);

    this.musicValue = scene.add.text(800, 354, '', { fontSize: '18px', color: '#d9f0ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.sfxValue = scene.add.text(800, 444, '', { fontSize: '18px', color: '#ffe3b0', fontStyle: 'bold' }).setOrigin(0.5);
    this.motionValue = scene.add.text(800, 542, '', { fontSize: '17px', color: '#e4d4ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.meter = scene.add.graphics();

    const musicMinus = this.makeButton(600, 354, '−', 54, () => { this.draft = { ...this.draft, musicVolume: stepVolume(this.draft.musicVolume, -1) }; this.render(); });
    const musicPlus = this.makeButton(1000, 354, '+', 54, () => { this.draft = { ...this.draft, musicVolume: stepVolume(this.draft.musicVolume, 1) }; this.render(); });
    const sfxMinus = this.makeButton(600, 444, '−', 54, () => { this.draft = { ...this.draft, sfxVolume: stepVolume(this.draft.sfxVolume, -1) }; this.render(); });
    const sfxPlus = this.makeButton(1000, 444, '+', 54, () => { this.draft = { ...this.draft, sfxVolume: stepVolume(this.draft.sfxVolume, 1) }; this.render(); });
    const motionToggle = this.makeButton(800, 578, 'TOGGLE REDUCED MOTION', 280, () => {
      this.draft = { ...this.draft, reducedMotion: !this.draft.reducedMotion };
      this.render();
    });
    const apply = this.makeButton(715, 645, 'APPLY', 150, () => this.applyAndClose(), 0x314421, 0xb5ff4d);
    const cancel = this.makeButton(885, 645, 'CANCEL', 150, () => this.hide());

    this.panel.add([
      card, title, subtitle,
      this.musicValue, this.sfxValue, this.motionValue, this.meter,
      ...musicMinus, ...musicPlus, ...sfxMinus, ...sfxPlus, ...motionToggle, ...apply, ...cancel,
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
    this.musicValue.setText(`MUSIC  ${music}%`);
    this.sfxValue.setText(`SFX  ${sfx}%`);
    this.motionValue.setText(`REDUCED MOTION  •  ${this.draft.reducedMotion ? 'ON' : 'OFF'}`);
    this.meter.clear();
    this.drawMeter(680, 383, 240, music / 100, 0x79cfff);
    this.drawMeter(680, 473, 240, sfx / 100, 0xffc66d);
  }

  private drawMeter(x: number, y: number, width: number, ratio: number, color: number): void {
    this.meter.fillStyle(0x2a2d38, 1).fillRoundedRect(x, y, width, 10, 5);
    this.meter.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(2, width * ratio), 10, 5);
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    width: number,
    onClick: () => void,
    fill = 0x292c38,
    stroke = 0x777381,
  ): readonly [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text] {
    const rect = this.scene.add.rectangle(x, y, width, 38, fill, 1)
      .setStrokeStyle(2, stroke).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { fontSize: '12px', color: '#f4eff8', fontStyle: 'bold' }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setAlpha(0.82));
    rect.on('pointerout', () => rect.setAlpha(1));
    rect.on('pointerdown', () => { rect.setScale(0.97); text.setScale(0.97); });
    rect.on('pointerup', () => { rect.setScale(1); text.setScale(1); onClick(); });
    return [rect, text];
  }
}
