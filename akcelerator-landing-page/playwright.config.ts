import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// Tests run against a production build on a port of their own. It is several times faster than the dev
// server, starts every run with empty rate-limit buckets and leaves a running `npm run dev` alone.
// To aim at another server (for example the dev server while debugging one test), set PLAYWRIGHT_BASE_URL.
// The port is derived from the folder, so every checkout (git worktree) gets its own and agents working
// in different worktrees can run their tests at the same time.
const checkoutDir = fileURLToPath(new URL('.', import.meta.url)).toLowerCase();
const TEST_PORT = 4200 + (createHash('sha256').update(checkoutDir).digest().readUInt16BE(0) % 700);
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL || `http://localhost:${TEST_PORT}`;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  testIgnore: '**/unit/**',
  timeout: 30_000,
  // Every test owns its browser context, so tests of one file run side by side too.
  // A file that shares server state opts out with test.describe.configure({ mode: 'default' }).
  fullyParallel: true,
  forbidOnly: isCI,
  // Many tests measure real timing (the entry tour, Molly's walks) and may lose a race on a loaded machine.
  // One retry keeps such a run green; the test is then listed as "flaky" in the summary and deserves a look.
  retries: 1,
  // Passing tests print one character; only failures print detail.
  reporter: isCI ? [['github'], ['dot']] : 'dot',
  use: {
    baseURL,
    headless: true,
    // A service worker would answer requests before page.route() sees them and carry cache between pages.
    serviceWorkers: 'block',
    // Video and trace are recorded for every test and thrown away on a pass: too costly for the default run.
    // To debug a failure, rerun that test with --trace on.
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        // Builds only when the sources changed since the last build, then serves the build.
        command: `node tests/support/serve-build.mjs ${TEST_PORT}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe'
      }
});
