import type {
  AdResult,
  InterstitialResult,
  PlatformAdapter,
  PlatformLifecycleHooks,
} from './PlatformAdapter';

interface CrazyGamesSdk {
  init(): Promise<void>;
  readonly game: {
    gameplayStart(): void;
    gameplayStop(): void;
    loadingStart?(): void;
    loadingStop?(): void;
  };
  readonly ad: {
    requestAd(
      kind: 'midgame' | 'rewarded',
      callbacks?: {
        adStarted?: () => void;
        adError?: (error: unknown) => void;
        adFinished?: () => void;
      },
    ): void;
  };
}

declare global {
  interface Window {
    CrazyGames?: { readonly SDK: CrazyGamesSdk };
  }
}

const CRAZY_SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

export interface CrazyGamesPlatformAdapterOptions {
  readonly hooks?: PlatformLifecycleHooks;
  readonly loadScript?: (url: string) => Promise<void>;
}

export class CrazyGamesPlatformAdapter implements PlatformAdapter {
  readonly id = 'crazygames';
  private initialized = false;
  private loadingStarted = false;
  private readonly hooks: PlatformLifecycleHooks;
  private readonly loadScript: (url: string) => Promise<void>;

  constructor(options: CrazyGamesPlatformAdapterOptions = {}) {
    this.hooks = options.hooks ?? {};
    this.loadScript = options.loadScript ?? loadExternalScript;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (!window.CrazyGames?.SDK) await this.loadScript(CRAZY_SDK_URL);
    if (!window.CrazyGames?.SDK) throw new Error('CrazyGames SDK loaded without CrazyGames.SDK global.');
    await window.CrazyGames.SDK.init();
    this.initialized = true;
    window.CrazyGames.SDK.game.loadingStart?.();
    this.loadingStarted = true;
  }

  async ready(): Promise<void> {
    await this.ensureInitialized();
    if (!this.loadingStarted) return;
    window.CrazyGames?.SDK.game.loadingStop?.();
    this.loadingStarted = false;
  }

  getLocale(): string {
    return typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';
  }

  gameplayStart(): void {
    window.CrazyGames?.SDK.game.gameplayStart();
  }

  gameplayStop(): void {
    window.CrazyGames?.SDK.game.gameplayStop();
  }

  async showInterstitial(): Promise<InterstitialResult> {
    const result = await this.requestAd('midgame');
    if (result === 'failed') return 'failed';
    return result === 'rewarded' ? 'shown' : 'unavailable';
  }

  async showRewarded(): Promise<AdResult> {
    return this.requestAd('rewarded');
  }

  destroy(): void {
    this.initialized = false;
    this.loadingStarted = false;
  }

  private async requestAd(kind: 'midgame' | 'rewarded'): Promise<AdResult> {
    await this.ensureInitialized();
    const sdk = window.CrazyGames?.SDK;
    if (!sdk) return 'unavailable';

    return new Promise<AdResult>((resolve) => {
      let started = false;
      let settled = false;
      const finish = (result: AdResult): void => {
        if (settled) return;
        settled = true;
        if (started) this.hooks.onResumeRequested?.('ad');
        resolve(result);
      };

      sdk.ad.requestAd(kind, {
        adStarted: () => {
          started = true;
          this.hooks.onPauseRequested?.('ad');
        },
        adError: () => finish('failed'),
        adFinished: () => finish(started ? 'rewarded' : 'unavailable'),
      });
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.init();
  }
}

function loadExternalScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-platform-sdk="crazygames"][src="${url}"]`);
    if (existing) {
      if (window.CrazyGames?.SDK) return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.dataset.platformSdk = 'crazygames';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)), { once: true });
    document.head.append(script);
  });
}
