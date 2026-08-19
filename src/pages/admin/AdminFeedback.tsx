import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function AdminFeedback() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback" as any)
        .select(`
          *,
          users:user_id (email, raw_user_meta_data),
          organizations:organization_id (name)
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase.from("feedback" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar", { description: err.message });
    }
  });

  const filtered = (feedbacks || []).filter((f: any) => {
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.title?.toLowerCase().includes(q) || 
             f.description?.toLowerCase().includes(q) ||
             f.users?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    received: (feedbacks || []).filter((f: any) => f.status === 'received').length,
    analyzing: (feedbacks || []).filter((f: any) => f.status === 'analyzing').length,
    inDev: (feedbacks || []).filter((f: any) => f.status === 'in_development').length,
    implemented: (feedbacks || []).filter((f: any) => f.status === 'implemented').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Feedbacks — KUBOWEB</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link>
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-border mb-6">
          <Link to="/admin" className="pb-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium">Usuários</Link>
          <Link to="/admin/feedback" className="pb-2 border-b-2 border-primary text-foreground font-medium">Feedback & Melhorias</Link>
          <Link to="/admin/roadmap" className="pb-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium">Roadmap</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Recebidos</div>
            <div className="text-2xl font-bold">{stats.received}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Em Análise</div>
            <div className="text-2xl font-bold">{stats.analyzing}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Em Desenvolvimento</div>
            <div className="text-2xl font-bold">{stats.inDev}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Implementados</div>
            <div className="text-2xl font-bold">{stats.implemented}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Pesquisar feedbacks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md bg-card"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
              <SelectItem value="analyzing">Em análise</SelectItem>
              <SelectItem value="planned">Planejado</SelectItem>
              <SelectItem value="in_development">Em desenvolvimento</SelectItem>
              <SelectItem value="implemented">Implementado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border rounded-xl">Nenhum feedback encontrado.</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{item.type}</Badge>
                      <Badge variant="secondary">{item.category}</Badge>
                      <span className="text-xs text-muted-foreground">Org: {item.organizations?.name || 'Desconhecida'} • Usuário: {item.users?.email}</span>
                    </div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{item.description}</p>
                    
                    <div className="pt-2 border-t mt-4 border-border">
                      <p className="text-xs font-semibold mb-2">Resposta da Equipe:</p>
                      <Textarea 
                        placeholder="Digite a resposta que o cliente verá..." 
                        defaultValue={item.admin_response || ""}
                        className="text-sm bg-muted/30"
                        onBlur={(e) => {
                          if (e.target.value !== item.admin_response) {
                            updateMutation.mutate({ id: item.id, updates: { admin_response: e.target.value } });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-full lg:w-64 space-y-4 shrink-0 bg-muted/20 p-4 rounded-lg border border-border">
                    <div>
                      <p className="text-xs font-semibold mb-1.5">Status Público</p>
                      <Select 
                        value={item.status} 
                        onValueChange={(v) => updateMutation.mutate({ id: item.id, updates: { status: v } })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="received">Recebido</SelectItem>
                          <SelectItem value="analyzing">Em análise</SelectItem>
                          <SelectItem value="planned">Planejado</SelectItem>
                          <SelectItem value="in_development">Em desenvolvimento</SelectItem>
                          <SelectItem value="implemented">Implementado</SelectItem>
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-1.5">Prioridade Interna</p>
                      <Select 
                        value={item.internal_priority} 
                        onValueChange={(v) => updateMutation.mutate({ id: item.id, updates: { internal_priority: v } })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="normal">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">Prioridade do cliente: <strong>{item.customer_priority}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
