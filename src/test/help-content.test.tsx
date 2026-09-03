import { describe, expect, it } from "vitest";
import { HELP_ARTICLES_FLAT, HELP_CATEGORIES } from "@/lib/help-content";
import { filterHelpCategories, normalizeHelpSearch } from "@/lib/help-search";
import { ARTICLE_COMPONENTS } from "@/pages/help/articles";

describe("Central de Ajuda", () => {
  it("has unique metadata and real content for every published article", () => {
    const ids = HELP_ARTICLES_FLAT.map((article) => article.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(12);
    expect(ids.every((id) => typeof ARTICLE_COMPONENTS[id] === "function")).toBe(true);
  });

  it("searches without accents and includes keywords", () => {
    expect(normalizeHelpSearch("Configurações")).toBe("configuracoes");
    expect(filterHelpCategories(HELP_CATEGORIES, "configuracao").length).toBeGreaterThan(0);
    const results = filterHelpCategories(HELP_CATEGORIES, "whatsapp_click").flatMap((category) => category.articles);
    expect(results.some((article) => article.id === "events")).toBe(true);
  });

  it("returns no category for an unknown term", () => {
    expect(filterHelpCategories(HELP_CATEGORIES, "termo-inexistente-xyz")).toEqual([]);
  });
});
