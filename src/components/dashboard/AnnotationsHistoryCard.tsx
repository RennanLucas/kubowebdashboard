import { useMemo, useState } from "react";
import { CalendarDays, Trash2, Filter, Pencil, Download, FileText, FileSpreadsheet } from "lucide-react";
import { AnnotationEditDialog } from "./AnnotationEditDialog";
import type { Annotation } from "@/hooks/useAnnotations";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard } from "./SectionCard";
import { EmptyState } from "./EmptyState";
import { useAnnotations } from "@/hooks/useAnnotations";
import {
  ANNOTATION_CATEGORIES,
  getCategoryMeta,
  type AnnotationCategory,
} from "@/lib/annotation-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportAnnotationsCSV, exportAnnotationsPDF } from "@/lib/annotations-export";
import { toast } from "sonner";

interface Props {
  projectId?: string;
  projectName?: string;
  dateRangeDays: number;
}

export const AnnotationsHistoryCard = ({ projectId, projectName, dateRangeDays }: Props) => {
  const { annotations, loading, remove, update } = useAnnotations(projectId);
  const [filter, setFilter] = useState<AnnotationCategory | "all">("all");
  const [editing, setEditing] = useState<Annotation | null>(null);

  const visible = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - dateRangeDays);
    const sinceKey = since.toISOString().slice(0, 10);
    return annotations
      .filter((a) => a.date >= sinceKey)
      .filter((a) => filter === "all" || a.category === filter);
  }, [annotations, dateRangeDays, filter]);

  return (
    <SectionCard
      icon={<CalendarDays className="h-4 w-4 text-primary" />}
      title="Histórico de eventos e campanhas"
      subtitle={`Anotações dos últimos ${dateRangeDays} dias`}
      tooltip="Marque campanhas, lançamentos e eventos importantes diretamente no gráfico de visitantes. Eles aparecerão aqui e como linhas verticais no chart."
      actions={
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="h-7 text-xs w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {ANNOTATION_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key} className="text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                disabled={visible.length === 0}
              >
                <Download className="h-3 w-3" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  exportAnnotationsCSV({ projectName, periodDays: dateRangeDays, annotations: visible });
                  toast.success(`${visible.length} anotação(ões) exportada(s) em CSV`);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  exportAnnotationsPDF({ projectName, periodDays: dateRangeDays, annotations: visible });
                  toast.success(`${visible.length} anotação(ões) exportada(s) em PDF`);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          title={annotations.length === 0 ? "Nenhuma anotação ainda" : "Nada no período"}
          description={
            annotations.length === 0
              ? "Use o botão Anotar no gráfico de visitantes para marcar campanhas e eventos."
              : "Ajuste o filtro ou mude o intervalo de datas para ver mais anotações."
          }
          className="py-8"
        />
      ) : (
        <ul className="space-y-2 max-h-[320px] overflow-y-auto">
          {visible.map((a) => {
            const meta = getCategoryMeta(a.category);
            const dateLabel = format(parseISO(a.date), "dd 'de' MMM, yyyy", { locale: ptBR });
            return (
              <li
                key={a.id}
                className="group rounded-lg border border-border/60 bg-background p-3 hover:border-border transition-colors"
                style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        <span>{meta.emoji}</span>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {dateLabel}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1 leading-snug">
                      {a.label}
                    </p>
                    {a.notes && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                        {a.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(a)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      aria-label="Editar anotação"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(a.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Remover anotação"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AnnotationEditDialog
        annotation={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSave={update}
      />
    </SectionCard>
  );
};
