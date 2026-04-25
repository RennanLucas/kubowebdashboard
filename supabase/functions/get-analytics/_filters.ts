// Pure helpers for source/device filtering.
// Extracted from index.ts so they can be unit-tested without booting the
// HTTP handler (index.ts calls Deno.serve at module top-level).

export function parseDevice(ua: string): string {
  if (!ua) return "Desconhecido";
  const lower = ua.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone"))
    return "Mobile";
  if (lower.includes("tablet") || lower.includes("ipad")) return "Tablet";
  return "Desktop";
}

export function classifySource(referrer: string | null | undefined): string {
  if (!referrer) return "Direto";
  try {
    const refHost = new URL(referrer).hostname.replace(/^www\./, "");
    if (refHost.includes("google")) return "Google";
    if (refHost.includes("bing")) return "Bing";
    if (refHost.includes("yahoo")) return "Yahoo";
    if (refHost.includes("facebook") || refHost.includes("fb")) return "Facebook";
    if (refHost.includes("instagram")) return "Instagram";
    if (refHost.includes("twitter") || refHost.includes("x.")) return "X (Twitter)";
    if (refHost.includes("linkedin")) return "LinkedIn";
    if (refHost.includes("tiktok")) return "TikTok";
    if (refHost.includes("youtube")) return "YouTube";
    if (refHost.includes("pinterest")) return "Pinterest";
    if (refHost.includes("lovable") || refHost.includes("lovableproject")) return "Direto";
    return refHost;
  } catch {
    return "Outro";
  }
}

export function sourceMatchesFilter(canonical: string, filter: string): boolean {
  switch (filter) {
    case "direct":
      return canonical === "Direto";
    case "organic":
      return ["Google", "Bing", "Yahoo"].includes(canonical);
    case "social":
      return ["Facebook", "Instagram", "X (Twitter)", "LinkedIn", "TikTok", "YouTube", "Pinterest"].includes(canonical);
    case "referral":
      return (
        canonical !== "Direto" &&
        !["Google", "Bing", "Yahoo", "Facebook", "Instagram", "X (Twitter)", "LinkedIn", "TikTok", "YouTube", "Pinterest"].includes(canonical)
      );
    case "paid":
    case "email":
      return false;
    default:
      return true;
  }
}

export function deviceMatchesFilter(ua: string | null | undefined, filter: string): boolean {
  const d = parseDevice(ua || "").toLowerCase();
  return d === filter.toLowerCase();
}

/**
 * Decide whether the GA4 branch is allowed for this request.
 * GA4 ignores in-app source/device filters, so we MUST fall back to the
 * pageviews/events aggregator whenever a filter is active. This rule is
 * unit-tested in _filters.test.ts.
 */
export function shouldUseGA4(opts: {
  hasServiceAccount: boolean;
  hasPropertyId: boolean;
  sourceFilter: string;
  deviceFilter: string;
}): boolean {
  if (!opts.hasServiceAccount || !opts.hasPropertyId) return false;
  if (opts.sourceFilter && opts.sourceFilter !== "all") return false;
  if (opts.deviceFilter && opts.deviceFilter !== "all") return false;
  return true;
}
