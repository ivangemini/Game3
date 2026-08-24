import * as Phaser from 'phaser';
import { PrototypeScene } from './scenes/PrototypeScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1600,
  height: 900,
  backgroundColor: '#0b0d13',
  scene: [PrototypeScene],
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
