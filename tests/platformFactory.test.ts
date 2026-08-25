import { describe, expect, it } from 'vitest';
import { detectPlatform } from '../src/platform/platformFactory';

describe('detectPlatform', () => {
  it('keeps ordinary development and standalone hosts local', () => {
    expect(detectPlatform({ search: '', hostname: 'localhost', referrer: '' })).toBe('local');
    expect(detectPlatform({ search: '', hostname: 'game.example.com', referrer: '' })).toBe('local');
  });

  it('honors an explicit platform override for portal QA', () => {
    expect(detectPlatform({ search: '?platform=yandex', hostname: 'localhost', referrer: '' })).toBe('yandex');
    expect(detectPlatform({ search: '?platform=crazygames', hostname: 'localhost', referrer: '' })).toBe('crazygames');
    expect(detectPlatform({ search: '?platform=local', hostname: 'yandex.ru', referrer: '' })).toBe('local');
  });

  it('prefers an already injected portal SDK', () => {
    expect(detectPlatform({
      search: '', hostname: 'cdn.example.com', referrer: '', hasYandexSdk: true,
    })).toBe('yandex');
    expect(detectPlatform({
      search: '', hostname: 'cdn.example.com', referrer: '', hasCrazyGamesSdk: true,
    })).toBe('crazygames');
  });

  it('detects Yandex and CrazyGames through host or embedding referrer', () => {
    expect(detectPlatform({ search: '', hostname: 'games.yandex.ru', referrer: '' })).toBe('yandex');
    expect(detectPlatform({ search: '', hostname: 'cdn.example.com', referrer: 'https://yandex.com/games/app/123' })).toBe('yandex');
    expect(detectPlatform({ search: '', hostname: 'www.crazygames.com', referrer: '' })).toBe('crazygames');
    expect(detectPlatform({ search: '', hostname: 'cdn.example.com', referrer: 'https://www.crazygames.com/game/foo' })).toBe('crazygames');
  });

  it('does not treat portal names in unrelated hostnames, paths or query strings as embedding evidence', () => {
    expect(detectPlatform({ search: '', hostname: 'notyandex.com', referrer: '' })).toBe('local');
    expect(detectPlatform({ search: '', hostname: 'crazygames.example.com', referrer: '' })).toBe('local');
    expect(detectPlatform({
      search: '', hostname: 'cdn.example.com', referrer: 'https://example.com/?next=https://yandex.com/games',
    })).toBe('local');
    expect(detectPlatform({
      search: '', hostname: 'cdn.example.com', referrer: 'https://example.com/crazygames.com/game/foo',
    })).toBe('local');
    expect(detectPlatform({ search: '', hostname: 'cdn.example.com', referrer: 'not a url yandex.com' })).toBe('local');
  });
});
