import * as Phaser from 'phaser';
import type { PlatformAdapter } from '../../platform/PlatformAdapter';
import { RUNTIME_ATLASES } from '../assets/atlasContract';

const PLATFORM_REGISTRY_KEY = 'junkpack.platform-adapter';

export class AssetPreloadScene extends Phaser.Scene {
  private progressFill?: Phaser.GameObjects.Rectangle;
  private progressText?: Phaser.GameObjects.Text;
  private fileText?: Phaser.GameObjects.Text;
  private errorCount = 0;

  constructor() {
    super('asset-preload');
  }

  preload(): void {
    this.drawLoadingShell();
    this.load.on('progress', this.handleProgress, this);
    this.load.on('fileprogress', this.handleFileProgress, this);
    this.load.on('loaderror', this.handleLoadError, this);
    this.load.once('complete', () => {
      this.progressFill?.setScale(1, 1);
      this.progressText?.setText(this.errorCount > 0 ? 'CORE READY • FALLBACK ART ARMED' : 'CORE READY • OPENING THE BAG');
      this.fileText?.setText(this.errorCount > 0 ? `${this.errorCount} ASSET ERROR${this.errorCount === 1 ? '' : 'S'} • SAFE FALLBACKS ACTIVE` : 'ATLASES PACKED • REALITY UNSTABLE');
    });

    for (const atlas of RUNTIME_ATLASES) {
      if (this.textures.exists(atlas.textureKey)) continue;
      this.load.atlas(atlas.textureKey, atlas.imageUrl, atlas.dataUrl);
    }
  }

  create(): void {
    this.load.off('progress', this.handleProgress, this);
    this.load.off('fileprogress', this.handleFileProgress, this);
    this.load.off('loaderror', this.handleLoadError, this);
    void this.finishBoot();
  }

  private drawLoadingShell(): void {
    this.cameras.main.setBackgroundColor(0x0b0d13);
    const cx = 800;
    const cy = 450;

    this.add.circle(1260, 155, 330, 0x683ea6, 0.12);
    this.add.circle(330, 760, 290, 0x4f9156, 0.09);
    this.add.rectangle(cx + 8, cy + 8, 700, 330, 0x030407, 0.55);
    this.add.rectangle(cx, cy, 700, 330, 0x12151e, 1).setStrokeStyle(4, 0x655573, 0.88);
    this.add.rectangle(cx, cy, 674, 304, 0x181b25, 0.75).setStrokeStyle(1, 0x9885aa, 0.18);

    const tape = this.add.rectangle(cx, cy - 112, 360, 48, 0x5a3b2e, 1).setStrokeStyle(3, 0xc28c5e).setAngle(-1.2);
    this.add.text(cx, cy - 113, 'JUNKPACK', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '34px', color: '#ffd56e', stroke: '#261611', strokeThickness: 7,
    }).setOrigin(0.5).setAngle(-1.2);
    tape.setDepth(-1);

    this.add.text(cx, cy - 58, 'BOSS RUSH // FIELD BAG INITIALIZATION', {
      fontSize: '12px', color: '#c8bdcf', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5);

    this.add.rectangle(cx, cy + 19, 536, 34, 0x080a0f, 1).setStrokeStyle(3, 0x383c48);
    this.add.rectangle(cx, cy + 19, 520, 18, 0x1f2530, 1);
    this.progressFill = this.add.rectangle(cx - 260, cy + 19, 520, 18, 0xb5ff4d, 1)
      .setOrigin(0, 0.5)
      .setScale(0, 1);

    this.progressText = this.add.text(cx, cy + 58, 'SORTING CURSED JUNK • 0%', {
      fontSize: '14px', color: '#dfffc0', fontStyle: 'bold', stroke: '#080a0d', strokeThickness: 4,
    }).setOrigin(0.5);
    this.fileText = this.add.text(cx, cy + 92, 'CHECKING ATLAS TAPES…', {
      fontSize: '10px', color: '#9296a3', fontStyle: 'bold', wordWrap: { width: 560 }, align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 135, 'TIP • SIDE CONTACTS CREATE SYNERGIES. EMPTY SPACE IS A RESOURCE.', {
      fontSize: '10px', color: '#b798cc', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private readonly handleProgress = (progress: number): void => {
    const safe = Math.max(0, Math.min(1, progress));
    this.progressFill?.setScale(safe, 1);
    this.progressText?.setText(`SORTING CURSED JUNK • ${Math.round(safe * 100)}%`);
  };

  private readonly handleFileProgress = (file: Phaser.Loader.File): void => {
    const key = typeof file.key === 'string' ? file.key : 'runtime asset';
    this.fileText?.setText(`LOADING • ${key.toUpperCase()}`);
  };

  private readonly handleLoadError = (): void => {
    this.errorCount += 1;
    this.fileText?.setText(`ASSET ERROR ×${this.errorCount} • PROCEDURAL FALLBACK WILL COVER MISSING ART`);
  };

  private async finishBoot(): Promise<void> {
    const platform = this.registry.get(PLATFORM_REGISTRY_KEY) as PlatformAdapter | undefined;
    try {
      await platform?.ready();
    } catch (error) {
      console.warn(`[platform] ${platform?.id ?? 'unknown'} ready signal failed; continuing.`, error);
    }
    this.scene.launch('runtime-presentation');
    this.scene.launch('runtime-surface-polish');
    this.scene.launch('runtime-flow-polish');
    this.scene.start('prototype');
  }
}
