interface PageData {
  path: string;
  name: string;
  views: number;
  avgTime: string;
  bounceRate: number;
}

const TopPages = ({ pages }: { pages: PageData[] }) => (
  <div className="glass-card p-5">
    <h3 className="text-sm font-medium text-card-foreground mb-4">Páginas Mais Visitadas</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-left pb-3 font-medium">Página</th>
            <th className="text-right pb-3 font-medium">Visitas</th>
            <th className="text-right pb-3 font-medium hidden sm:table-cell">Tempo Médio</th>
            <th className="text-right pb-3 font-medium hidden sm:table-cell">Rejeição</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page, i) => (
            <tr key={page.path} className={`border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-muted/50 ${i % 2 === 1 ? "bg-muted/30" : ""}`}>
              <td className="py-3">
                <p className="text-sm font-medium text-card-foreground">{page.name}</p>
                <p className="text-xs text-muted-foreground">{page.path}</p>
              </td>
              <td className="text-right text-sm font-medium text-card-foreground">{page.views.toLocaleString("pt-BR")}</td>
              <td className="text-right text-sm text-muted-foreground hidden sm:table-cell">{page.avgTime}</td>
              <td className="text-right text-sm hidden sm:table-cell">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
  </div>
);

export default TopPages;
