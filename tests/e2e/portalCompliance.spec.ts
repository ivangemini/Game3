import { expect, test } from '@playwright/test';

test('forced Yandex adapter completes loading markup and boots without external SDK fetch', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'portal contract runs once in Chromium desktop');

  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('yandex.net') || url.endsWith('/sdk.js')) externalRequests.push(url);
  });

  await page.addInitScript(() => {
    const probe = { init: 0, ready: 0, gameplayStart: 0, gameplayStop: 0 };
    (window as typeof window & { __portalProbe?: typeof probe }).__portalProbe = probe;
    (window as typeof window & { YaGames?: unknown }).YaGames = {
      init: async () => {
        probe.init += 1;
        return {
          environment: { i18n: { lang: 'en' } },
          features: {
            LoadingAPI: { ready: () => { probe.ready += 1; } },
            GameplayAPI: {
              start: () => { probe.gameplayStart += 1; },
              stop: () => { probe.gameplayStop += 1; },
            },
          },
          adv: {
            showFullscreenAdv: () => {},
            showRewardedVideo: () => {},
          },
        };
      },
    };
  });

  await page.goto('/?platform=yandex');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __portalProbe?: { init: number; ready: number } }).__portalProbe))
    .toMatchObject({ init: 1, ready: 1 });
  expect(externalRequests).toEqual([]);
});

test('forced CrazyGames adapter brackets runtime loading and boots without external SDK fetch', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'portal contract runs once in Chromium desktop');

  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('sdk.crazygames.com')) externalRequests.push(url);
  });

  await page.addInitScript(() => {
    const probe = { init: 0, loadingStart: 0, loadingStop: 0, gameplayStart: 0, gameplayStop: 0 };
    (window as typeof window & { __portalProbe?: typeof probe }).__portalProbe = probe;
    (window as typeof window & { CrazyGames?: unknown }).CrazyGames = {
      SDK: {
        init: async () => { probe.init += 1; },
        game: {
          loadingStart: () => { probe.loadingStart += 1; },
          loadingStop: () => { probe.loadingStop += 1; },
          gameplayStart: () => { probe.gameplayStart += 1; },
          gameplayStop: () => { probe.gameplayStop += 1; },
        },
        ad: { requestAd: () => {} },
      },
    };
  });

  await page.goto('/?platform=crazygames');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => (window as typeof window & {
    __portalProbe?: { init: number; loadingStart: number; loadingStop: number };
  }).__portalProbe)).toMatchObject({ init: 1, loadingStart: 1, loadingStop: 1 });
  expect(externalRequests).toEqual([]);
});
