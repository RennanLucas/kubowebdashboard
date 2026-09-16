const PUBLIC_ORIGINS = [
  "https://kubowebdashboard.vercel.app",
];
const LOCAL_ORIGINS = [5173, 8080, 3000].map((port) => `http://localhost:${port}`);

/** Exact origins, plus previews under this project's verified Vercel team. */
export function isTrustedOrigin(origin: string, configured = ""): boolean {
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password) return false;
    if ([...PUBLIC_ORIGINS, ...LOCAL_ORIGINS].includes(origin)) return true;
    if (url.protocol !== "https:") return false;
    if (configured.split(",").map((s) => s.trim()).includes(origin)) return true;
    return /^kubowebdashboard-[a-z0-9-]+-rennanlucas-projects\.vercel\.app$/.test(url.hostname)
      && !url.port;
  } catch {
    return false;
  }
}

export function checkoutReturnUrl(value: unknown, configured = ""): string {
  const fallback = `${PUBLIC_ORIGINS[0]}/checkout/return`;
  if (typeof value !== "string") return fallback;
  try {
    const url = new URL(value);
    if (!isTrustedOrigin(url.origin, configured) || url.username || url.password
        || url.pathname !== "/checkout/return") return fallback;
    return `${url.origin}/checkout/return`;
  } catch {
    return fallback;
  }
}
