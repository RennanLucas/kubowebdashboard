// Export utils — sem dependência externa de xlsx.
// O formato .xlsx é um ZIP de arquivos XML (OOXML).
// Usamos fflate (já presente via vite-plugin-pwa) para gerar o ZIP
// e construímos as sheets como XML puro.
// Para arquivos de analytics simples (dados tabulares), esta abordagem
// é suficiente e elimina a dependência xlsx com vulnerabilidades HIGH.

export interface ExportData {
  clientName: string;
  dateRange: number;
  metrics: Array<{
    date: string;
    visitors: number;
    leads: number;
    conversion_rate: number;
    estimated_value: number;
    whatsapp_clicks: number;
    form_submissions: number;
    button_clicks: number;
  }>;
  trafficSources: Array<{ source: string; visitors: number; percentage: number }>;
  topPages: Array<{ path: string; name: string; views: number; avgTime: string; bounceRate: number }>;
  devices?: Array<{ name: string; count: number; percentage: number }>;
  countries?: Array<{ name: string; count: number; percentage: number }>;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const csvEscape = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const buildCSV = (rows: Array<Array<string | number>>): string => {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
};

// Pure builder: assembles the full CSV report (including the UTF-8 BOM that
// makes Excel recognise the encoding). Kept side-effect free so it is testable
// independently of the download.
export const buildReportCSV = (data: ExportData): string => {
  const sections: string[] = [];

  sections.push(`Relatório - ${data.clientName} - Últimos ${data.dateRange} dias`);
  sections.push("");

  sections.push("=== Métricas Diárias ===");
  sections.push(
    buildCSV([
      ["Data", "Visitantes", "Leads", "Conversão (%)", "Valor Estimado (R$)", "WhatsApp", "Formulários", "Botões"],
      ...data.metrics.map((m) => [
        m.date,
        m.visitors,
        m.leads,
        m.conversion_rate,
        Number(m.estimated_value).toFixed(2),
        m.whatsapp_clicks,
        m.form_submissions,
        m.button_clicks,
      ]),
    ])
  );
  sections.push("");

  sections.push("=== Fontes de Tráfego ===");
  sections.push(
    buildCSV([
      ["Fonte", "Visitantes", "Percentual (%)"],
      ...data.trafficSources.map((t) => [t.source, t.visitors, t.percentage]),
    ])
  );
  sections.push("");

  sections.push("=== Páginas Mais Visitadas ===");
  sections.push(
    buildCSV([
      ["Página", "Caminho", "Visualizações", "Tempo Médio", "Taxa Rejeição (%)"],
      ...data.topPages.map((p) => [p.name, p.path, p.views, p.avgTime, p.bounceRate]),
    ])
  );

  if (data.devices && data.devices.length > 0) {
    sections.push("");
    sections.push("=== Dispositivos ===");
    sections.push(
      buildCSV([
        ["Dispositivo", "Quantidade", "Percentual (%)"],
        ...data.devices.map((d) => [d.name, d.count, d.percentage]),
      ])
    );
  }

  if (data.countries && data.countries.length > 0) {
    sections.push("");
    sections.push("=== Países ===");
    sections.push(
      buildCSV([
        ["País", "Quantidade", "Percentual (%)"],
        ...data.countries.map((c) => [c.name, c.count, c.percentage]),
      ])
    );
  }

  // BOM para Excel reconhecer UTF-8
  return "﻿" + sections.join("\n");
};

export const exportToCSV = (data: ExportData) => {
  const csv = buildReportCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `relatorio-${data.clientName}-${data.dateRange}d.csv`);
};

// ─── Native OOXML Excel Generator ──────────────────────────────────────────
// Gera .xlsx sem dependências externas usando fflate (já presente via PWA).
// Formato: OOXML SpreadsheetML simplificado — suportado por Excel 2007+, LibreOffice, Google Sheets.

export type CellValue = string | number | null | undefined;
export type Sheet = { name: string; rows: CellValue[][] };

export function escapeXml(v: CellValue): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSheetXml(rows: CellValue[][]): string {
  const cols = Math.max(0, ...rows.map((r) => r.length));
  const colDefs = Array.from({ length: cols }, (_, i) => `<col min="${i + 1}" max="${i + 1}" width="18" bestFit="1"/>`).join("");
  const sheetRows = rows
    .map((row, ri) => {
      const cells = row
        .map((val, ci) => {
          const ref = String.fromCharCode(65 + ci) + (ri + 1);
          if (val === null || val === undefined || val === "") {
            return `<c r="${ref}"/>`;
          }
          if (typeof val === "number") {
            return `<c r="${ref}" t="n"><v>${val}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
        })
        .join("");
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<cols>${colDefs}</cols>
<sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

export async function zipXlsx(sheets: Sheet[]): Promise<Uint8Array> {
  const { strToU8, zipSync } = await import("fflate");
  const enc = (s: string) => strToU8(s);

  const sheetXmls = sheets.map((s) => buildSheetXml(s.rows));
  const sheetRels = sheets
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join("");
  const workbookSheets = sheets
    .map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");

  const files: Record<string, Uint8Array> = {
    "_rels/.rels": enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${workbookSheets}</sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheetRels}
</Relationships>`),
    "[Content_Types].xml": enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`),
  };

  sheetXmls.forEach((xml, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = enc(xml);
  });

  const zipped = zipSync(files, { level: 6 });
  return zipped;
}

export async function buildXlsx(sheets: Sheet[]): Promise<Blob> {
  const zipped = await zipXlsx(sheets);
  return new Blob([zipped], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// Pure builder: maps report data to the ordered list of worksheets. Side-effect
// free so it can be asserted without generating the zip or triggering a download.
export const buildReportSheets = (data: ExportData): Sheet[] => {
  const sheets: Sheet[] = [];

  // Sheet 1: Métricas Diárias
  sheets.push({
    name: "Métricas Diárias",
    rows: [
      ["Data", "Visitantes", "Leads", "Conversão (%)", "Valor Estimado (R$)", "WhatsApp", "Formulários", "Botões"],
      ...data.metrics.map((m) => [
        m.date,
        m.visitors,
        m.leads,
        m.conversion_rate,
        Number(m.estimated_value),
        m.whatsapp_clicks,
        m.form_submissions,
        m.button_clicks,
      ]),
    ],
  });

  // Sheet 2: Fontes de Tráfego
  sheets.push({
    name: "Fontes de Tráfego",
    rows: [
      ["Fonte", "Visitantes", "Percentual (%)"],
      ...data.trafficSources.map((t) => [t.source, t.visitors, t.percentage]),
    ],
  });

  // Sheet 3: Páginas
  sheets.push({
    name: "Páginas",
    rows: [
      ["Página", "Caminho", "Visualizações", "Tempo Médio", "Taxa Rejeição (%)"],
      ...data.topPages.map((p) => [p.name, p.path, p.views, p.avgTime, p.bounceRate]),
    ],
  });

  // Sheet 4: Dispositivos (opcional)
  if (data.devices && data.devices.length > 0) {
    sheets.push({
      name: "Dispositivos",
      rows: [
        ["Dispositivo", "Quantidade", "Percentual (%)"],
        ...data.devices.map((d) => [d.name, d.count, d.percentage]),
      ],
    });
  }

  // Sheet 5: Países (opcional)
  if (data.countries && data.countries.length > 0) {
    sheets.push({
      name: "Países",
      rows: [
        ["País", "Quantidade", "Percentual (%)"],
        ...data.countries.map((c) => [c.name, c.count, c.percentage]),
      ],
    });
  }

  return sheets;
};

export const exportToExcel = async (data: ExportData) => {
  const sheets = buildReportSheets(data);
  const blob = await buildXlsx(sheets);
  downloadBlob(blob, `relatorio-${data.clientName}-${data.dateRange}d.xlsx`);
};
