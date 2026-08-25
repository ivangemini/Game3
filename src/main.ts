import * as Phaser from 'phaser';
import { GameAudio } from './game/audio/GameAudio';
import { gameConfig } from './game/config';
import { SAVE_NOTICE_EVENT, type SaveNoticeDetail } from './persistence/save';
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

const saveNotice = document.createElement('div');
saveNotice.id = 'save-notice';
saveNotice.setAttribute('role', 'status');
saveNotice.setAttribute('aria-live', 'polite');
saveNotice.hidden = true;
document.body.append(saveNotice);
let saveNoticeTimer: number | null = null;

const showSaveNotice = (kind: SaveNoticeDetail['kind']): void => {
  if (saveNoticeTimer !== null) window.clearTimeout(saveNoticeTimer);
  const copy = kind === 'recovered-backup'
    ? ['SAVE RECOVERED', 'The latest slot was damaged. Your previous valid run was restored automatically.']
    : kind === 'write-failed'
      ? ['SAVE WARNING', 'This browser refused the latest save write. Keep this tab open and check storage permissions.']
      : ['SAVE RESET', 'Stored data was unreadable and no valid backup existed. A safe new save was started.'];
  saveNotice.dataset.kind = kind;
  saveNotice.innerHTML = `<strong>${copy[0]}</strong><span>${copy[1]}</span>`;
  saveNotice.hidden = false;
  requestAnimationFrame(() => saveNotice.classList.add('is-visible'));
  saveNoticeTimer = window.setTimeout(() => {
    saveNotice.classList.remove('is-visible');
    window.setTimeout(() => { saveNotice.hidden = true; }, 180);
    saveNoticeTimer = null;
  }, kind === 'write-failed' ? 7000 : 5200);
};

const handleSaveNotice = (event: Event): void => {
  const detail = (event as CustomEvent<SaveNoticeDetail>).detail;
  if (detail?.kind) showSaveNotice(detail.kind);
};
window.addEventListener(SAVE_NOTICE_EVENT, handleSaveNotice);

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

  const activePlatform = platform;
  const runtimeConfig: Phaser.Types.Core.GameConfig = {
    ...gameConfig,
    callbacks: {
      ...gameConfig.callbacks,
      preBoot: (bootGame) => {
        gameConfig.callbacks?.preBoot?.(bootGame);
        bootGame.registry.set(PLATFORM_REGISTRY_KEY, activePlatform);
      },
    },
  };
  game = new Phaser.Game(runtimeConfig);

  try {
    await activePlatform.ready();
  } catch (error) {
    console.warn(`[platform] ${activePlatform.id} ready signal failed.`, error);
  }
}

void bootstrap();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    window.removeEventListener('resize', syncViewportProfile);
    window.removeEventListener('orientationchange', syncViewportProfile);
    window.removeEventListener(SAVE_NOTICE_EVENT, handleSaveNotice);
    if (saveNoticeTimer !== null) window.clearTimeout(saveNoticeTimer);
    saveNotice.remove();
    orientationGate.remove();
    platform?.destroy();
    platform = null;
    game?.destroy(true);
    game = null;
  });
}
