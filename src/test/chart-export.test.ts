import { describe, it, expect } from "vitest";
import { buildExportFilename } from "@/lib/chart-export";

describe("buildExportFilename", () => {
  it("slugifies a plain title and appends range + extension", () => {
    expect(buildExportFilename("Visitantes Unicos", 30, "png")).toBe("visitantes-unicos-30d.png");
  });

  it("strips Portuguese accents and cedilla", () => {
    expect(buildExportFilename("Conversão por Ação", 7, "csv")).toBe("conversao-por-acao-7d.csv");
  });

  it("collapses runs of special characters into single hyphens and trims edges", () => {
    expect(buildExportFilename("Vendas / Mês (R$)", 30, "png")).toBe("vendas-mes-r-30d.png");
  });

  it("falls back to 'grafico' when the title has no alphanumeric characters", () => {
    expect(buildExportFilename("!!!", 30, "png")).toBe("grafico-30d.png");
    expect(buildExportFilename("", 14, "csv")).toBe("grafico-14d.csv");
  });

  it("carries the date range and extension through verbatim", () => {
    expect(buildExportFilename("X", 90, "csv")).toBe("x-90d.csv");
  });
});
