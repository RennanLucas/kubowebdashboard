import { Radio } from "lucide-react";

const ActiveVisitorsCard = ({ count }: { count: number }) => (
  <div className="glass-card p-5 flex items-center gap-4">
    <div className="relative">
      <div className="p-3 rounded-lg bg-success/10">
        <Radio className="h-5 w-5 text-success" />
      </div>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success animate-pulse" />
      )}
    </div>
    <div>
      <p className="text-2xl font-medium text-card-foreground tabular-nums tracking-tight">{count}</p>
      <p className="text-xs text-muted-foreground">visitante{count !== 1 ? "s" : ""} agora</p>
    </div>
  </div>
);

export default ActiveVisitorsCard;
