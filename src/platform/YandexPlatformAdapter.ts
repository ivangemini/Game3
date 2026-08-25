import type {
  AdResult,
  InterstitialResult,
  PlatformAdapter,
  PlatformLifecycleHooks,
} from './PlatformAdapter';

interface YandexGameplayApi {
  start(): void;
  stop(): void;
}

interface YandexSdk {
  readonly environment?: { readonly i18n?: { readonly lang?: string } };
  readonly features?: {
    readonly LoadingAPI?: { ready(): void | Promise<void> };
    readonly GameplayAPI?: YandexGameplayApi;
  };
  readonly adv: {
    showFullscreenAdv(options?: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: object) => void;
      };
    }): void;
    showRewardedVideo(options?: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: object) => void;
      };
    }): void;
  };
}

interface YandexLoader {
  init(): Promise<YandexSdk>;
}

declare global {
  interface Window {
    YaGames?: YandexLoader;
  }
}

const YANDEX_SDK_RELATIVE_URL = '/sdk.js';
const YANDEX_SDK_ABSOLUTE_URL = 'https://sdk.games.s3.yandex.net/sdk.js';

export interface YandexPlatformAdapterOptions {
  readonly hooks?: PlatformLifecycleHooks;
  readonly sdkUrl?: string;
  readonly hostedByYandex?: boolean;
  readonly loadScript?: (url: string) => Promise<void>;
}

export class YandexPlatformAdapter implements PlatformAdapter {
  readonly id = 'yandex';
  private sdk: YandexSdk | null = null;
  private readonly hooks: PlatformLifecycleHooks;
  private readonly sdkUrl: string;
  private readonly loadScript: (url: string) => Promise<void>;

  constructor(options: YandexPlatformAdapterOptions = {}) {
    this.hooks = options.hooks ?? {};
    this.sdkUrl = options.sdkUrl
      ?? (options.hostedByYandex === false ? YANDEX_SDK_ABSOLUTE_URL : YANDEX_SDK_RELATIVE_URL);
    this.loadScript = options.loadScript ?? loadExternalScript;
  }

  async init(): Promise<void> {
    if (this.sdk) return;
    if (!window.YaGames) await this.loadScript(this.sdkUrl);
    if (!window.YaGames) throw new Error('Yandex Games SDK loaded without YaGames global.');
    this.sdk = await window.YaGames.init();
  }

  async ready(): Promise<void> {
    await this.ensureInitialized();
    await this.sdk?.features?.LoadingAPI?.ready();
  }

  getLocale(): string {
    return this.sdk?.environment?.i18n?.lang
      ?? (typeof navigator === 'undefined' ? 'en' : navigator.language || 'en');
  }

  gameplayStart(): void {
    this.sdk?.features?.GameplayAPI?.start();
  }

  gameplayStop(): void {
    this.sdk?.features?.GameplayAPI?.stop();
  }

  async showInterstitial(): Promise<InterstitialResult> {
    await this.ensureInitialized();
    const sdk = this.sdk;
    if (!sdk) return 'unavailable';

    return new Promise<InterstitialResult>((resolve) => {
      let settled = false;
      const finish = (result: InterstitialResult): void => {
        if (settled) return;
        settled = true;
        this.hooks.onResumeRequested?.('ad');
        resolve(result);
      };
      sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => this.hooks.onPauseRequested?.('ad'),
          onClose: (wasShown) => finish(wasShown ? 'shown' : 'unavailable'),
          onError: () => finish('failed'),
        },
      });
    });
  }

  async showRewarded(): Promise<AdResult> {
    await this.ensureInitialized();
    const sdk = this.sdk;
    if (!sdk) return 'unavailable';

    return new Promise<AdResult>((resolve) => {
      let rewarded = false;
      let settled = false;
      const finish = (result: AdResult): void => {
        if (settled) return;
        settled = true;
        this.hooks.onResumeRequested?.('ad');
        resolve(result);
      };
      sdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => this.hooks.onPauseRequested?.('ad'),
          onRewarded: () => { rewarded = true; },
          onClose: (wasShown) => {
            if (!wasShown) return finish('unavailable');
            finish(rewarded ? 'rewarded' : 'dismissed');
          },
          onError: () => finish('failed'),
        },
      });
    });
  }

  destroy(): void {
    this.sdk = null;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.sdk) await this.init();
  }
}

function loadExternalScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-platform-sdk="yandex"][src="${url}"]`);
    if (existing) {
      if (window.YaGames) return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.dataset.platformSdk = 'yandex';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)), { once: true });
    document.head.append(script);
  });
}
