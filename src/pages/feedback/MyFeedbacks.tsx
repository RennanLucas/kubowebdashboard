import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock } from "lucide-react";

const STATUS_MAP: Record<string, { label: string, color: string }> = {
  received: { label: "Recebido", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  analyzing: { label: "Em análise", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  planned: { label: "Planejado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  in_development: { label: "Em desenvolvimento", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  implemented: { label: "Implementado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  archived: { label: "Arquivado", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
};

const TYPE_MAP: Record<string, string> = {
  like: "Elogio",
  improvement: "Melhoria",
  bug: "Bug",
  suggestion: "Sugestão",
  feature: "Funcionalidade",
  quick_feedback: "Feedback Rápido",
  other: "Outro"
};

export function MyFeedbacks() {
  const { activeOrganization } = useOrganization();
  const orgId = activeOrganization?.id;

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["my-feedbacks", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback" as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum feedback enviado</h3>
        <p className="text-muted-foreground">Você ainda não enviou sugestões nesta organização.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((item: any) => (
        <div key={item.id} className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-normal text-xs">{TYPE_MAP[item.type] || item.type}</Badge>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {format(new Date(item.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{item.description}</p>
            </div>
            
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_MAP[item.status]?.color || STATUS_MAP.received.color}`}>
                {STATUS_MAP[item.status]?.label || item.status}
              </span>
            </div>
          </div>

          {item.admin_response && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-l-primary text-sm">
              <p className="font-semibold text-xs text-primary uppercase tracking-wider mb-1">Resposta da equipe Kubo</p>
              <p className="text-foreground/90">{item.admin_response}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
