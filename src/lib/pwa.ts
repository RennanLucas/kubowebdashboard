/**
 * PWA registration with strict guards against Lovable preview iframes.
 * The service worker only registers in production, on the real domain,
 * outside of any iframe.
 */
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
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreviewHost) {
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
      registerSW({ immediate: true });
    })
    .catch(() => {});
}
