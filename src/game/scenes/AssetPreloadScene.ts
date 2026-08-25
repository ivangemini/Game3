import * as Phaser from 'phaser';
import { RUNTIME_ATLASES } from '../assets/atlasContract';

export class AssetPreloadScene extends Phaser.Scene {
  constructor() {
    super('asset-preload');
  }

  preload(): void {
    for (const atlas of RUNTIME_ATLASES) {
      if (this.textures.exists(atlas.textureKey)) continue;
      this.load.atlas(atlas.textureKey, atlas.imageUrl, atlas.dataUrl);
    }
  }

  create(): void {
    this.scene.start('prototype');
  }
}
