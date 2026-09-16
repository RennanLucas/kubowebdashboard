/**
 * PWA registration with strict guards against previews and iframes.
 * The service worker only registers on the real production domain,
 * outside of any iframe.
 *
 * When a new version of the app is detected, a Sonner toast prompts the
 * user to reload. Auto-checks for updates every 60 minutes.
 */
import { toast } from "sonner";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function registerPWA() {
  if (typeof window === "undefined") return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isProductionHost = host === "kubowebdashboard.vercel.app";

  if (isInIframe || !isProductionHost) {
    // Make sure no stale SW survives in preview/iframe contexts
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    return;
  }

  // Lazy-import virtual module so dev builds don't fail
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          toast("Nova versão disponível", {
            description: "Recarregue para atualizar o app.",
            duration: Infinity,
            action: {
              label: "Atualizar",
              onClick: () => updateSW(true),
            },
          });
        },
        onOfflineReady() {
          // Optional: silent — too noisy to surface every visit.
          // toast.success("App pronto para uso offline");
        },
        onRegisteredSW(_swUrl, registration) {
          if (!registration) return;
          // Periodically poll for a new SW so users don't sit on stale builds.
          setInterval(() => {
            registration.update().catch(() => {});
          }, UPDATE_CHECK_INTERVAL_MS);
        },
      });
    })
    .catch(() => {});
}
