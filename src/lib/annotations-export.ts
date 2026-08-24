// jspdf é importado dinamicamente dentro de exportAnnotationsPDF para
// evitar carregar ~137KB no bundle inicial.
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

// Cópia local de propósito: importar de export-utils arrastaria fflate para o
// chunk deste componente. A paridade com export-utils.csvEscape é garantida
// por teste (annotations-export.test.ts).
export const csvEscape = (val: unknown): string => {
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

export const annotationsFileBase = (ctx: AnnotationsExportContext) => {
  const slug = (ctx.projectName ?? "projeto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `anotacoes-${slug}-${ctx.periodDays}d`;
};

// Builder puro: monta o CSV completo (incluindo o BOM UTF-8 que faz o Excel
// reconhecer a codificação). Sem efeito colateral, para ser testável sem DOM.
export const buildAnnotationsCSV = (ctx: AnnotationsExportContext): string => {
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
  return (
    "\ufeff" +
    headerLines.join("\n") +
    rows.map((r) => r.map(csvEscape).join(",")).join("\n")
  );
};

export const exportAnnotationsCSV = (ctx: AnnotationsExportContext) => {
  downloadBlob(
    new Blob([buildAnnotationsCSV(ctx)], { type: "text/csv;charset=utf-8;" }),
    `${annotationsFileBase(ctx)}.csv`,
  );
};

// `now` é injetável para deixar o cabeçalho "Exportado em" determinístico nos
// testes; em produção os callers usam o default.
export const exportAnnotationsPDF = async (
  ctx: AnnotationsExportContext,
  now: Date = new Date(),
) => {
  const { default: jsPDF } = await import("jspdf");
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
  doc.text(`Exportado em ${format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}`, marginX, y);
  y += 18;

  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 18;

  doc.setTextColor(0);

  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 50;

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 50;
    }
  };

  const writeLines = (lines: string[], lineHeight: number) => {
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, marginX, y);
      y += lineHeight;
    }
  };

  if (ctx.annotations.length === 0) {
    doc.setFontSize(11);
    doc.text("Nenhuma anotação encontrada no período selecionado.", marginX, y);
  } else {
    const sorted = [...ctx.annotations].sort((a, b) => (a.date < b.date ? 1 : -1));
    sorted.forEach((a, idx) => {
      const meta = getCategoryMeta(a.category);
      const dateLabel = format(parseISO(a.date), "dd 'de' MMM, yyyy", { locale: ptBR });

      // Header line for the entry
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120);
      const headerLine = `${meta.label.toUpperCase()}  •  ${dateLabel}`;
      // Keep header + at least one line of label together
      ensureSpace(14 + 14);
      doc.text(headerLine, marginX, y);
      y += 14;

      // Label (bold 11pt) — split AFTER setting font so wrapping uses correct metrics
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      const labelLines = doc.splitTextToSize(a.label, contentWidth) as string[];
      writeLines(labelLines, 14);

      // Notes (normal 10pt)
      if (a.notes) {
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80);
        const noteLines = doc.splitTextToSize(a.notes, contentWidth) as string[];
        writeLines(noteLines, 12);
      }

      // Divider between entries (skip after the last)
      if (idx < sorted.length - 1) {
        y += 8;
        ensureSpace(12);
        doc.setDrawColor(235);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 12;
      }
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

  doc.save(`${annotationsFileBase(ctx)}.pdf`);
};
