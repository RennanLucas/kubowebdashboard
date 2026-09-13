export const SOURCE_GROUPS: Record<string, string[]> = {
  direct: ["Direto"],
  organic: ["Google", "Bing", "Yahoo", "DuckDuckGo", "Orgânico"],
  social: ["Instagram", "Facebook", "LinkedIn", "TikTok", "Twitter", "X", "X (Twitter)", "Social", "YouTube", "WhatsApp", "Pinterest"],
  paid: ["Pago"],
  email: ["Email", "E-mail"],
};
interface SourceQuery<T> {
  in(column: string, values: string[]): T;
  ilike(column: string, value: string): T;
  not(column: string, operator: string, value: string): T;
}
export function filterSource<T extends SourceQuery<T>>(query: T, source: string): T {
  if (source === "all") return query;
  if (source === "referral") {
    const known = [...new Set(Object.values(SOURCE_GROUPS).flat())];
    return query.not("source", "in", "(" + known.map((s) => '"' + s + '"').join(",") + ")");
  }
  return SOURCE_GROUPS[source]
    ? query.in("source", SOURCE_GROUPS[source]) : query.ilike("source", source);
}
