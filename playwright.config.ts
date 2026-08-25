import { defineConfig } from '@playwright/test';

const baseUse = {
  baseURL: 'http://127.0.0.1:4173',
  colorScheme: 'dark' as const,
  screenshot: 'only-on-failure' as const,
  trace: 'retain-on-failure' as const,
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: baseUse,
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...baseUse, browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-compact-landscape',
      use: { ...baseUse, browserName: 'chromium', viewport: { width: 1024, height: 576 } },
    },
    {
      name: 'chromium-mobile-landscape',
      use: {
        ...baseUse,
        browserName: 'chromium',
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'webkit-mobile-landscape',
      use: {
        ...baseUse,
        browserName: 'webkit',
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'firefox-desktop',
      use: { ...baseUse, browserName: 'firefox', viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'chromium-portrait-gate',
      use: {
        ...baseUse,
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
  ],
});
