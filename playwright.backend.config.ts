import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "backend-connected.spec.ts",
  outputDir: "./test-results/backend",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4176",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "connected-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: "node --import tsx server/e2e-index.ts",
      url: "http://127.0.0.1:8790/api/health",
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: "npm run dev -- --port 4176",
      url: "http://127.0.0.1:4176",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        SGP_BACKEND_URL: "http://127.0.0.1:8790",
        VITE_SGP_BACKEND_ENABLED: "true",
        VITE_SGP_BACKEND_URL: "/api",
        VITE_SGP_AI_API_BASE: "/api/sgp-ai",
        VITE_SGP_PARTNER_API_BASE: "/api/v1"
      }
    }
  ]
});
