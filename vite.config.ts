import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Disable in dev to avoid breaking the Lovable preview iframe
      devOptions: { enabled: false },
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "KUBOWEB Analytics",
        short_name: "KUBOWEB",
        description:
          "Acompanhe o desempenho do seu site, monitore leads e cresça com o KUBOWEB Analytics.",
        theme_color: "#0F1117",
        background_color: "#F8F9FB",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/dashboard",
        lang: "pt-BR",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /\/functions\//],
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        // Allow larger JS chunks to be precached (current bundle ~2.6MB).
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Split heavy vendor libs into their own chunks so the initial
    // bundle stays small and unused JS is deferred.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query", "@tanstack/query-core"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "charts-vendor": ["recharts"],
          "date-vendor": ["date-fns"],
        },
      },
    },
  },
}));
