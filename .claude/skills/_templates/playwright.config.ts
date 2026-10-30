// Template: browser E2E against the static build (testing). Run: next build && npx playwright test
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npx serve out -l 3100 --no-clipboard', url: 'http://localhost:3100', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },        // 360-412px wide, touch
    { name: 'mobile-ios', use: { ...devices['iPhone 14'] } },
  ],
});
