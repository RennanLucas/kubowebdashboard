import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Map } from "lucide-react";

const STATUS_MAP: Record<string, { label: string, color: string, icon: string }> = {
  planned: { label: "Próximos passos", color: "bg-purple-100 text-purple-800", icon: "🟣" },
  in_development: { label: "Em desenvolvimento", color: "bg-orange-100 text-orange-800", icon: "🟠" },
  testing: { label: "Em teste", color: "bg-blue-100 text-blue-800", icon: "🔵" },
  published: { label: "Implementado", color: "bg-green-100 text-green-800", icon: "🟢" },
};

export function PublicRoadmap() {
  const { activeOrganization } = useOrganization();
  const orgId = activeOrganization?.id;
  const queryClient = useQueryClient();

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!roadmapItems || roadmapItems.length === 0) {
    return (
      <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
        <Map className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Roadmap vazio</h3>
        <p className="text-muted-foreground">Em breve compartilharemos as novidades em que estamos trabalhando.</p>
      </div>
    );
  }

  // Group by status
  const groups: Record<string, any[]> = {
    published: [],
    testing: [],
    in_development: [],
    planned: []
  };

  roadmapItems.forEach((item: any) => {
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
                const votesCount = item.roadmap_item_votes?.[0]?.vote_count || 0;
                const hasVoted = myVotes?.has(item.id);

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
                        onClick={() => voteMutation.mutate({ itemId: item.id, isVoted: !!hasVoted })}
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
