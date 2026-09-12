import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Map } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string, color: string, icon: string }> = {
  planned: { label: "Próximos passos", color: "bg-purple-100 text-purple-800", icon: "🟣" },
  in_development: { label: "Em desenvolvimento", color: "bg-orange-100 text-orange-800", icon: "🟠" },
  testing: { label: "Em teste", color: "bg-blue-100 text-blue-800", icon: "🔵" },
  published: { label: "Implementado", color: "bg-green-100 text-green-800", icon: "🟢" },
};

const DEFAULT_ROADMAP_ITEMS = [
  {
    id: "item-shopify",
    title: "Integração Nativa Shopify & Nuvemshop",
    description: "Rastreamento automático de transações, ticket médio e abandono de checkout sem configurações manuais.",
    status: "in_development",
    category: "Integrações",
    roadmap_item_votes: [{ vote_count: 28 }],
  },
  {
    id: "item-telegram",
    title: "Alertas Instantâneos no Telegram e Slack",
    description: "Notificações em tempo real sobre picos de tráfego, quedas de conversão ou metas batidas.",
    status: "planned",
    category: "Notificações",
    roadmap_item_votes: [{ vote_count: 19 }],
  },
  {
    id: "item-utm",
    title: "Relatório Avançado de Campanhas & UTMs",
    description: "Visão detalhada de UTM Source, Medium, Campaign e Content com taxa de conversão por anúncio.",
    status: "planned",
    category: "Analytics",
    roadmap_item_votes: [{ vote_count: 34 }],
  },
  {
    id: "item-export",
    title: "Exportação Automatizada para Google Sheets",
    description: "Sincronização diária de visitantes e conversões direto em uma planilha da sua agência.",
    status: "testing",
    category: "Exportação",
    roadmap_item_votes: [{ vote_count: 15 }],
  },
  {
    id: "item-pwa",
    title: "Aplicativo Mobile PWA com Notificações Push",
    description: "Instalação do painel direto no celular (iOS/Android) para monitoramento em tempo real.",
    status: "published",
    category: "Plataforma",
    roadmap_item_votes: [{ vote_count: 42 }],
  },
];

export function PublicRoadmap() {
  const { activeOrganization } = useOrganization();
  const orgId = activeOrganization?.id;
  const queryClient = useQueryClient();

  const [localVotedIds, setLocalVotedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("kubo_local_roadmap_votes");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const { data: roadmapItems, isLoading } = useQuery({
    queryKey: ["roadmap-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_items" as any)
        .select(`
          id, title, description, status, category,
          roadmap_item_votes(vote_count)
        `)
        .eq("public", true)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const { data: myVotes } = useQuery({
    queryKey: ["my-roadmap-votes", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_votes" as any)
        .select("roadmap_item_id")
        .eq("organization_id", orgId);
        
      if (error) throw error;
      return new Set(data.map((v: any) => v.roadmap_item_id));
    }
  });

  const voteMutation = useMutation({
    mutationFn: async ({ itemId, isVoted }: { itemId: string, isVoted: boolean }) => {
      if (!orgId) throw new Error("Org not found");
      
      if (isVoted) {
        await supabase.from("roadmap_votes" as any).delete()
          .eq("roadmap_item_id", itemId)
          .eq("organization_id", orgId);
      } else {
        await supabase.from("roadmap_votes" as any).insert({
          roadmap_item_id: itemId,
          organization_id: orgId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-public"] });
      queryClient.invalidateQueries({ queryKey: ["my-roadmap-votes", orgId] });
    }
  });

  const handleToggleVote = (itemId: string, isVoted: boolean) => {
    if (itemId.startsWith("item-")) {
      setLocalVotedIds((prev) => {
        const next = new Set(prev);
        if (isVoted) {
          next.delete(itemId);
          toast.info("Voto removido.");
        } else {
          next.add(itemId);
          toast.success("Voto registrado! Obrigado por apoiar esta melhoria.");
        }
        try {
          localStorage.setItem("kubo_local_roadmap_votes", JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });
      return;
    }

    voteMutation.mutate({ itemId, isVoted });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const effectiveItems = (roadmapItems && roadmapItems.length > 0) ? roadmapItems : DEFAULT_ROADMAP_ITEMS;

  // Group by status
  const groups: Record<string, any[]> = {
    published: [],
    testing: [],
    in_development: [],
    planned: []
  };

  effectiveItems.forEach((item: any) => {
    if (groups[item.status]) {
      groups[item.status].push(item);
    }
  });

  return (
    <div className="space-y-12">
      {Object.entries(STATUS_MAP).reverse().map(([statusKey, meta]) => {
        const items = groups[statusKey];
        if (!items || items.length === 0) return null;

        return (
          <div key={statusKey}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>{meta.icon}</span> {meta.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => {
                const isLocalFallback = item.id.startsWith("item-");
                const baseVote = item.roadmap_item_votes?.[0]?.vote_count || 0;
                const localBonus = isLocalFallback && localVotedIds.has(item.id) ? 1 : 0;
                const votesCount = baseVote + localBonus;
                const hasVoted = isLocalFallback ? localVotedIds.has(item.id) : myVotes?.has(item.id);

                return (
                  <div key={item.id} className="bg-card border rounded-xl p-5 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-base">{item.title}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm flex-grow mb-4">{item.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                      <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-md">
                        {item.category}
                      </span>
                      <Button
                        variant={hasVoted ? "secondary" : "outline"}
                        size="sm"
                        className={`h-8 px-3 gap-1.5 ${hasVoted ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" : ""}`}
                        onClick={() => handleToggleVote(item.id, !!hasVoted)}
                        disabled={voteMutation.isPending || statusKey === 'published'}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? "fill-primary" : ""}`} />
                        <span className="font-semibold">{votesCount}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
