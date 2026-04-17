import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { HeatmapCell } from "@/hooks/useHourlyHeatmap";

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
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-card-foreground">Mapa de calor — dia × hora</h3>
        <InfoTooltip content="Visualização do volume de visitas por dia da semana e hora do dia. Quanto mais escura a célula, mais visitantes naquele horário. Use para identificar os melhores momentos para publicar conteúdo ou rodar anúncios." />
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour header */}
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
                    <div
                      key={hour}
                      className="flex-1 aspect-square rounded-[2px] mx-px min-w-[18px]"
                      style={{ backgroundColor: `hsl(var(--primary) / ${op})` }}
                      title={`${label} ${hour}h: ${cell?.count ?? 0} visitas`}
                    />
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
      )}
    </Card>
  );
};
