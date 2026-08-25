import { expect, test } from '@playwright/test';

interface FrameProfile {
  readonly samples: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly longFrames: number;
}

async function sampleFrameTimes(page: import('@playwright/test').Page, durationMs = 2200): Promise<FrameProfile> {
  return page.evaluate(async (duration) => new Promise<FrameProfile>((resolve) => {
    const deltas: number[] = [];
    let previous = performance.now();
    const startedAt = previous;

    const tick = (now: number): void => {
      const delta = now - previous;
      previous = now;
      if (delta > 0 && Number.isFinite(delta)) deltas.push(delta);
      if (now - startedAt < duration) {
        requestAnimationFrame(tick);
        return;
      }

      const ordered = [...deltas].sort((a, b) => a - b);
      const percentileIndex = Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95));
      resolve({
        samples: ordered.length,
        p95Ms: ordered[percentileIndex] ?? Number.POSITIVE_INFINITY,
        maxMs: ordered.at(-1) ?? Number.POSITIVE_INFINITY,
        longFrames: ordered.filter((value) => value > 100).length,
      });
    };

    requestAnimationFrame(tick);
  }), durationMs);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(350);
});

test('keeps an idle runtime frame-time baseline within a regression ceiling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-portrait-gate', 'portrait intentionally gates active gameplay');

  const profile = await sampleFrameTimes(page);
  expect(profile.samples).toBeGreaterThan(20);
  expect(profile.p95Ms).toBeLessThan(100);
  expect(profile.maxMs).toBeLessThan(500);
  expect(profile.longFrames).toBeLessThanOrEqual(3);
});

test('boots with a live WebGL context and bounded backing-store size', async ({ page }) => {
  const graphics = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return {
      available: Boolean(gl),
      width: canvas.width,
      height: canvas.height,
      pixels: canvas.width * canvas.height,
      lost: gl?.isContextLost() ?? true,
    };
  });

  expect(graphics.available).toBe(true);
  expect(graphics.lost).toBe(false);
  expect(graphics.width).toBeGreaterThan(0);
  expect(graphics.height).toBeGreaterThan(0);
  expect(graphics.pixels).toBeLessThanOrEqual(4_000_000);
});

test('keeps the initial production network waterfall compact', async ({ page }) => {
  const resources = await page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry as PerformanceResourceTiming)
    .filter((entry) => new URL(entry.name).origin === location.origin)
    .map((entry) => ({
      path: new URL(entry.name).pathname,
      duration: entry.duration,
      transferSize: entry.transferSize,
    })));

  const runtimeAssets = resources.filter((entry) => entry.path.includes('/assets/'));
  const atlasResources = runtimeAssets.filter((entry) => /junk-(items|portraits|ui)\.(png|json)$/.test(entry.path));
  const standaloneSvg = runtimeAssets.filter((entry) => entry.path.endsWith('.svg'));

  expect(resources.length).toBeLessThanOrEqual(24);
  expect(atlasResources.length).toBeGreaterThanOrEqual(3);
  expect(standaloneSvg).toHaveLength(0);
});
