import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Globe, Trash2, Layers } from "lucide-react";

interface Props {
  clientId: string;
}

export default function ProjectsManager({ clientId }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });

  const { data: projects, refetch } = useQuery({
    queryKey: ["client-projects", clientId],
    enabled: !!clientId,
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

  const limitReached = (projects?.length ?? 0) >= 2;

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error("Informe um nome para o projeto");
      return;
    }
    if (limitReached) {
      toast.error("Limite de 2 projetos por conta atingido");
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
        Cada projeto representa um site monitorado. Você pode ter até <span className="font-medium text-foreground">2 projetos</span> por conta para usar a página <span className="font-medium text-foreground">Comparar</span>.
        {limitReached && <span className="block mt-1 text-destructive">Limite atingido (2/2).</span>}
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
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic">Nenhum projeto ainda.</div>
        )}
      </div>
    </div>
  );
}
