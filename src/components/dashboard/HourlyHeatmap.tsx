import { Clock } from "lucide-react";
import { HeatmapCell } from "@/hooks/useHourlyHeatmap";
import { SectionCard } from "./SectionCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Props {
  data: HeatmapCell[];
  isLoading?: boolean;
}

export const HourlyHeatmap = ({ data, isLoading }: Props) => {
  const max = Math.max(1, ...data.map((c) => c.count));

  const intensity = (count: number) => {
    if (count === 0) return 0;
    return Math.max(0.08, count / max);
  };

  return (
    <SectionCard
      icon={<Clock className="h-4 w-4 text-primary" />}
      title="Mapa de calor — dia × hora"
      tooltip="Visualização do volume de visitas por dia da semana e hora do dia. Quanto mais escura a célula, mais visitantes naquele horário. Use para identificar os melhores momentos para publicar conteúdo ou rodar anúncios."
      compact
    >
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Carregando...</div>
      ) : (
        <TooltipProvider delayDuration={100}>
          <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex">
              <div className="w-10" />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground min-w-[18px]">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {DAYS.map((label, day) => (
              <div key={day} className="flex items-center mt-0.5">
                <div className="w-10 text-[10px] text-muted-foreground pr-1">{label}</div>
                {Array.from({ length: 24 }).map((_, hour) => {
                  const cell = data.find((c) => c.day === day && c.hour === hour);
                  const op = intensity(cell?.count ?? 0);
                  return (
                    <Tooltip key={hour}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex-1 aspect-square rounded-[3px] mx-[1px] min-w-[18px] transition-all hover:ring-1 hover:ring-primary/50 hover:scale-110 relative z-10"
                          style={{ backgroundColor: `hsl(var(--primary) / ${op})` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs border border-border/50 bg-card/80 backdrop-blur-md shadow-lg ring-1 ring-black/5">
                        <span className="font-medium text-foreground">{label} às {hour}h:</span> {cell?.count ?? 0} visitas
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
              <span>Menos</span>
              {[0.1, 0.3, 0.5, 0.7, 1].map((op, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-[2px]"
                  style={{ backgroundColor: `hsl(var(--primary) / ${op})` }}
                />
              ))}
              <span>Mais</span>
            </div>
            </div>
          </div>
        </TooltipProvider>
      )}
    </SectionCard>
  );
};
