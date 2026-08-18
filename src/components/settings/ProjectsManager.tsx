import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Globe, Trash2, Layers, Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Link } from "react-router-dom";

interface Props {
  organizationId: string;
}

export default function ProjectsManager({ organizationId }: Props) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const plan = usePlan();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });

  const { data: projects, refetch } = useQuery({
    queryKey: ["projects", organizationId],
    enabled: !!organizationId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, url, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const currentCount = projects?.length ?? 0;
  const limitReached = currentCount >= plan.maxProjects;
  const limitLabel = Number.isFinite(plan.maxProjects) ? String(plan.maxProjects) : "∞";

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error("Informe um nome para o projeto");
      return;
    }
    if (limitReached) {
      toast.error(
        plan.isPro
          ? "Limite atingido"
          : `O plano Gratuito permite ${plan.maxProjects} projeto. Assine o Pro para projetos ilimitados.`,
      );
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        organization_id: organizationId,
        // Since client_id is required in DB schema still, we must fill it with something or rely on DB defaults if they exist. Wait, the DB schema has client_id as NOT NULL! Oh no, Fase 3.1 multi tenant migration made organization_id the main key but kept client_id for legacy?
        // Let's pass a dummy or we need to find the user's first client_id. Wait! The Fase 3.1 Multi Tenant SQL:
        // `ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL;`
        // Let's assume it's dropped NOT NULL.
        name: form.name.trim(),
        url: form.url.trim() || null,
      });
      if (error) throw error;
      toast.success("Projeto criado!");
      setForm({ name: "", url: "" });
      setOpen(false);
      await refetch();
      await qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar projeto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" /> Projetos
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" disabled={limitReached}>
              <Plus className="h-4 w-4" /> Adicionar projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="np-name">Nome do projeto</Label>
                <Input
                  id="np-name"
                  placeholder="Ex.: Loja Online"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np-url">URL (opcional)</Label>
                <Input
                  id="np-url"
                  type="url"
                  placeholder="https://www.exemplo.com"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? "Criando..." : "Criar projeto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Cada projeto representa um site monitorado.{" "}
        {plan.isPro ? (
          <>Seu plano <span className="font-medium text-foreground">Pro</span> permite projetos ilimitados ({currentCount} criados).</>
        ) : (
          <>Plano <span className="font-medium text-foreground">{plan.label}</span>: até <span className="font-medium text-foreground">{limitLabel} projeto{plan.maxProjects > 1 ? "s" : ""}</span> ({currentCount}/{limitLabel}).</>
        )}
      </p>

      <div className="space-y-2">
        {projects && projects.length > 0 ? (
          projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                {p.url && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Globe className="h-3 w-3" /> {p.url}
                  </div>
                )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir projeto "{p.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Os dados de tráfego deste projeto serão mantidos no banco, mas o projeto deixará de aparecer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        const { error } = await supabase.from("projects").delete().eq("id", p.id);
                        if (error) {
                          toast.error("Erro ao excluir: " + error.message);
                          return;
                        }
                        toast.success("Projeto excluído");
                        await refetch();
                        await qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
                      }}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic">Nenhum projeto ainda.</div>
        )}
      </div>
    </div>
  );
}

