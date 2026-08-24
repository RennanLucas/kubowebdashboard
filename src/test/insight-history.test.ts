import { describe, it, expect } from "vitest";
import { compareInsightVersions } from "@/lib/insight-history";

describe("compareInsightVersions", () => {
  it("marks every section 'same' and reports zero changes for identical content", () => {
    const content = "## Resumo\nVocê teve 50 vendas\n## Tráfego\nGoogle liderou";
    const result = compareInsightVersions(content, content);

    expect(result.changedCount).toBe(0);
    expect(result.sections.every((s) => s.status === "same")).toBe(true);
    expect(result.sections.map((s) => s.title)).toEqual(["Resumo", "Tráfego"]);
  });

  it("flags only the sections whose normalized text differs", () => {
    const current = "## Resumo\nVocê teve 50 vendas\n## Tráfego\nGoogle liderou";
    const compare = "## Resumo\nVocê teve 80 vendas\n## Tráfego\nGoogle liderou";
    const result = compareInsightVersions(current, compare);

    expect(result.changedCount).toBe(1);
    expect(result.sections.find((s) => s.title === "Resumo")?.status).toBe("changed");
    expect(result.sections.find((s) => s.title === "Tráfego")?.status).toBe("same");
  });

  it("ignores markdown formatting differences when diffing", () => {
    // Only bold markers differ; normalize() strips `*` so the text is equal.
    const current = "## Resumo\nVocê teve **50** vendas";
    const compare = "## Resumo\nVocê teve 50 vendas";
    const result = compareInsightVersions(current, compare);

    expect(result.changedCount).toBe(0);
    expect(result.sections[0].status).toBe("same");
  });

  it("puts leading content (before any heading) under the default 'Resumo' section", () => {
    const result = compareInsightVersions("linha solta sem cabeçalho", "linha solta sem cabeçalho");

    expect(result.sections[0].title).toBe("Resumo");
    expect(result.sections[0].status).toBe("same");
  });

  it("treats a section present in only one version as changed, with a placeholder", () => {
    const current = "## Alpha\nconteúdo A";
    const compare = "## Beta\nconteúdo B";
    const result = compareInsightVersions(current, compare);

    expect(result.changedCount).toBe(2);

    const alpha = result.sections.find((s) => s.title === "Alpha");
    expect(alpha?.status).toBe("changed");
    expect(alpha?.comparePreview).toBe("Sem conteúdo nessa versão.");

    const beta = result.sections.find((s) => s.title === "Beta");
    expect(beta?.currentPreview).toBe("Sem conteúdo nessa versão.");
  });

  it("shows a placeholder preview for an empty section body", () => {
    const content = "## Vazio\n## Cheio\ntem texto";
    const result = compareInsightVersions(content, content);

    expect(result.sections.find((s) => s.title === "Vazio")?.currentPreview).toBe(
      "Sem conteúdo relevante nesta seção.",
    );
  });

  it("truncates long section previews to 180 chars with an ellipsis", () => {
    const body = "palavra ".repeat(60).trim(); // ~480 chars, no markdown
    const content = `## Longo\n${body}`;
    const result = compareInsightVersions(content, content);

    const longo = result.sections.find((s) => s.title === "Longo");
    expect(longo?.currentPreview.length).toBeLessThanOrEqual(180);
    expect(longo?.currentPreview.endsWith("…")).toBe(true);
  });
});
