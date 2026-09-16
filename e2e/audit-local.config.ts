import { defineConfig } from "@playwright/test";

// Isolated browser checks: no staging credentials or external database writes.
export default defineConfig({
  testDir: ".",
  testMatch: ["audit-invite-local.spec.ts","audit-ai-local.spec.ts"],
  timeout: 60000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5186", browserName: "chromium" },
  webServer: {
    env: { VITE_SUPABASE_URL:"https://kubo-test.invalid",VITE_SUPABASE_PUBLISHABLE_KEY:"synthetic-public-key" },
    command: "npm run dev -- --host 127.0.0.1 --port 5186 --strictPort",
    url: "http://127.0.0.1:5186",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
