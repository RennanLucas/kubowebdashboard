import { MessageCircle, FileText, MousePointerClick, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { format } from "date-fns";

interface RecentEvent {
  type: string;
  label: string;
  page: string;
  time: string;
  metadata: Record<string, any>;
}

interface ConversionsData {
  whatsappClicks: { value: number; change: number };
  formSubmissions: { value: number; change: number };
  buttonClicks: { value: number; change: number };
  recentEvents?: RecentEvent[];
}

const eventTypeLabels: Record<string, string> = {
  whatsapp_click: "WhatsApp",
  button_click: "Botão",
  form_submit: "Formulário",
  phone_click: "Telefone",
  email_click: "Email",
};

const ConversionsCard = ({ data }: { data: ConversionsData }) => {
  const items = [
    { label: "Cliques no WhatsApp", value: data.whatsappClicks.value, change: data.whatsappClicks.change, icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Envios de Formulário", value: data.formSubmissions.value, change: data.formSubmissions.change, icon: <FileText className="h-4 w-4" /> },
    { label: "Cliques em Botões", value: data.buttonClicks.value, change: data.buttonClicks.change, icon: <MousePointerClick className="h-4 w-4" /> },
  ];

  const recentEvents = data.recentEvents || [];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Conversões</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const isPositive = item.change >= 0;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                  {item.change !== 0 && (
                    <p className={`text-xs flex items-center gap-1 ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? "+" : ""}{item.change}%
                    </p>
                  )}
                  {item.change === 0 && item.value === 0 && (
                    <p className="text-xs text-muted-foreground">Sem dados ainda</p>
                  )}
                </div>
              </div>
              <span className="text-lg font-semibold text-card-foreground">{item.value.toLocaleString("pt-BR")}</span>
            </div>
          );
        })}
      </div>

      {recentEvents.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Últimos eventos
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentEvents.slice(0, 5).map((event, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
                    {eventTypeLabels[event.type] || event.type}
                  </span>
                  <span className="text-muted-foreground truncate">{event.label || event.page}</span>
                </div>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {format(new Date(event.time), "HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionsCard;