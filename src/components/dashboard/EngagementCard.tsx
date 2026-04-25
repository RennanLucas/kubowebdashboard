import { Activity, Clock, ArrowDownUp, Layers } from "lucide-react";
import { SectionCard } from "./SectionCard";

interface EngagementData {
  bounceRate: number;
  avgSessionDuration: number;
  totalSessions: number;
  pagesPerSession: number;
}

const EngagementCard = ({ data }: { data: EngagementData }) => {
  const mins = Math.floor(data.avgSessionDuration / 60);
  const secs = data.avgSessionDuration % 60;
  const durationStr = `${mins}:${String(secs).padStart(2, "0")}`;

  const items = [
    { label: "Taxa de Rejeição", value: `${data.bounceRate}%`, icon: <ArrowDownUp className="h-4 w-4" />, description: "Visitantes que saíram sem interagir" },
    { label: "Duração Média", value: durationStr, icon: <Clock className="h-4 w-4" />, description: "Tempo médio por sessão" },
    { label: "Sessões Totais", value: data.totalSessions.toLocaleString("pt-BR"), icon: <Activity className="h-4 w-4" />, description: "Número de sessões no período" },
    { label: "Páginas/Sessão", value: data.pagesPerSession.toString(), icon: <Layers className="h-4 w-4" />, description: "Média de páginas por sessão" },
  ];

  return (
    <SectionCard
      title="Engajamento"
      tooltip={
        <div className="space-y-1">
          <p><strong>Rejeição:</strong> % que saiu sem clicar em nada. Quanto menor, melhor.</p>
          <p><strong>Duração média:</strong> tempo médio que cada visitante passa no site.</p>
          <p><strong>Sessões:</strong> total de visitas (uma pessoa pode gerar várias).</p>
          <p><strong>Páginas/sessão:</strong> quantas páginas o visitante navega em média.</p>
        </div>
      }
      compact
    >
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            <p className="text-xl font-medium text-card-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default EngagementCard;
