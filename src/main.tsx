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

createRoot(document.getElementById("root")!).render(<App />);

registerPWA();
