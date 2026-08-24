export type AdResult = 'rewarded' | 'dismissed' | 'unavailable' | 'failed';

export interface PlatformAdapter {
  readonly id: string;
  init(): Promise<void>;
  getLocale(): string;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<'shown' | 'unavailable' | 'failed'>;
  showRewarded(): Promise<AdResult>;
}

export class LocalPlatformAdapter implements PlatformAdapter {
  readonly id = 'local';

  async init(): Promise<void> {}
  getLocale(): string { return navigator.language || 'en'; }
  gameplayStart(): void {}
  gameplayStop(): void {}
  async showInterstitial(): Promise<'shown' | 'unavailable' | 'failed'> { return 'unavailable'; }
  async showRewarded(): Promise<AdResult> { return 'unavailable'; }
}
