---
name: PWA Installable App
description: KUBOWEB is configured as an installable PWA. Service worker only registers in production outside iframes/preview hosts. Install page at /install.
type: feature
---
- vite-plugin-pwa configured in `vite.config.ts` with manifest (start_url `/dashboard`, theme `#0F1117`, bg `#F8F9FB`, standalone, pt-BR).
- Icons: `public/icon-192.png`, `public/icon-512.png` (any + maskable), `public/apple-touch-icon.png`.
- Service worker registration in `src/lib/pwa.ts` with strict guards: never registers inside iframes, on `id-preview--*`, `lovableproject.com`, `localhost`. Unregisters stale SWs in those contexts.
- Install page `/install` (`src/pages/Install.tsx`) detects platform — shows native `beforeinstallprompt` on Android/Desktop, shows "Add to Home Screen" instructions on iOS Safari.
- `useInstallPrompt` hook captures `beforeinstallprompt` event globally.
- Sidebar has "Instalar app" link under "Conta".
- `index.html` includes manifest link, theme-color, apple-mobile-web-app meta tags.
- `navigateFallbackDenylist` excludes `/~oauth`, `/api`, `/functions/`.
