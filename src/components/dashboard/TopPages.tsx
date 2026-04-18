import { FileText } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface PageData {
  path: string;
  name: string;
  views: number;
  avgTime: string;
  bounceRate: number;
}

const TopPages = ({ pages }: { pages: PageData[] }) => (
  <div className="glass-card p-5 sm:p-6">
    <div className="mb-4">
      <div className="flex items-center gap-1.5">
        <h3 className="section-title">Páginas Mais Visitadas</h3>
        <InfoTooltip content={
          <div className="space-y-1">
            <p>Ranking das páginas mais acessadas do seu site.</p>
            <p><strong>Tempo Médio:</strong> quanto tempo o visitante fica na página.</p>
            <p><strong>Rejeição:</strong> % que sai sem visitar outras páginas. Acima de 40% pode indicar conteúdo pouco relevante.</p>
          </div>
        } />
      </div>
      <p className="section-subtitle">Top {pages.length || 0} páginas por visualizações</p>
    </div>

    {pages.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/70 flex items-center justify-center mb-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Sem páginas registradas ainda</p>
        <p className="text-xs text-muted-foreground mt-1">Os dados aparecem assim que houver visitas.</p>
      </div>
    ) : (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left pb-2.5 px-1 font-semibold">Página</th>
              <th className="text-right pb-2.5 px-1 font-semibold">Visitas</th>
              <th className="text-right pb-2.5 px-1 font-semibold hidden sm:table-cell">Tempo</th>
              <th className="text-right pb-2.5 px-1 font-semibold hidden sm:table-cell">Rejeição</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr
                key={page.path}
                className="border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-muted/40"
              >
                <td className="py-3 px-1">
                  <p className="text-sm font-medium text-card-foreground truncate max-w-[200px]">{page.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{page.path}</p>
                </td>
                <td className="text-right text-sm font-semibold text-card-foreground px-1 tabular-nums">
                  {page.views.toLocaleString("pt-BR")}
                </td>
                <td className="text-right text-sm text-muted-foreground hidden sm:table-cell px-1 tabular-nums">
                  {page.avgTime}
                </td>
                <td className="text-right text-sm hidden sm:table-cell px-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                    page.bounceRate > 40
                      ? "bg-destructive/10 text-destructive"
                      : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                  }`}>
                    {page.bounceRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default TopPages;
