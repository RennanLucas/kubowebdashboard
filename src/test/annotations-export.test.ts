import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  csvEscape,
  buildAnnotationsCSV,
  annotationsFileBase,
  exportAnnotationsCSV,
  exportAnnotationsPDF,
  type AnnotationsExportContext,
} from "@/lib/annotations-export";
import { csvEscape as exportUtilsCsvEscape } from "@/lib/export-utils";
import type { Annotation } from "@/hooks/useAnnotations";

// Fake jsPDF: records every draw call so the layout/pagination decisions in
// exportAnnotationsPDF become assertable without producing a real PDF.
const pdf = vi.hoisted(() => {
  interface TextOp {
    text: string;
    x: number;
    y: number;
    page: number;
    align?: string;
  }
  const instances: FakeJsPDF[] = [];

  class FakeJsPDF {
    texts: TextOp[] = [];
    lines: Array<{ y: number; page: number }> = [];
    saved: string | null = null;
    pages = 1;
    page = 1;
    internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } };

    constructor(public opts: unknown) {
      instances.push(this);
    }

    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setDrawColor() {}

    text(text: string, x: number, y: number, opts?: { align?: string }) {
      this.texts.push({ text, x, y, page: this.page, align: opts?.align });
    }

    line(_x1: number, y1: number) {
      this.lines.push({ y: y1, page: this.page });
    }

    addPage() {
      this.pages += 1;
      this.page = this.pages;
    }

    getNumberOfPages() {
      return this.pages;
    }

    setPage(i: number) {
      this.page = i;
    }

    // Deterministic wrapping: 60 chars per line regardless of the real metrics.
    splitTextToSize(text: string) {
      const out: string[] = [];
      for (let i = 0; i < text.length; i += 60) out.push(text.slice(i, i + 60));
      return out.length ? out : [""];
    }

    save(name: string) {
      this.saved = name;
    }
  }

  return { instances, FakeJsPDF };
});

vi.mock("jspdf", () => ({ default: pdf.FakeJsPDF }));

const BOM = "﻿";
const FIXED_NOW = new Date(2026, 2, 15, 14, 5);

function annotation(over: Partial<Annotation> = {}): Annotation {
  return {
    id: "a1",
    date: "2026-03-01",
    label: "Black Friday",
    category: "campaign",
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    ...over,
  };
}

function ctx(over: Partial<AnnotationsExportContext> = {}): AnnotationsExportContext {
  return { projectName: "Acme", periodDays: 30, annotations: [annotation()], ...over };
}

describe("csvEscape", () => {
  it("returns empty string for null/undefined", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("quotes values containing separators, newlines or quotes", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape("a;b")).toBe('"a;b"');
    expect(csvEscape("l1\nl2")).toBe('"l1\nl2"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("plain")).toBe("plain");
  });

  // annotations-export keeps its own copy so the annotations chunk doesn't pull
  // in fflate via export-utils. This guards the two copies against drift.
  it("stays in parity with the export-utils copy", () => {
    const samples = [null, undefined, "", "plain", 42, "a,b", "a;b", 'q"q', "l1\nl2", "ç ã"];
    for (const s of samples) {
      expect(csvEscape(s)).toBe(exportUtilsCsvEscape(s));
    }
  });
});

describe("annotationsFileBase", () => {
  it("slugifies the project name and appends the period", () => {
    expect(annotationsFileBase(ctx({ projectName: "Acme Corp" }))).toBe("anotacoes-acme-corp-30d");
    expect(annotationsFileBase(ctx({ projectName: "Loja do João!", periodDays: 7 }))).toBe(
      "anotacoes-loja-do-jo-o-7d",
    );
  });

  it("trims leading/trailing separators produced by the slug", () => {
    expect(annotationsFileBase(ctx({ projectName: "  --Acme--  " }))).toBe("anotacoes-acme-30d");
  });

  it("falls back to 'projeto' when there is no project name", () => {
    expect(annotationsFileBase(ctx({ projectName: undefined, periodDays: 90 }))).toBe(
      "anotacoes-projeto-90d",
    );
  });
});

describe("buildAnnotationsCSV", () => {
  it("starts with the UTF-8 BOM so Excel detects the encoding", () => {
    expect(buildAnnotationsCSV(ctx()).startsWith(BOM)).toBe(true);
  });

  it("writes the title, total and table header", () => {
    const lines = buildAnnotationsCSV(ctx({ annotations: [annotation(), annotation({ id: "a2" })] }))
      .slice(BOM.length)
      .split("\n");
    expect(lines[0]).toBe("Anotações - Acme - Últimos 30 dias");
    expect(lines[1]).toBe("Total: 2");
    // The trailing "" in the header block only contributes a line break, so the
    // table header follows immediately — there is no blank separator row.
    expect(lines[2]).toBe("Data,Categoria,Rótulo,Notas");
  });

  it("falls back to 'Projeto' in the title when the name is missing", () => {
    expect(buildAnnotationsCSV(ctx({ projectName: undefined }))).toContain(
      "Anotações - Projeto - Últimos 30 dias",
    );
  });

  it("maps the category key to its human label", () => {
    const csv = buildAnnotationsCSV(
      ctx({
        annotations: [
          annotation({ category: "campaign" }),
          annotation({ id: "a2", category: "launch" }),
          annotation({ id: "a3", category: "event" }),
          annotation({ id: "a4", category: "other" }),
        ],
      }),
    );
    expect(csv).toContain(",Campanha,");
    expect(csv).toContain(",Lançamento,");
    expect(csv).toContain(",Evento,");
    expect(csv).toContain(",Outro,");
  });

  it("falls back to 'Outro' for an unknown category", () => {
    const csv = buildAnnotationsCSV(
      ctx({ annotations: [annotation({ category: "bogus" as Annotation["category"] })] }),
    );
    expect(csv).toContain(",Outro,");
  });

  it("emits null notes as an empty field", () => {
    const rows = buildAnnotationsCSV(ctx({ annotations: [annotation({ notes: null })] })).split("\n");
    expect(rows[rows.length - 1]).toBe("2026-03-01,Campanha,Black Friday,");
  });

  it("escapes labels and notes that contain separators", () => {
    const csv = buildAnnotationsCSV(
      ctx({
        annotations: [annotation({ label: "Promo, 50% off", notes: 'ele disse "vai"' })],
      }),
    );
    expect(csv).toContain('"Promo, 50% off"');
    expect(csv).toContain('"ele disse ""vai"""');
  });

  it("emits header-only output when there are no annotations", () => {
    const lines = buildAnnotationsCSV(ctx({ annotations: [] })).slice(BOM.length).split("\n");
    expect(lines[1]).toBe("Total: 0");
    expect(lines[2]).toBe("Data,Categoria,Rótulo,Notas");
    expect(lines).toHaveLength(3);
  });
});

describe("exportAnnotationsCSV", () => {
  let anchor: HTMLAnchorElement;
  let createElement: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    const realCreateElement = document.createElement.bind(document);
    createElement = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = realCreateElement(tag) as HTMLAnchorElement;
      // Anchor clicks would trigger jsdom's unimplemented navigation.
      el.click = vi.fn();
      anchor = el;
      return el;
    });
  });

  afterEach(() => {
    createElement.mockRestore();
    vi.restoreAllMocks();
  });

  it("downloads a .csv named after the project and period", async () => {
    exportAnnotationsCSV(ctx({ projectName: "Acme Corp", periodDays: 7 }));
    expect(anchor.download).toBe("anotacoes-acme-corp-7d.csv");
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("hands the built CSV to the blob", async () => {
    const blobArg = vi.mocked(URL.createObjectURL);
    exportAnnotationsCSV(ctx());
    const blob = blobArg.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");
    // jsdom 20's Blob has no .text(), so read it through FileReader — which
    // strips the BOM as part of the UTF-8 decode, hence the slice.
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(text).toBe(buildAnnotationsCSV(ctx()).slice(BOM.length));
  });
});

describe("exportAnnotationsPDF", () => {
  beforeEach(() => {
    pdf.instances.length = 0;
  });

  const doc = () => pdf.instances[0];
  const textsOn = (page: number) => doc().texts.filter((t) => t.page === page).map((t) => t.text);
  // Entry headers are "CATEGORY  •  date"; the metadata line starts with the
  // project name, so an uppercase-only prefix isolates the entries.
  const entryHeaders = () => doc().texts.filter((t) => /^\p{Lu}+\s+•/u.test(t.text)).map((t) => t.text);

  it("saves a .pdf named after the project and period", async () => {
    await exportAnnotationsPDF(ctx({ projectName: "Acme Corp", periodDays: 90 }), FIXED_NOW);
    expect(doc().saved).toBe("anotacoes-acme-corp-90d.pdf");
  });

  it("writes the title and the metadata line", async () => {
    await exportAnnotationsPDF(ctx({ annotations: [annotation(), annotation({ id: "a2" })] }), FIXED_NOW);
    const texts = textsOn(1);
    expect(texts[0]).toBe("Histórico de eventos e campanhas");
    expect(texts[1]).toBe("Acme  •  Últimos 30 dias  •  2 anotação(ões)");
  });

  it("stamps the export time from the injected clock", async () => {
    await exportAnnotationsPDF(ctx(), FIXED_NOW);
    expect(textsOn(1)).toContain("Exportado em 15/03/2026 14:05");
  });

  it("renders the empty state and draws no entry dividers", async () => {
    await exportAnnotationsPDF(ctx({ annotations: [] }), FIXED_NOW);
    expect(textsOn(1)).toContain("Nenhuma anotação encontrada no período selecionado.");
    // Only the rule under the header.
    expect(doc().lines).toHaveLength(1);
  });

  it("sorts entries by date descending without mutating the input", async () => {
    const annotations = [
      annotation({ id: "old", date: "2026-01-05", category: "event" }),
      annotation({ id: "new", date: "2026-03-20", category: "launch" }),
      annotation({ id: "mid", date: "2026-02-10", category: "campaign" }),
    ];
    await exportAnnotationsPDF(ctx({ annotations }), FIXED_NOW);
    const headers = entryHeaders();
    expect(headers[0]).toContain("LANÇAMENTO");
    expect(headers[1]).toContain("CAMPANHA");
    expect(headers[2]).toContain("EVENTO");
    expect(annotations.map((a) => a.id)).toEqual(["old", "new", "mid"]);
  });

  it("draws one divider between entries plus the header rule", async () => {
    await exportAnnotationsPDF(
      ctx({
        annotations: [
          annotation({ id: "a1", date: "2026-03-03" }),
          annotation({ id: "a2", date: "2026-03-02" }),
          annotation({ id: "a3", date: "2026-03-01" }),
        ],
      }),
      FIXED_NOW,
    );
    expect(doc().lines).toHaveLength(3);
  });

  it("renders notes only when present", async () => {
    await exportAnnotationsPDF(
      ctx({ annotations: [annotation({ notes: "investir mais em ads" })] }),
      FIXED_NOW,
    );
    expect(textsOn(1)).toContain("investir mais em ads");

    pdf.instances.length = 0;
    await exportAnnotationsPDF(ctx({ annotations: [annotation({ notes: null })] }), FIXED_NOW);
    expect(textsOn(1).join("|")).not.toContain("investir mais em ads");
  });

  it("wraps long labels into multiple lines", async () => {
    const label = "L".repeat(150);
    await exportAnnotationsPDF(ctx({ annotations: [annotation({ label })] }), FIXED_NOW);
    const chunks = doc().texts.filter((t) => /^L+$/.test(t.text));
    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.text).join("")).toBe(label);
  });

  it("paginates and stamps a right-aligned page footer on every page", async () => {
    const annotations = Array.from({ length: 30 }, (_, i) =>
      annotation({ id: `a${i}`, date: `2026-03-${String(30 - i).padStart(2, "0")}` }),
    );
    await exportAnnotationsPDF(ctx({ annotations }), FIXED_NOW);

    const total = doc().pages;
    expect(total).toBeGreaterThan(1);

    const footers = doc().texts.filter((t) => t.text.startsWith("Página "));
    expect(footers).toHaveLength(total);
    for (let i = 1; i <= total; i++) {
      const footer = footers.find((f) => f.page === i);
      expect(footer?.text).toBe(`Página ${i} de ${total}`);
      expect(footer?.align).toBe("right");
    }
  });

  it("keeps entry content within the page bottom limit", async () => {
    const annotations = Array.from({ length: 30 }, (_, i) =>
      annotation({ id: `a${i}`, date: `2026-03-${String(30 - i).padStart(2, "0")}` }),
    );
    await exportAnnotationsPDF(ctx({ annotations }), FIXED_NOW);
    const bottomLimit = 842 - 50;
    const entryTexts = doc().texts.filter((t) => !t.text.startsWith("Página "));
    for (const t of entryTexts) {
      expect(t.y).toBeLessThanOrEqual(bottomLimit);
    }
  });
});
