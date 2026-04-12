import { Radio } from "lucide-react";

const ActiveVisitorsCard = ({ count }: { count: number }) => (
  <div className="glass-card rounded-xl p-5 flex items-center gap-4">
    <div className="relative">
      <div className="p-3 rounded-full bg-[hsl(var(--success))]/10">
        <Radio className="h-5 w-5 text-[hsl(var(--success))]" />
      </div>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[hsl(var(--success))] animate-pulse" />
      )}
    </div>
    <div>
      <p className="text-2xl font-semibold text-card-foreground">{count}</p>
      <p className="text-xs text-muted-foreground">visitante{count !== 1 ? "s" : ""} agora</p>
    </div>
  </div>
);

export default ActiveVisitorsCard;
