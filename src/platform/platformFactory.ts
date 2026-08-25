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

  const host = normalizeHostname(input.hostname);
  const referrerHost = hostnameFromReferrer(input.referrer);
  if (isYandexHostname(host) || isYandexHostname(referrerHost)) return 'yandex';
  if (isCrazyGamesHostname(host) || isCrazyGamesHostname(referrerHost)) return 'crazygames';
  return 'local';
}

export function createPlatformAdapter(
  hooks: PlatformLifecycleHooks = {},
  input?: PlatformDetectionInput,
): PlatformAdapter {
  const detection = input ?? browserDetectionInput();
  const platform = detectPlatform(detection);
  if (platform === 'yandex') {
    const host = normalizeHostname(detection.hostname);
    const referrerHost = hostnameFromReferrer(detection.referrer);
    return new YandexPlatformAdapter({
      hooks,
      hostedByYandex: isYandexHostname(host) || isYandexHostname(referrerHost),
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

function hostnameFromReferrer(referrer: string): string {
  if (!referrer) return '';
  try {
    return normalizeHostname(new URL(referrer).hostname);
  } catch {
    return '';
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function isYandexHostname(hostname: string): boolean {
  return /(^|\.)yandex\.[a-z0-9.-]+$/i.test(hostname);
}

function isCrazyGamesHostname(hostname: string): boolean {
  return hostname === 'crazygames.com' || hostname.endsWith('.crazygames.com');
}
