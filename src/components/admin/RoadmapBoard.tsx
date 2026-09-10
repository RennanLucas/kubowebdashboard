import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const db = supabase as SupabaseClient;
export const roadmapStatuses = { backlog: "Ideias", planned: "Planejado", in_development: "Em desenvolvimento", testing: "Em teste", published: "Implementado" };
type Status = keyof typeof roadmapStatuses;
type Item = { id: string; title: string; description: string; category: string; status: Status; public: boolean };
const empty = { title: "", description: "", category: "", status: "backlog" as Status, public: false };

export function RoadmapBoard() {
  const cache = useQueryClient();
  const [draft, setDraft] = useState<typeof empty & { id?: string } | null>(null);
  const items = useQuery({ queryKey: ["admin-roadmap"], queryFn: async () => {
    const { data, error } = await db.from("roadmap_items").select("id,title,description,category,status,public").order("created_at", { ascending: false });
    if (error) throw error;
    return data as Item[];
  }});
  const save = useMutation({ mutationFn: async (value: NonNullable<typeof draft>) => {
    if (!value.title.trim()) throw new Error("Informe um título.");
    const { id, ...fields } = value;
    const payload = { ...fields, title: fields.title.trim(), description: fields.description.trim(), category: fields.category.trim() };
    const result = id
      ? await db.from("roadmap_items").update(payload).eq("id", id).select("id").single()
      : await db.from("roadmap_items").insert(payload).select("id").single();
    if (result.error) throw result.error;
  }, onSuccess: () => {
    setDraft(null);
    cache.invalidateQueries({ queryKey: ["admin-roadmap"] });
    cache.invalidateQueries({ queryKey: ["roadmap-public"] });
    toast.success("Roadmap salvo.");
  }, onError: () => toast.error("Não foi possível salvar. Confira sua permissão e tente novamente.") });

  return <section aria-label="Gerenciar roadmap" className="space-y-6">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Roadmap do produto</h2><p className="text-muted-foreground">Organize entregas e escolha quais itens aparecem para os clientes.</p></div>
      <Button onClick={() => setDraft({ ...empty })}>Novo item</Button>
    </div>
    {items.isLoading && <p role="status">Carregando roadmap…</p>}
    {items.isError && <div role="alert"><p>Não foi possível carregar o roadmap.</p><Button variant="outline" onClick={() => items.refetch()}>Tentar novamente</Button></div>}
    {!items.isLoading && !items.isError && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Object.entries(roadmapStatuses).map(([status, label]) => <section key={status} className="rounded-xl border bg-muted/20 p-3 min-w-0">
        <h3 className="font-semibold mb-4">{label} <span className="text-muted-foreground">({items.data?.filter(i => i.status === status).length ?? 0})</span></h3>
        <div className="space-y-3">{items.data?.filter(i => i.status === status).map(item => <article key={item.id} className="rounded-lg border bg-card p-4 space-y-3 break-words">
          <span className="text-xs text-muted-foreground">{item.public ? "Público" : "Interno"}</span>
          <h4 className="font-medium">{item.title}</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          {item.category && <p className="text-xs">{item.category}</p>}
          <Button variant="outline" size="sm" aria-label={`Editar ${item.title}`} onClick={() => setDraft({ ...item, description: item.description ?? "", category: item.category ?? "" })}>Editar</Button>
        </article>)}</div>
        {!items.data?.some(i => i.status === status) && <p className="text-sm text-muted-foreground">Nenhum item nesta etapa.</p>}
      </section>)}
    </div>}
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !save.isPending) setDraft(null); }}>
      <DialogContent><DialogHeader><DialogTitle>{draft?.id ? "Editar item" : "Novo item do roadmap"}</DialogTitle><DialogDescription>Defina o conteúdo, a etapa e quem pode visualizar esta entrega.</DialogDescription></DialogHeader>
        {draft && <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(draft); }}>
          <label className="block">Título<Input required maxLength={160} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
          <label className="block">Descrição<textarea className="w-full min-h-24 rounded-md border bg-background p-2" maxLength={5000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label>
          <label className="block">Categoria<Input maxLength={80} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}/></label>
          <label className="block">Etapa<select className="w-full rounded-md border bg-background p-2" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Status })}>{Object.entries(roadmapStatuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={draft.public} onChange={e => setDraft({ ...draft, public: e.target.checked })}/>Visível no roadmap público</label>
          <p className="text-sm text-muted-foreground">Itens públicos ficam visíveis aos clientes. Não inclua informações pessoais.</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={save.isPending} onClick={() => setDraft(null)}>Cancelar</Button><Button type="submit" disabled={save.isPending || !draft.title.trim()}>{save.isPending ? "Salvando…" : "Salvar item"}</Button></div>
        </form>}
      </DialogContent>
    </Dialog>
  </section>;
}
