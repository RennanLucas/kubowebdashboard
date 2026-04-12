interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
  color: string;
}

const TrafficSources = ({ data }: { data: TrafficSource[] }) => (
  <div className="glass-card rounded-xl p-5">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">Fontes de Tráfego</h3>
    <div className="space-y-4">
      {data.map((s) => (
        <div key={s.source}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-card-foreground font-medium">{s.source}</span>
            <span className="text-muted-foreground">{s.visitors.toLocaleString("pt-BR")} · {s.percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TrafficSources;
