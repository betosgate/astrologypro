import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/results",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3001",
    screenshot: "on",
    video: "off",
    colorScheme: "dark",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npx next start -p 3001",
    port: 3001,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
