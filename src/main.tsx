import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { registerPWA } from "./lib/pwa";
import { clearChunkReloadGuard, isChunkLoadError, tryReloadOnce } from "./lib/chunk-reload";

// Apply persisted theme before render to avoid flash (defaults to light on first access)
try {
  let stored = localStorage.getItem("kuboweb:theme");
  if (!stored) {
    stored = localStorage.getItem("theme");
    if (stored) {
      try {
        localStorage.setItem("kuboweb:theme", stored);
      } catch {}
    }
  }
  let isDark = false;
  if (stored === "dark") {
    isDark = true;
  } else if (stored === "system") {
    isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    isDark = false;
  }
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
} catch {
  document.documentElement.classList.remove("dark");
}

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
