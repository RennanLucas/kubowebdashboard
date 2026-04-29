---
name: PWA Installable App
description: KUBOWEB is configured as an installable PWA. Service worker only registers in production outside iframes/preview hosts. Install page at /install. QA tooling at /admin/pwa-qa and scripts/qa-pwa.mjs.
type: feature
---
- vite-plugin-pwa configured in `vite.config.ts` with manifest (start_url `/dashboard`, theme `#0F1117`, bg `#F8F9FB`, standalone, pt-BR). `workbox.maximumFileSizeToCacheInBytes` raised to 5 MiB.
- Icons: `public/icon-192.png`, `public/icon-512.png` (any + maskable), `public/apple-touch-icon.png`.
- Service worker registration in `src/lib/pwa.ts`:
  - Strict guards: never registers inside iframes, on `id-preview--*`, `lovableproject.com`, `localhost`. Unregisters stale SWs in those contexts.
  - `onNeedRefresh`: shows persistent Sonner toast "Nova versão disponível" with "Atualizar" button that calls `updateSW(true)` and reloads.
  - `onRegisteredSW`: polls `registration.update()` every 60 minutes so users don't sit on stale builds.
- Install page `/install` (`src/pages/Install.tsx`) detects platform — native `beforeinstallprompt` on Android/Desktop, "Add to Home Screen" instructions on iOS Safari.
- `useInstallPrompt` hook captures `beforeinstallprompt` event globally.
- Sidebar has "Instalar app" link under "Conta".
- `index.html` includes manifest link, theme-color, apple-mobile-web-app meta tags.
- `navigateFallbackDenylist` excludes `/~oauth`, `/api`, `/functions/`.
- **QA tools**:
  - Build-time script: `scripts/qa-pwa.mjs` (run with `npm run qa:pwa` after build, or `npm run qa:build` for build+QA in one go). Validates dist/sw.js, manifest fields, icon files exist, denylist propagated, asset sizes. Exits non-zero on failure for CI.
  - Runtime page: `/admin/pwa-qa` (admin-only, `src/pages/PWAQA.tsx`). Shows live status of SW registration, cache contents, manifest, standalone mode. Buttons: "Verificar update", "Ativar nova versão" (skip waiting), "Limpar cache" (unregister + caches.delete).
