import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Annotation } from "@/hooks/useAnnotations";
import { getCategoryMeta } from "@/lib/annotation-categories";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const csvEscape = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export interface AnnotationsExportContext {
  projectName?: string;
  periodDays: number;
  annotations: Annotation[];
}

const fileBase = (ctx: AnnotationsExportContext) => {
  const slug = (ctx.projectName ?? "projeto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `anotacoes-${slug}-${ctx.periodDays}d`;
};

export const exportAnnotationsCSV = (ctx: AnnotationsExportContext) => {
  const headerLines = [
    `Anotações - ${ctx.projectName ?? "Projeto"} - Últimos ${ctx.periodDays} dias`,
    `Total: ${ctx.annotations.length}`,
    "",
  ];
  const rows: Array<Array<string>> = [
    ["Data", "Categoria", "Rótulo", "Notas"],
    ...ctx.annotations.map((a) => [
      a.date,
      getCategoryMeta(a.category).label,
      a.label,
      a.notes ?? "",
    ]),
  ];
  const csv =
    "\ufeff" +
    headerLines.join("\n") +
    rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${fileBase(ctx)}.csv`);
};

export const exportAnnotationsPDF = (ctx: AnnotationsExportContext) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Histórico de eventos e campanhas", marginX, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `${ctx.projectName ?? "Projeto"}  •  Últimos ${ctx.periodDays} dias  •  ${ctx.annotations.length} anotação(ões)`,
    marginX,
    y,
  );
  y += 8;
  doc.text(`Exportado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, marginX, y);
  y += 18;

  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 18;

  doc.setTextColor(0);

  if (ctx.annotations.length === 0) {
    doc.setFontSize(11);
    doc.text("Nenhuma anotação encontrada no período selecionado.", marginX, y);
  } else {
    const sorted = [...ctx.annotations].sort((a, b) => (a.date < b.date ? 1 : -1));
    sorted.forEach((a) => {
      const meta = getCategoryMeta(a.category);
      const dateLabel = format(parseISO(a.date), "dd 'de' MMM, yyyy", { locale: ptBR });

      const labelLines = doc.splitTextToSize(a.label, pageWidth - marginX * 2);
      const noteLines = a.notes ? doc.splitTextToSize(a.notes, pageWidth - marginX * 2) : [];
      const blockHeight = 16 + labelLines.length * 14 + (noteLines.length ? 4 + noteLines.length * 12 : 0) + 14;

      if (y + blockHeight > pageHeight - 50) {
        doc.addPage();
        y = 50;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${meta.label.toUpperCase()}  •  ${dateLabel}`, marginX, y);
      y += 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(labelLines, marginX, y);
      y += labelLines.length * 14;

      if (noteLines.length) {
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(noteLines, marginX, y);
        y += noteLines.length * 12;
      }

      y += 8;
      doc.setDrawColor(235);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 12;
    });
  }

  // Footer with page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${total}`, pageWidth - marginX, pageHeight - 24, { align: "right" });
  }

  doc.save(`${fileBase(ctx)}.pdf`);
};
