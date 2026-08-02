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
  clientId: string;
}

export default function ProjectsManager({ clientId }: Props) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const plan = usePlan();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });

  const { data: projects, refetch } = useQuery({
    queryKey: ["client-projects", userId, clientId],
    enabled: !!clientId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, url, created_at")
        .eq("client_id", clientId)
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
        plan.isProPlus
          ? "Limite atingido"
          : plan.isFree
            ? `O plano Gratuito permite ${plan.maxProjects} projeto. Assine o Pro para até 3 projetos.`
            : `Plano Pro permite até ${plan.maxProjects} projetos. Faça upgrade para o Pro+ para projetos ilimitados.`,
      );
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        client_id: clientId,
        name: form.name.trim(),
        url: form.url.trim() || null,
      });
      if (error) throw error;
      toast.success("Projeto criado!");
      setForm({ name: "", url: "" });
      setOpen(false);
      await refetch();
      await qc.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      await qc.invalidateQueries({ queryKey: ["all-user-projects"] });
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
          <Layers className="h-4 w-4 text-primary" /> Meus Projetos
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
        {plan.isProPlus ? (
          <>Seu plano <span className="font-medium text-foreground">Pro+</span> permite projetos ilimitados ({currentCount} criados).</>
        ) : (
          <>Plano <span className="font-medium text-foreground">Pro</span>: até <span className="font-medium text-foreground">{limitLabel} projetos</span> ({currentCount}/{limitLabel}).</>
        )}
        {limitReached && !plan.isProPlus && (
          <span className="block mt-2 text-destructive">
            Limite atingido.{" "}
            <Link to="/pricing" className="inline-flex items-center gap-1 underline font-medium">
              <Sparkles className="h-3 w-3" /> Faça upgrade para Pro+
            </Link>{" "}
            e tenha projetos ilimitados.
          </span>
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
                      Esta ação não pode ser desfeita. Os dados de tráfego e conversões deste projeto serão mantidos no banco, mas o projeto deixará de aparecer no dashboard e na comparação.
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
                        await qc.invalidateQueries({ queryKey: ["dashboard-analytics"] });
                        await qc.invalidateQueries({ queryKey: ["all-user-projects"] });
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
