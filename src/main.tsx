import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { registerPWA } from "./lib/pwa";
import { clearChunkReloadGuard, isChunkLoadError, tryReloadOnce } from "./lib/chunk-reload";

import { readThemePreference } from "./lib/theme-preference";
// White on first visit; dark only after an explicit choice.
document.documentElement.classList.toggle("dark", readThemePreference() === "dark");

// Auto-recover from stale lazy-loaded chunks after a redeploy.
// When an old hashed chunk no longer exists, dynamic import() throws
// "Importing a module script failed" / "Failed to fetch dynamically imported module".
// Reload once to pick up the new build.
window.addEventListener("error", (e) => {
  if (isChunkLoadError(e?.message)) tryReloadOnce();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkLoadError(msg)) tryReloadOnce();
});
// Clear the guard on successful load
window.addEventListener("load", () => {
  clearChunkReloadGuard();
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

registerPWA();
