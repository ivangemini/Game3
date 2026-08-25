import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(250);
  expect(pageErrors).toEqual([]);
});

test('boots the game canvas inside the viewport without document overflow', async ({ page }) => {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  expect(overflow.width).toBeLessThanOrEqual(1);
  expect(overflow.height).toBeLessThanOrEqual(1);
});

test('applies the correct viewport profile and orientation gate', async ({ page }) => {
  const viewport = page.viewportSize()!;
  const portrait = viewport.height > viewport.width;
  const mode = await page.locator('html').getAttribute('data-viewport-mode');
  expect(mode).toBe(portrait ? 'portrait' : viewport.width <= 1024 || viewport.height <= 600 ? 'compact-landscape' : 'standard-landscape');

  const gate = page.locator('#orientation-gate');
  if (portrait) {
    await expect(gate).toBeVisible();
    await expect(gate).toContainText('ROTATE THE JUNK');
    expect(await page.locator('canvas').evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
  } else {
    await expect(gate).toBeHidden();
  }
});

test('keeps save recovery shell and application root available', async ({ page }) => {
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#save-notice')).toBeAttached();
  await expect(page.locator('#save-notice')).toBeHidden();
});

test('surfaces a safe reset when the primary save is corrupt and no backup exists', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('junkpack.save', '{broken-json');
    localStorage.removeItem('junkpack.save.backup');
  });
  await page.reload();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  const notice = page.locator('#save-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('SAVE RESET');
});

test('restores the previous valid backup after primary corruption', async ({ page }) => {
  const backup = {
    version: 8,
    discoveredItemIds: ['laser-cat'],
    discoveredRecipeIds: [],
    bestEndlessWave: 0,
    bestCorruptedLoop: 0,
    settings: { musicVolume: 0.8, sfxVolume: 0.9, reducedMotion: false },
    activeRun: null,
  };
  await page.evaluate((value) => {
    localStorage.setItem('junkpack.save', '{broken-json');
    localStorage.setItem('junkpack.save.backup', JSON.stringify(value));
  }, backup);
  await page.reload();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  const notice = page.locator('#save-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('SAVE RECOVERED');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('junkpack.save') ?? 'null'));
  expect(restored.discoveredItemIds).toEqual(['laser-cat']);
});
