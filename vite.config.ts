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
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /\/functions\//],
        // Keep installation light. Hashed route/vendor chunks are cached only
        // when the customer actually opens that part of the product, preserving
        // route-level lazy loading instead of downloading the whole app at once.
        globPatterns: ["**/*.{html,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "kubo-hashed-assets-v1",
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
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
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (/[\\/]react[\\/]|[\\/]react-dom[\\/]|[\\/]react-router-dom[\\/]/.test(id)) {
              return "react-vendor";
            }
            if (/[\\/]@tanstack[\\/](react-query|query-core)[\\/]/.test(id)) {
              return "query-vendor";
            }
            if (id.includes("@supabase/supabase-js")) {
              return "supabase-vendor";
            }
            if (id.includes("recharts")) {
              return "charts-vendor";
            }
            if (id.includes("date-fns")) {
              return "date-vendor";
            }
          }
        },
      },
    },
  },
}));
