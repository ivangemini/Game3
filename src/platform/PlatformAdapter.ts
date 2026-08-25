export type AdResult = 'rewarded' | 'dismissed' | 'unavailable' | 'failed';
export type InterstitialResult = 'shown' | 'unavailable' | 'failed';

export interface PlatformLifecycleHooks {
  readonly onPauseRequested?: (reason: 'ad' | 'platform') => void;
  readonly onResumeRequested?: (reason: 'ad' | 'platform') => void;
}

export interface PlatformAdapter {
  readonly id: string;
  init(): Promise<void>;
  ready(): Promise<void>;
  getLocale(): string;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<InterstitialResult>;
  showRewarded(): Promise<AdResult>;
  destroy(): void;
}

export class LocalPlatformAdapter implements PlatformAdapter {
  readonly id = 'local';

  constructor(private readonly hooks: PlatformLifecycleHooks = {}) {}

  async init(): Promise<void> {}
  async ready(): Promise<void> {}
  getLocale(): string {
    return typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';
  }
  gameplayStart(): void {}
  gameplayStop(): void {}
  async showInterstitial(): Promise<InterstitialResult> { return 'unavailable'; }
  async showRewarded(): Promise<AdResult> { return 'unavailable'; }
  destroy(): void {
    void this.hooks;
  }
}
