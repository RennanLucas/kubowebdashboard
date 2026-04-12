import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface VisitorsChartProps {
  data: Array<{ date: string; visitors: number; leads: number }>;
}

const VisitorsChart = ({ data }: VisitorsChartProps) => (
  <div className="glass-card rounded-xl p-5">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">Visitantes e Leads</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 13,
            }}
          />
          <Legend />
          <Line name="Visitantes" type="monotone" dataKey="visitors" stroke="hsl(var(--chart-blue))" strokeWidth={2} dot={false} />
          <Line name="Leads" type="monotone" dataKey="leads" stroke="hsl(var(--chart-green))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default VisitorsChart;
