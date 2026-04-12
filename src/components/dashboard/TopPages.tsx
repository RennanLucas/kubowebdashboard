interface PageData {
  path: string;
  name: string;
  views: number;
  avgTime: string;
  bounceRate: number;
}

const TopPages = ({ pages }: { pages: PageData[] }) => (
  <div className="glass-card rounded-xl p-5">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">Top Pages</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-left pb-3 font-medium">Page</th>
            <th className="text-right pb-3 font-medium">Views</th>
            <th className="text-right pb-3 font-medium hidden sm:table-cell">Avg. Time</th>
            <th className="text-right pb-3 font-medium hidden sm:table-cell">Bounce</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.path} className="border-b border-border/50 last:border-0">
              <td className="py-3">
                <p className="text-sm font-medium text-card-foreground">{page.name}</p>
                <p className="text-xs text-muted-foreground">{page.path}</p>
              </td>
              <td className="text-right text-sm font-medium text-card-foreground">{page.views.toLocaleString()}</td>
              <td className="text-right text-sm text-muted-foreground hidden sm:table-cell">{page.avgTime}</td>
              <td className="text-right text-sm hidden sm:table-cell">
                <span className={page.bounceRate > 40 ? "text-destructive" : "text-[hsl(var(--success))]"}>
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
