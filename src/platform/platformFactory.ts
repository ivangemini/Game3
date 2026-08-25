import { CrazyGamesPlatformAdapter } from './CrazyGamesPlatformAdapter';
import { LocalPlatformAdapter, type PlatformAdapter, type PlatformLifecycleHooks } from './PlatformAdapter';
import { YandexPlatformAdapter } from './YandexPlatformAdapter';

export type PlatformId = 'local' | 'yandex' | 'crazygames';

export interface PlatformDetectionInput {
  readonly search: string;
  readonly hostname: string;
  readonly referrer: string;
  readonly hasYandexSdk?: boolean;
  readonly hasCrazyGamesSdk?: boolean;
}

export function detectPlatform(input: PlatformDetectionInput): PlatformId {
  const override = new URLSearchParams(input.search).get('platform');
  if (override === 'yandex' || override === 'crazygames' || override === 'local') return override;
  if (input.hasYandexSdk) return 'yandex';
  if (input.hasCrazyGamesSdk) return 'crazygames';

  const host = input.hostname.toLowerCase();
  const referrer = input.referrer.toLowerCase();
  if (host.includes('yandex.') || host.endsWith('yandex.net') || referrer.includes('yandex.')) return 'yandex';
  if (host.includes('crazygames.') || referrer.includes('crazygames.')) return 'crazygames';
  return 'local';
}

export function createPlatformAdapter(
  hooks: PlatformLifecycleHooks = {},
  input?: PlatformDetectionInput,
): PlatformAdapter {
  const detection = input ?? browserDetectionInput();
  const platform = detectPlatform(detection);
  if (platform === 'yandex') {
    return new YandexPlatformAdapter({
      hooks,
      hostedByYandex: detection.hostname.includes('yandex') || detection.referrer.includes('yandex'),
    });
  }
  if (platform === 'crazygames') return new CrazyGamesPlatformAdapter({ hooks });
  return new LocalPlatformAdapter(hooks);
}

function browserDetectionInput(): PlatformDetectionInput {
  if (typeof window === 'undefined') {
    return { search: '', hostname: '', referrer: '' };
  }
  return {
    search: window.location.search,
    hostname: window.location.hostname,
    referrer: typeof document === 'undefined' ? '' : document.referrer,
    hasYandexSdk: Boolean(window.YaGames),
    hasCrazyGamesSdk: Boolean(window.CrazyGames?.SDK),
  };
}
