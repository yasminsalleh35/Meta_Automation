import { defineConfig, devices } from '@playwright/test';

// audit QA-04/QA-05. Runs against a deployed site (no staging exists yet):
//   BASE_URL=https://camplyia.netlify.app npx playwright test
// Optional creds (tests that need them are skipped when unset):
//   E2E_EMAIL / E2E_PASSWORD              — a regular test user (NEVER a real customer)
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD  — an admin test user (crawler admin pass)
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://camplyia.netlify.app',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
