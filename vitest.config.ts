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
      exclude: ["src/test/**", "src/**/*.d.ts"],
      // Baseline gate for the logic layer (currently ~56% lines / ~75% branch).
      // Kept a few points below the achieved numbers to leave headroom.
      thresholds: {
        lines: 53,
        statements: 53,
        functions: 68,
        branches: 72,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
