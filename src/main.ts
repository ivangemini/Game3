import * as Phaser from 'phaser';
import { GameAudio } from './game/audio/GameAudio';
import { gameConfig } from './game/config';
import { LocalPlatformAdapter, type PlatformAdapter } from './platform/PlatformAdapter';
import { createPlatformAdapter } from './platform/platformFactory';
import { applyViewportProfile, classifyViewport } from './platform/viewport';
import './styles.css';

const PLATFORM_REGISTRY_KEY = 'junkpack.platform-adapter';
const AUDIO_REGISTRY_KEY = 'junkpack.game-audio';

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

let game: Phaser.Game | null = null;
let platform: PlatformAdapter | null = null;
let disposed = false;

const runtimeAudio = (): GameAudio | undefined => game?.registry.get(AUDIO_REGISTRY_KEY) as GameAudio | undefined;

const pauseForPlatform = (): void => {
  runtimeAudio()?.suspendForPlatform();
  game?.loop.sleep();
};

const resumeForPlatform = (): void => {
  if (disposed) return;
  game?.loop.wake();
  runtimeAudio()?.resumeFromPlatform();
};

async function bootstrap(): Promise<void> {
  const requestedPlatform = createPlatformAdapter({
    onPauseRequested: pauseForPlatform,
    onResumeRequested: resumeForPlatform,
  });

  try {
    await requestedPlatform.init();
    platform = requestedPlatform;
  } catch (error) {
    console.warn(`[platform] ${requestedPlatform.id} initialization failed; continuing with local adapter.`, error);
    requestedPlatform.destroy();
    platform = new LocalPlatformAdapter({
      onPauseRequested: pauseForPlatform,
      onResumeRequested: resumeForPlatform,
    });
    await platform.init();
  }

  if (disposed) {
    platform.destroy();
    platform = null;
    return;
  }

  game = new Phaser.Game(gameConfig);
  game.registry.set(PLATFORM_REGISTRY_KEY, platform);

  try {
    await platform.ready();
  } catch (error) {
    console.warn(`[platform] ${platform.id} ready signal failed.`, error);
  }
}

void bootstrap();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    window.removeEventListener('resize', syncViewportProfile);
    window.removeEventListener('orientationchange', syncViewportProfile);
    orientationGate.remove();
    platform?.destroy();
    platform = null;
    game?.destroy(true);
    game = null;
  });
}
