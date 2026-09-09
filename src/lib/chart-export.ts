// html2canvas é importado dinamicamente para não ser incluído no bundle inicial.
// Isso reduz ~48 KB gzip do carregamento da página — só é carregado quando o usuário
// efetivamente exporta um chart.

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const csvEscape = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  return /[",\n;]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
};

export const downloadCsv = (rows: Array<Array<string | number>>, filename: string) => {
  const csv = "\ufeff" + rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
};

export const exportElementAsPng = async (element: HTMLElement, filename: string) => {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: Math.min(window.devicePixelRatio || 2, 3),
    useCORS: true,
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

  if (!blob) throw new Error("Não foi possível gerar a imagem");
  downloadBlob(blob, filename);
};

export const buildExportFilename = (title: string, dateRangeDays: number, extension: "png" | "csv") => {
  const base = slugify(title) || "grafico";
  return `${base}-${dateRangeDays}d.${extension}`;
};