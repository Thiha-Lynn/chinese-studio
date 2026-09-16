import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: { baseURL: "http://127.0.0.1:4173", headless: true },
  projects: [
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:4173/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
