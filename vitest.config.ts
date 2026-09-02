import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Scope coverage to the logic layer. UI (pages/components) is exercised
      // via Playwright E2E, not jsdom unit tests, so measuring line coverage
      // there would be misleading.
      include: ["src/lib/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        // Browser APIs that can't run in jsdom without a full puppeteer harness:
        "src/lib/chunk-reload.ts", // navigates on stale-chunk error
        "src/lib/pwa.ts", // service worker registration
        "src/lib/product-tour.ts", // DOM tour overlay (driver.js)
        "src/hooks/useInstallPrompt.ts", // beforeinstallprompt event
        // Vendored external code (shadcn):
        "src/hooks/use-toast.ts",
        // Static content objects:
        "src/lib/help-content.ts",
      ],
      // Baseline gate for the logic layer (currently ~73% lines / ~77% branch).
      // Kept a few points below the achieved numbers to leave headroom.
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 73,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
