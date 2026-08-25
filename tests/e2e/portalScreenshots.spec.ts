import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SCREENSHOT_DIR = path.resolve('release/screenshots');

async function enterFirstRun(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounds unavailable');

  await page.mouse.click(
    box.x + box.width * (365 / 1600),
    box.y + box.height * (480 / 900),
  );

  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('junkpack.save');
    if (!raw) return null;
    try { return JSON.parse(raw)?.activeRun?.heroId ?? null; } catch { return null; }
  })).not.toBeNull();

  await expect(canvas).toBeVisible();
  await page.waitForTimeout(350);
}

test('captures portal-ready gameplay screenshots from a deterministic first-run state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'release screenshots are captured once in Chromium desktop');
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  await enterFirstRun(page);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'gameplay-1440x900.png'),
    type: 'png',
  });

  await page.setViewportSize({ width: 1024, height: 576 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'compact-landscape');
  await page.waitForTimeout(180);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'gameplay-1024x576.png'),
    type: 'png',
  });

  await expect(page.locator('#orientation-gate')).toBeHidden();
});
