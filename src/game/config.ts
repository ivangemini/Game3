import * as Phaser from 'phaser';
import { AssetPreloadScene } from './scenes/AssetPreloadScene';
import { PrototypeScene } from './scenes/PrototypeScene';
import { RuntimeArchivePolishScene } from './scenes/RuntimeArchivePolishScene';
import { RuntimeFlowPolishScene } from './scenes/RuntimeFlowPolishScene';
import { RuntimeHudLegibilityScene } from './scenes/RuntimeHudLegibilityScene';
import { RuntimePresentationScene } from './scenes/RuntimePresentationScene';
import { RuntimeSurfacePolishScene } from './scenes/RuntimeSurfacePolishScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1600,
  height: 900,
  backgroundColor: '#0b0d13',
  scene: [
    AssetPreloadScene,
    PrototypeScene,
    RuntimePresentationScene,
    RuntimeSurfacePolishScene,
    RuntimeHudLegibilityScene,
    RuntimeFlowPolishScene,
    RuntimeArchivePolishScene,
  ],
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
