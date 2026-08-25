import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const STANDALONE_ART_PREFIXES = [
  '/assets/art/items/',
  '/assets/art/heroes/',
  '/assets/art/bosses/',
  '/assets/art/ui/',
] as const;

const REQUIRED_ATLAS_FILES = [
  'junk-items.svg', 'junk-items.json',
  'junk-portraits.svg', 'junk-portraits.json',
  'junk-ui.svg', 'junk-ui.json',
] as const;

test('boots cleanly, fits the viewport and stays atlas-first', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requests: string[] = [];
  const failedResponses: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  const expectedMode = testInfo.project.name === 'chromium-portrait-gate'
    ? 'portrait'
    : testInfo.project.name.includes('mobile') || testInfo.project.name.includes('compact')
      ? 'compact-landscape'
      : 'standard-landscape';
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', expectedMode);

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (!viewport || !canvasBox) throw new Error('Viewport/canvas bounds unavailable');
  expect(canvasBox.width).toBeGreaterThan(100);
  expect(canvasBox.height).toBeGreaterThan(100);
  expect(canvasBox.x).toBeGreaterThanOrEqual(-0.5);
  expect(canvasBox.y).toBeGreaterThanOrEqual(-0.5);
  expect(canvasBox.x + canvasBox.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(canvasBox.y + canvasBox.height).toBeLessThanOrEqual(viewport.height + 0.5);

  const shell = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    touchAction: getComputedStyle(document.querySelector('canvas')!).touchAction,
    overscroll: getComputedStyle(document.body).overscrollBehavior,
    gateDisplay: getComputedStyle(document.querySelector('#orientation-gate')!).display,
    canvasPointerEvents: getComputedStyle(document.querySelector('canvas')!).pointerEvents,
  }));
  expect(shell.scrollWidth).toBeLessThanOrEqual(shell.innerWidth + 1);
  expect(shell.scrollHeight).toBeLessThanOrEqual(shell.innerHeight + 1);
  expect(shell.touchAction).toBe('none');
  expect(shell.overscroll).toBe('none');

  if (expectedMode === 'portrait') {
    expect(shell.gateDisplay).toBe('flex');
    expect(shell.canvasPointerEvents).toBe('none');
  } else {
    expect(shell.gateDisplay).toBe('none');
    expect(shell.canvasPointerEvents).not.toBe('none');
  }

  const atlasRequests = requests.filter((url) => url.includes('/assets/atlas/'));
  for (const file of REQUIRED_ATLAS_FILES) {
    expect(atlasRequests.some((url) => url.endsWith(file)), `missing runtime request for ${file}`).toBe(true);
  }
  for (const prefix of STANDALONE_ART_PREFIXES) {
    expect(requests.some((url) => url.includes(prefix)), `unexpected standalone fallback request under ${prefix}`).toBe(false);
  }

  const screenshot = await page.screenshot({ type: 'png' });
  const stats = await sharp(screenshot).stats();
  const averageDeviation = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0) / 3;
  expect(averageDeviation).toBeGreaterThan(8);
  await testInfo.attach('matrix-screen', { body: screenshot, contentType: 'image/png' });

  expect(failedResponses, failedResponses.join('\n')).toEqual([]);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});

test('suppresses the system context menu inside the game surface', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'context-menu contract runs once in Chromium desktop');
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

  const prevented = await page.locator('canvas').evaluate((canvas) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    const dispatchResult = canvas.dispatchEvent(event);
    return event.defaultPrevented && !dispatchResult;
  });
  expect(prevented).toBe(true);
});

test('first launch reaches the run with one hero-selection click', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'first-launch contract runs once in Chromium desktop');
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounds unavailable');

  // First hero card center in the 1600×900 Phaser design space, projected into
  // the responsive canvas. A blocking tutorial modal would consume this click.
  await page.mouse.click(
    box.x + box.width * (365 / 1600),
    box.y + box.height * (480 / 900),
  );

  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('junkpack.save');
    if (!raw) return null;
    try { return JSON.parse(raw)?.activeRun?.heroId ?? null; } catch { return null; }
  })).not.toBeNull();
});

test('viewport profile flips portrait gate on resize and recovers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'resize sequence runs once in Chromium desktop');

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'standard-landscape');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'portrait');
  await expect(page.locator('#orientation-gate')).toBeVisible();
  expect(await page.locator('canvas').evaluate((canvas) => getComputedStyle(canvas).pointerEvents)).toBe('none');

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'compact-landscape');
  await expect(page.locator('#orientation-gate')).toBeHidden();
  expect(await page.locator('canvas').evaluate((canvas) => getComputedStyle(canvas).pointerEvents)).not.toBe('none');

  const box = await page.locator('canvas').boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeLessThanOrEqual(844);
  expect(box?.height ?? 0).toBeLessThanOrEqual(390);
});
