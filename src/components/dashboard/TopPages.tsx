import { FileText } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface PageData {
  path: string;
  name: string;
  views: number;
  avgTime: string;
  bounceRate: number;
}

const TopPages = ({ pages }: { pages: PageData[] }) => (
  <SectionCard
    title="Páginas Mais Visitadas"
    subtitle={`Top ${pages.length || 0} páginas por visualizações`}
    tooltip={
      <div className="space-y-1">
        <p>Ranking das páginas mais acessadas do seu site.</p>
        <p><strong>Tempo Médio:</strong> quanto tempo o visitante fica na página.</p>
        <p><strong>Rejeição:</strong> % que sai sem visitar outras páginas. Acima de 40% pode indicar conteúdo pouco relevante.</p>
      </div>
    }
  >
    {pages.length === 0 ? (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="Sem páginas registradas ainda"
        description="Os dados aparecem assim que houver visitas."
      />
    ) : (
      <div className="-mx-5 sm:mx-0 overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        <table className="w-full min-w-[480px] px-5 sm:min-w-0 sm:px-0">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left pb-2.5 pl-5 pr-2 sm:pl-1 font-semibold sticky left-0 bg-card z-10">Página</th>
              <th className="text-right pb-2.5 px-2 sm:px-1 font-semibold whitespace-nowrap">Visitas</th>
              <th className="text-right pb-2.5 px-2 sm:px-1 font-semibold whitespace-nowrap">Tempo</th>
              <th className="text-right pb-2.5 pl-2 pr-5 sm:pr-1 font-semibold whitespace-nowrap">Rejeição</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr
                key={page.path}
                className="border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-muted/40"
              >
                <td className="py-3 pl-5 pr-2 sm:pl-1 sticky left-0 bg-card z-10">
                  <p className="text-sm font-medium text-card-foreground truncate max-w-[180px] sm:max-w-[240px]">{page.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[240px]">{page.path}</p>
                </td>
                <td className="text-right text-sm font-semibold text-card-foreground px-2 sm:px-1 tabular-nums whitespace-nowrap">
                  {page.views.toLocaleString("pt-BR")}
                </td>
                <td className="text-right text-sm text-muted-foreground px-2 sm:px-1 tabular-nums whitespace-nowrap">
                  {page.avgTime}
                </td>
                <td className="text-right text-sm pl-2 pr-5 sm:pr-1 whitespace-nowrap">
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
