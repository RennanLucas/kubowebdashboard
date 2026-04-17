import * as XLSX from "xlsx";

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

const csvEscape = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const buildCSV = (rows: Array<Array<string | number>>): string => {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
};

export const exportToCSV = (data: ExportData) => {
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
  const csv = "\ufeff" + sections.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `relatorio-${data.clientName}-${data.dateRange}d.csv`);
};

export const exportToExcel = (data: ExportData) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Métricas Diárias
  const metricsSheet = XLSX.utils.aoa_to_sheet([
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
  ]);
  metricsSheet["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, metricsSheet, "Métricas Diárias");

  // Sheet 2: Fontes de Tráfego
  const trafficSheet = XLSX.utils.aoa_to_sheet([
    ["Fonte", "Visitantes", "Percentual (%)"],
    ...data.trafficSources.map((t) => [t.source, t.visitors, t.percentage]),
  ]);
  trafficSheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, trafficSheet, "Fontes de Tráfego");

  // Sheet 3: Top Pages
  const pagesSheet = XLSX.utils.aoa_to_sheet([
    ["Página", "Caminho", "Visualizações", "Tempo Médio", "Taxa Rejeição (%)"],
    ...data.topPages.map((p) => [p.name, p.path, p.views, p.avgTime, p.bounceRate]),
  ]);
  pagesSheet["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, pagesSheet, "Páginas");

  // Sheet 4: Devices (opcional)
  if (data.devices && data.devices.length > 0) {
    const devSheet = XLSX.utils.aoa_to_sheet([
      ["Dispositivo", "Quantidade", "Percentual (%)"],
      ...data.devices.map((d) => [d.name, d.count, d.percentage]),
    ]);
    devSheet["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, devSheet, "Dispositivos");
  }

  // Sheet 5: Countries (opcional)
  if (data.countries && data.countries.length > 0) {
    const countrySheet = XLSX.utils.aoa_to_sheet([
      ["País", "Quantidade", "Percentual (%)"],
      ...data.countries.map((c) => [c.name, c.count, c.percentage]),
    ]);
    countrySheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, countrySheet, "Países");
  }

  XLSX.writeFile(wb, `relatorio-${data.clientName}-${data.dateRange}d.xlsx`);
};
