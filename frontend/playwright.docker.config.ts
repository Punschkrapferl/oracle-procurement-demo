// noinspection JSUnusedGlobalSymbols

import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env['CI']);
const dockerBaseUrl =
  process.env['E2E_DOCKER_BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e-docker',

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  fullyParallel: false,
  workers: 1,

  forbidOnly: isCi,
  retries: isCi ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-docker', open: 'never' }],
  ],

  use: {
    baseURL: dockerBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
