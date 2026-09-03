import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Globe, Trash2, Layers, Sparkles, Pencil } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Link } from "react-router-dom";
import { TrackingInstallWizard } from "@/components/settings/TrackingInstallWizard";

interface Props {
  organizationId: string;
  openInstallation?: boolean;
}

export default function ProjectsManager({ organizationId, openInstallation = false }: Props) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const plan = usePlan();
  const [open, setOpen] = useState(false);
  const [autoOpenWizard, setAutoOpenWizard] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; url: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const didAutoOpen = useRef(false);

  const { data: projects, refetch } = useQuery({
    queryKey: ["org-projects", organizationId],
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

  useEffect(() => {
    if (openInstallation && !didAutoOpen.current && projects?.[0]?.id) {
      didAutoOpen.current = true;
      setAutoOpenWizard(projects[0].id);
    }
  }, [openInstallation, projects]);

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
      // client_id is required by the schema but is being phased out in favor of organization_id
      // For now, use organization_id as client_id to satisfy the NOT NULL constraint
      const { data, error } = await supabase.from("projects").insert({
        organization_id: organizationId,
        client_id: organizationId, // Temporary: satisfies NOT NULL constraint during migration
        name: form.name.trim(),
        url: form.url.trim() || null,
      }).select("id").single();
      
      if (error) throw error;
      
      toast.success("Projeto criado! Siga as instruções para instalar o código.");
      setForm({ name: "", url: "" });
      setOpen(false);
      await refetch();
      await qc.invalidateQueries({ queryKey: ["projects"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      
      // Auto open wizard for the newly created project
      if (data?.id) {
        setAutoOpenWizard(data.id);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar projeto");
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (p: { id: string; name: string; url: string | null }) => {
    setEditingProject({ id: p.id, name: p.name, url: p.url || "" });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingProject) return;
    if (!editingProject.name.trim()) {
      toast.error("Informe um nome para o projeto");
      return;
    }
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: editingProject.name.trim(),
          url: editingProject.url.trim() || null,
        })
        .eq("id", editingProject.id);

      if (error) throw error;

      toast.success("Projeto atualizado com sucesso!");
      setEditOpen(false);
      setEditingProject(null);
      await refetch();
      await qc.invalidateQueries({ queryKey: ["projects"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar projeto");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div id="projects" className="glass-card rounded-xl p-6 space-y-4 scroll-mt-24">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8"
                  title="Editar projeto"
                  onClick={() => handleEditOpen(p)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <TrackingInstallWizard 
                  projectId={p.id} 
                  projectName={p.name} 
                  defaultOpen={autoOpenWizard === p.id}
                  onOpenChange={(isOpen) => {
                    if (!isOpen && autoOpenWizard === p.id) {
                      setAutoOpenWizard(null);
                    }
                  }}
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8">
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
                          
                          // Clear active project if the deleted one was selected
                          const currentActive = localStorage.getItem("dashboard:last-project-id");
                          if (currentActive === p.id) {
                            localStorage.removeItem("dashboard:last-project-id");
                            window.dispatchEvent(new Event("project-changed"));
                          }

                          await refetch();
                          await qc.invalidateQueries({ queryKey: ["projects"] });
                          await qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
                        }}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic">Nenhum projeto ainda.</div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ep-name">Nome do projeto</Label>
              <Input
                id="ep-name"
                placeholder="Ex.: Loja Online"
                value={editingProject?.name || ""}
                onChange={(e) => setEditingProject((prev) => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-url">URL (opcional)</Label>
              <Input
                id="ep-url"
                type="url"
                placeholder="https://www.exemplo.com"
                value={editingProject?.url || ""}
                onChange={(e) => setEditingProject((prev) => prev ? { ...prev, url: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

