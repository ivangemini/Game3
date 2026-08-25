import { afterEach, describe, expect, it } from 'vitest';
import { CrazyGamesPlatformAdapter } from '../src/platform/CrazyGamesPlatformAdapter';
import { YandexPlatformAdapter } from '../src/platform/YandexPlatformAdapter';

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
});

async function flushAsyncRegistration(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('YandexPlatformAdapter', () => {
  it('marks loading ready and gameplay through the SDK feature APIs', async () => {
    const calls: string[] = [];
    const sdk = {
      environment: { i18n: { lang: 'ru' } },
      features: {
        LoadingAPI: { ready: () => { calls.push('ready'); } },
        GameplayAPI: {
          start: () => { calls.push('start'); },
          stop: () => { calls.push('stop'); },
        },
      },
      adv: { showFullscreenAdv: () => {}, showRewardedVideo: () => {} },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { YaGames: { init: async () => sdk } }, configurable: true, writable: true,
    });

    const adapter = new YandexPlatformAdapter({ loadScript: async () => {} });
    await adapter.init();
    await adapter.ready();
    adapter.gameplayStart();
    adapter.gameplayStop();

    expect(adapter.getLocale()).toBe('ru');
    expect(calls).toEqual(['ready', 'start', 'stop']);
  });

  it('only grants a rewarded result after onRewarded fires', async () => {
    const lifecycle: string[] = [];
    let callbacks: {
      onOpen?: () => void;
      onRewarded?: () => void;
      onClose?: (shown: boolean) => void;
      onError?: () => void;
    } | undefined;
    const sdk = {
      features: {},
      adv: {
        showFullscreenAdv: () => {},
        showRewardedVideo: (options?: { callbacks?: typeof callbacks }) => { callbacks = options?.callbacks; },
      },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { YaGames: { init: async () => sdk } }, configurable: true, writable: true,
    });

    const adapter = new YandexPlatformAdapter({
      loadScript: async () => {},
      hooks: {
        onPauseRequested: () => lifecycle.push('pause'),
        onResumeRequested: () => lifecycle.push('resume'),
      },
    });
    await adapter.init();
    const rewarded = adapter.showRewarded();
    await flushAsyncRegistration();
    expect(callbacks).toBeDefined();
    callbacks?.onOpen?.();
    callbacks?.onRewarded?.();
    callbacks?.onClose?.(true);

    await expect(rewarded).resolves.toBe('rewarded');
    expect(lifecycle).toEqual(['pause', 'resume']);
  });

  it('does not grant a reward when a shown video closes without onRewarded', async () => {
    let callbacks: {
      onOpen?: () => void;
      onRewarded?: () => void;
      onClose?: (shown: boolean) => void;
      onError?: () => void;
    } | undefined;
    const sdk = {
      features: {},
      adv: {
        showFullscreenAdv: () => {},
        showRewardedVideo: (options?: { callbacks?: typeof callbacks }) => { callbacks = options?.callbacks; },
      },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { YaGames: { init: async () => sdk } }, configurable: true, writable: true,
    });

    const adapter = new YandexPlatformAdapter({ loadScript: async () => {} });
    await adapter.init();
    const rewarded = adapter.showRewarded();
    await flushAsyncRegistration();
    callbacks?.onOpen?.();
    callbacks?.onClose?.(true);
    await expect(rewarded).resolves.toBe('dismissed');
  });
});

describe('CrazyGamesPlatformAdapter', () => {
  it('initializes before loading markup and closes loading on ready', async () => {
    const calls: string[] = [];
    const sdk = {
      init: async () => { calls.push('init'); },
      game: {
        loadingStart: () => { calls.push('loading-start'); },
        loadingStop: () => { calls.push('loading-stop'); },
        gameplayStart: () => { calls.push('gameplay-start'); },
        gameplayStop: () => { calls.push('gameplay-stop'); },
      },
      ad: { requestAd: () => {} },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { CrazyGames: { SDK: sdk } }, configurable: true, writable: true,
    });

    const adapter = new CrazyGamesPlatformAdapter({ loadScript: async () => {} });
    await adapter.init();
    await adapter.ready();
    adapter.gameplayStart();
    adapter.gameplayStop();

    expect(calls).toEqual(['init', 'loading-start', 'loading-stop', 'gameplay-start', 'gameplay-stop']);
  });

  it('pauses on adStarted and rewards only on adFinished', async () => {
    const lifecycle: string[] = [];
    let callbacks: {
      adStarted?: () => void;
      adError?: (error: unknown) => void;
      adFinished?: () => void;
    } | undefined;
    const sdk = {
      init: async () => {},
      game: { gameplayStart: () => {}, gameplayStop: () => {} },
      ad: { requestAd: (_kind: string, value?: typeof callbacks) => { callbacks = value; } },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { CrazyGames: { SDK: sdk } }, configurable: true, writable: true,
    });

    const adapter = new CrazyGamesPlatformAdapter({
      loadScript: async () => {},
      hooks: {
        onPauseRequested: () => lifecycle.push('pause'),
        onResumeRequested: () => lifecycle.push('resume'),
      },
    });
    await adapter.init();
    const rewarded = adapter.showRewarded();
    await flushAsyncRegistration();
    expect(callbacks).toBeDefined();
    callbacks?.adStarted?.();
    callbacks?.adFinished?.();

    await expect(rewarded).resolves.toBe('rewarded');
    expect(lifecycle).toEqual(['pause', 'resume']);
  });
});
