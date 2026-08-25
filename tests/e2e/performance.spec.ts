import { expect, test } from '@playwright/test';

interface FrameProfile {
  readonly samples: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly longFrames: number;
}

const STANDALONE_ART_PREFIXES = [
  '/assets/art/items/',
  '/assets/art/heroes/',
  '/assets/art/bosses/',
  '/assets/art/ui/',
] as const;

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
        longFrames: ordered.filter((value) => value > 250).length,
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

test('keeps an idle runtime responsive under CI load', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-portrait-gate', 'portrait intentionally gates active gameplay');

  const profile = await sampleFrameTimes(page);
  // Hosted CI runners may heavily throttle RAF when several browser projects run
  // concurrently. This is a catastrophic-stall regression gate, not an FPS SLA.
  expect(profile.samples).toBeGreaterThanOrEqual(5);
  expect(profile.p95Ms).toBeLessThan(350);
  expect(profile.maxMs).toBeLessThan(1200);
  expect(profile.longFrames).toBeLessThanOrEqual(4);
});

test('keeps the render canvas backing store bounded', async ({ page }) => {
  const graphics = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width,
    height: canvas.height,
    pixels: canvas.width * canvas.height,
  }));

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
  const atlasResources = runtimeAssets.filter((entry) => /junk-(items|portraits|ui)\.(svg|json)$/.test(entry.path));
  const standaloneArt = runtimeAssets.filter((entry) => STANDALONE_ART_PREFIXES.some((prefix) => entry.path.includes(prefix)));

  expect(resources.length).toBeLessThanOrEqual(24);
  expect(atlasResources.length).toBeGreaterThanOrEqual(6);
  expect(standaloneArt).toHaveLength(0);
});
