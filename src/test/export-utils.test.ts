// @vitest-environment node
// Pure serialization logic — no DOM needed. Runs in the node environment so
// fflate's zip round-trip is exercised against real Node buffers (jsdom's
// polyfills corrupt the unzip round-trip).
import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import {
  csvEscape,
  buildCSV,
  buildReportCSV,
  escapeXml,
  buildSheetXml,
  zipXlsx,
  buildXlsx,
  buildReportSheets,
  type ExportData,
} from "@/lib/export-utils";

function sampleData(overrides: Partial<ExportData> = {}): ExportData {
  return {
    clientName: "Acme",
    dateRange: 30,
    metrics: [
      {
        date: "2026-08-01",
        visitors: 100,
        leads: 5,
        conversion_rate: 5,
        estimated_value: 1234.5,
        whatsapp_clicks: 3,
        form_submissions: 1,
        button_clicks: 1,
      },
    ],
    trafficSources: [{ source: "Google", visitors: 80, percentage: 80 }],
    topPages: [{ path: "/home", name: "Home", views: 200, avgTime: "1m30s", bounceRate: 40 }],
    ...overrides,
  };
}

describe("csvEscape", () => {
  it("returns empty string for null/undefined", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("passes through plain values unchanged", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape(42)).toBe("42");
  });

  it("quotes and escapes values containing separators or quotes", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape("a;b")).toBe('"a;b"');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });
});

describe("buildCSV", () => {
  it("joins cells with commas and rows with newlines", () => {
    expect(buildCSV([["a", "b"], ["c", "d"]])).toBe("a,b\nc,d");
  });

  it("applies escaping per cell", () => {
    expect(buildCSV([["x,y", 1]])).toBe('"x,y",1');
  });
});

describe("buildReportCSV", () => {
  it("starts with a UTF-8 BOM", () => {
    const csv = buildReportCSV(sampleData());
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("includes the title and core section headers", () => {
    const csv = buildReportCSV(sampleData());
    expect(csv).toContain("Relatório - Acme - Últimos 30 dias");
    expect(csv).toContain("=== Métricas Diárias ===");
    expect(csv).toContain("=== Fontes de Tráfego ===");
    expect(csv).toContain("=== Páginas Mais Visitadas ===");
  });

  it("formats estimated_value with two decimals", () => {
    const csv = buildReportCSV(sampleData());
    expect(csv).toContain("1234.50");
  });

  it("omits optional sections when data is absent", () => {
    const csv = buildReportCSV(sampleData());
    expect(csv).not.toContain("=== Dispositivos ===");
    expect(csv).not.toContain("=== Países ===");
  });

  it("includes optional sections when data is present", () => {
    const csv = buildReportCSV(
      sampleData({
        devices: [{ name: "Mobile", count: 60, percentage: 60 }],
        countries: [{ name: "Brasil", count: 90, percentage: 90 }],
      }),
    );
    expect(csv).toContain("=== Dispositivos ===");
    expect(csv).toContain("=== Países ===");
    expect(csv).toContain("Mobile");
    expect(csv).toContain("Brasil");
  });
});

describe("escapeXml", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeXml(null)).toBe("");
    expect(escapeXml(undefined)).toBe("");
  });

  it("escapes all five XML special characters", () => {
    expect(escapeXml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&apos;");
  });

  it("stringifies numbers", () => {
    expect(escapeXml(123)).toBe("123");
  });
});

describe("buildSheetXml", () => {
  it("emits a valid worksheet XML header", () => {
    const xml = buildSheetXml([["a"]]);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<worksheet");
    expect(xml).toContain("<sheetData>");
  });

  it("renders numbers as numeric cells", () => {
    const xml = buildSheetXml([[42]]);
    expect(xml).toContain('<c r="A1" t="n"><v>42</v></c>');
  });

  it("renders strings as inline string cells", () => {
    const xml = buildSheetXml([["hello"]]);
    expect(xml).toContain('<c r="A1" t="inlineStr"><is><t>hello</t></is></c>');
  });

  it("renders empty/null cells as self-closing", () => {
    const xml = buildSheetXml([["", null]]);
    expect(xml).toContain('<c r="A1"/>');
    expect(xml).toContain('<c r="B1"/>');
  });

  it("escapes special characters inside string cells", () => {
    const xml = buildSheetXml([["a & b <c>"]]);
    expect(xml).toContain("a &amp; b &lt;c&gt;");
  });

  it("increments cell references across columns and rows", () => {
    const xml = buildSheetXml([["a", "b"], ["c"]]);
    expect(xml).toContain('r="A1"');
    expect(xml).toContain('r="B1"');
    expect(xml).toContain('r="A2"');
    expect(xml).toContain('<row r="1">');
    expect(xml).toContain('<row r="2">');
  });
});

describe("buildReportSheets", () => {
  it("returns the three base sheets by default", () => {
    const sheets = buildReportSheets(sampleData());
    expect(sheets.map((s) => s.name)).toEqual([
      "Métricas Diárias",
      "Fontes de Tráfego",
      "Páginas",
    ]);
  });

  it("appends optional sheets when devices/countries are present", () => {
    const sheets = buildReportSheets(
      sampleData({
        devices: [{ name: "Mobile", count: 60, percentage: 60 }],
        countries: [{ name: "Brasil", count: 90, percentage: 90 }],
      }),
    );
    expect(sheets.map((s) => s.name)).toEqual([
      "Métricas Diárias",
      "Fontes de Tráfego",
      "Páginas",
      "Dispositivos",
      "Países",
    ]);
  });

  it("puts a header row first in each sheet", () => {
    const sheets = buildReportSheets(sampleData());
    expect(sheets[0].rows[0]).toContain("Data");
    expect(sheets[1].rows[0]).toContain("Fonte");
  });
});

describe("zipXlsx / buildXlsx", () => {
  it("produces a valid OOXML zip with the expected parts", async () => {
    const zipped = await zipXlsx([
      { name: "S1", rows: [["a", 1]] },
      { name: "S2", rows: [["b"]] },
    ]);
    const files = unzipSync(zipped);
    const names = Object.keys(files);

    expect(names).toContain("[Content_Types].xml");
    expect(names).toContain("_rels/.rels");
    expect(names).toContain("xl/workbook.xml");
    expect(names).toContain("xl/worksheets/sheet1.xml");
    expect(names).toContain("xl/worksheets/sheet2.xml");

    const workbook = strFromU8(files["xl/workbook.xml"]);
    expect(workbook).toContain('name="S1"');
    expect(workbook).toContain('name="S2"');
  });

  it("escapes sheet names in the workbook", async () => {
    const zipped = await zipXlsx([{ name: "A & B", rows: [["x"]] }]);
    const files = unzipSync(zipped);
    const workbook = strFromU8(files["xl/workbook.xml"]);
    expect(workbook).toContain("A &amp; B");
  });

  it("wraps the zip in a Blob with the spreadsheet mime type", async () => {
    const blob = await buildXlsx([{ name: "S1", rows: [["a"]] }]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("spreadsheetml");
    expect(blob.size).toBeGreaterThan(0);
  });
});
