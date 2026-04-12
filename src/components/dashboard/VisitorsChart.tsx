import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface VisitorsChartProps {
  data: Array<{ date: string; visitors: number; leads: number }>;
}

const VisitorsChart = ({ data }: VisitorsChartProps) => (
  <div className="glass-card p-5">
    <h3 className="text-sm font-medium text-card-foreground mb-4">Visitantes e Leads</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-green))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--chart-green))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "8px",
              fontSize: 13,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Legend />
          <Area name="Visitantes" type="monotone" dataKey="visitors" stroke="hsl(var(--chart-blue))" strokeWidth={2} fill="url(#gradVisitors)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area name="Leads" type="monotone" dataKey="leads" stroke="hsl(var(--chart-green))" strokeWidth={2} fill="url(#gradLeads)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default VisitorsChart;
