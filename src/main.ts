import * as Phaser from 'phaser';
import { gameConfig } from './game/config';
import { applyViewportProfile, classifyViewport } from './platform/viewport';
import './styles.css';

const orientationGate = document.createElement('div');
orientationGate.id = 'orientation-gate';
orientationGate.setAttribute('role', 'status');
orientationGate.setAttribute('aria-live', 'polite');
orientationGate.innerHTML = `
  <div class="orientation-card">
    <div class="orientation-mark" aria-hidden="true">↻</div>
    <strong>ROTATE THE JUNK</strong>
    <span>Junkpack is designed for landscape play. Rotate your device to keep the backpack and boss telegraphs readable.</span>
  </div>
`;
document.body.append(orientationGate);

const syncViewportProfile = (): void => {
  applyViewportProfile(document.documentElement, classifyViewport(window.innerWidth, window.innerHeight));
};

syncViewportProfile();
window.addEventListener('resize', syncViewportProfile, { passive: true });
window.addEventListener('orientationchange', syncViewportProfile);

const game = new Phaser.Game(gameConfig);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('resize', syncViewportProfile);
    window.removeEventListener('orientationchange', syncViewportProfile);
    orientationGate.remove();
    game.destroy(true);
  });
}
