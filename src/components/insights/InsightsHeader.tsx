import { Sparkles, Loader2, RefreshCw, Download, FileText, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InsightsHeaderProps {
  periodDays: 7 | 30;
  onPeriodChange: (days: 7 | 30) => void;
  analysis: string;
  generating: boolean;
  isLoading: boolean;
  exporting: boolean;
  onGenerate: () => void;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
}

export function InsightsHeader({
  periodDays,
  onPeriodChange,
  analysis,
  generating,
  isLoading,
  exporting,
  onGenerate,
  onExportPDF,
  onExportMarkdown,
}: InsightsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Insights com IA
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Ao gerar a análise, a IA cruza os dados dos últimos {periodDays} dias e monta um relatório com insights, riscos, oportunidades e ações sugeridas.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 self-stretch sm:self-auto">
          {[7, 30].map((days) => {
            const isActive = periodDays === days;
            return (
              <Button
                key={days}
                type="button"
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onPeriodChange(days as 7 | 30)}
                disabled={generating || isLoading}
                className="flex-1 sm:flex-none min-w-12"
              >
                {days}d
              </Button>
            );
          })}
        </div>
        {analysis && !generating && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting} className="w-full justify-center gap-2 sm:w-auto">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
                <FileType className="h-4 w-4" />
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportMarkdown} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Exportar como Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button onClick={onGenerate} disabled={generating || isLoading} className="w-full justify-center gap-2 sm:w-auto">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {generating ? "Atualizando..." : analysis ? "Atualizar com IA" : "Gerar com IA"}
        </Button>
      </div>
    </div>
  );
}
