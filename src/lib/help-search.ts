import type { HelpCategory } from "./help-content";

export function normalizeHelpSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").trim();
}

function stemHelpWord(value: string) {
  return value.replace(/coes$/, "cao").replace(/oes$/, "ao").replace(/s$/, "");
}

function matchesHelpSearch(value: string, query: string) {
  const normalized = normalizeHelpSearch(value);
  if (normalized.includes(query)) return true;
  const queryStem = stemHelpWord(query);
  return normalized.split(/[^a-z0-9_]+/).some((word) => stemHelpWord(word).includes(queryStem));
}

export function filterHelpCategories(categories: HelpCategory[], query: string) {
  const normalizedQuery = normalizeHelpSearch(query);
  if (!normalizedQuery) return categories;

  return categories.map((category) => {
    if (matchesHelpSearch(category.title, normalizedQuery)) return category;
    const articles = category.articles.filter((article) =>
      matchesHelpSearch([article.title, article.description, ...article.keywords].join(" "), normalizedQuery),
    );
    return { ...category, articles };
  }).filter((category) => category.articles.length > 0);
}
