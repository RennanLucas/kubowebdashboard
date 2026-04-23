export interface InsightHistoryRecord {
  id: string;
  content: string;
  created_at: string;
  period_days: number;
  model: string | null;
  project_id: string | null;
}

export interface InsightSectionDiff {
  title: string;
  status: "changed" | "same";
  currentPreview: string;
  comparePreview: string;
}

export interface InsightComparisonResult {
  changedCount: number;
  sections: InsightSectionDiff[];
}

const normalize = (value: string) => value.replace(/[`*_>#-]/g, "").replace(/\s+/g, " ").trim();

const truncate = (value: string, max = 180) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const extractSections = (content: string) => {
  const sections = new Map<string, string[]>();
  let currentTitle = "Resumo";

  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      currentTitle = line.replace(/^##\s+/, "").trim();
      if (!sections.has(currentTitle)) sections.set(currentTitle, []);
      continue;
    }

    if (!sections.has(currentTitle)) sections.set(currentTitle, []);
    sections.get(currentTitle)?.push(line);
  }

  return Array.from(sections.entries()).map(([title, lines]) => ({
    title,
    raw: lines.join("\n").trim(),
    normalized: normalize(lines.join(" ")),
    preview: truncate(normalize(lines.join(" ")) || "Sem conteúdo relevante nesta seção."),
  }));
};

export function compareInsightVersions(currentContent: string, compareContent: string): InsightComparisonResult {
  const currentSections = extractSections(currentContent);
  const compareSections = extractSections(compareContent);
  const titles = Array.from(new Set([...currentSections.map((section) => section.title), ...compareSections.map((section) => section.title)]));

  const sections = titles.map((title) => {
    const current = currentSections.find((section) => section.title === title);
    const compare = compareSections.find((section) => section.title === title);
    const status: InsightSectionDiff["status"] = current?.normalized === compare?.normalized ? "same" : "changed";

    return {
      title,
      status,
      currentPreview: current?.preview || "Sem conteúdo nessa versão.",
      comparePreview: compare?.preview || "Sem conteúdo nessa versão.",
    };
  });

  return {
    changedCount: sections.filter((section) => section.status === "changed").length,
    sections,
  };
}