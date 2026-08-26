import { expect, test } from '@playwright/test';

async function enterFirstRun(page: import('@playwright/test').Page): Promise<import('@playwright/test').Locator> {
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
  return canvas;
}

async function clickCanvasPoint(
  page: import('@playwright/test').Page,
  canvas: import('@playwright/test').Locator,
  logicalX: number,
  logicalY: number,
): Promise<void> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounds unavailable');
  await page.mouse.click(
    box.x + box.width * (logicalX / 1600),
    box.y + box.height * (logicalY / 900),
  );
}

async function waitForEncounterReward(page: import('@playwright/test').Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('junkpack.save');
    if (!raw) return 0;
    try { return JSON.parse(raw)?.activeRun?.claimedEncounterIds?.length ?? 0; } catch { return 0; }
  }), { timeout: 45_000 }).toBeGreaterThan(0);
}

async function advanceSaveToFirstBoss(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    const raw = localStorage.getItem('junkpack.save');
    if (!raw) throw new Error('Missing Junkpack save');
    const save = JSON.parse(raw);
    if (!save?.activeRun?.progress) throw new Error('Missing active run progress');
    save.activeRun.progress = {
      ...save.activeRun.progress,
      mode: 'campaign',
      campaignEncounterIndex: 2,
      loopEncounterIndex: 0,
    };
    save.activeRun.pendingPerkOfferIds = [];
    save.activeRun.pendingEventId = null;
    localStorage.setItem('junkpack.save', JSON.stringify(save));
  });
  await page.reload();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(300);
}

test('captures production presentation matrix for preparation, combat, boss and reward', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'release screenshots are captured once in Chromium desktop');

  const canvas = await enterFirstRun(page);
  await page.screenshot({ path: 'portal-screenshot-preparation-1440x900.png', type: 'png' });

  await page.setViewportSize({ width: 1024, height: 576 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'compact-landscape');
  await expect(page.locator('#orientation-gate')).toBeHidden();
  await page.waitForTimeout(180);
  await page.screenshot({ path: 'portal-screenshot-preparation-1024x576.png', type: 'png' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'standard-landscape');
  await page.waitForTimeout(120);

  // RunProgressPanel START FIGHT button center in logical 1600x900 game coordinates.
  await clickCanvasPoint(page, canvas, 670, 527);
  await page.waitForTimeout(360);
  await page.screenshot({ path: 'portal-screenshot-combat-1440x900.png', type: 'png' });

  await page.setViewportSize({ width: 1024, height: 576 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'compact-landscape');
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'portal-screenshot-combat-1024x576.png', type: 'png' });

  await waitForEncounterReward(page);
  await page.screenshot({ path: 'portal-screenshot-reward-1024x576.png', type: 'png' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await advanceSaveToFirstBoss(page);
  const bossCanvas = page.locator('canvas');
  await clickCanvasPoint(page, bossCanvas, 670, 527);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'portal-screenshot-boss-1440x900.png', type: 'png' });

  await page.setViewportSize({ width: 1024, height: 576 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'compact-landscape');
  await page.waitForTimeout(110);
  await page.screenshot({ path: 'portal-screenshot-boss-1024x576.png', type: 'png' });
});
