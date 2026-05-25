import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPWA } from "./lib/pwa";

// Apply persisted theme before render to avoid flash (defaults to dark)
try {
  const stored = localStorage.getItem("kuboweb:theme");
  if (stored !== "light") document.documentElement.classList.add("dark");
} catch {
  document.documentElement.classList.add("dark");
}

// Auto-recover from stale lazy-loaded chunks after a redeploy.
// When an old hashed chunk no longer exists, dynamic import() throws
// "Importing a module script failed" / "Failed to fetch dynamically imported module".
// Reload once to pick up the new build.
const RELOAD_KEY = "kuboweb:chunk-reload";
const isChunkLoadError = (msg?: string) =>
  !!msg && /(Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS)/i.test(msg);

const tryReloadOnce = () => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return;
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  } catch {
    window.location.reload();
  }
};

window.addEventListener("error", (e) => {
  if (isChunkLoadError(e?.message)) tryReloadOnce();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkLoadError(msg)) tryReloadOnce();
});
// Clear the guard on successful load
window.addEventListener("load", () => {
  try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
});

createRoot(document.getElementById("root")!).render(<App />);

registerPWA();
