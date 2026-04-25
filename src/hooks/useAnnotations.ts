import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnnotationCategory } from "@/lib/annotation-categories";
import { toast } from "sonner";

export interface Annotation {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  category: AnnotationCategory;
  notes: string | null;
  created_at: string;
}

export const useAnnotations = (projectId?: string) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setAnnotations([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("annotations")
      .select("id, date, label, category, notes, created_at")
      .eq("project_id", projectId)
      .order("date", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("[useAnnotations] fetch error", error);
      setAnnotations([]);
      return;
    }
    setAnnotations((data ?? []) as Annotation[]);
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: { date: string; label: string; category: AnnotationCategory; notes?: string }) => {
      if (!projectId) {
        toast.error("Selecione um projeto antes de criar uma anotação.");
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }
      const { error } = await supabase.from("annotations").insert({
        project_id: projectId,
        date: input.date,
        label: input.label.trim().slice(0, 80),
        category: input.category,
        notes: input.notes?.trim() || null,
        created_by: uid,
      });
      if (error) {
        toast.error("Não foi possível salvar a anotação: " + error.message);
        return;
      }
      toast.success("Anotação adicionada.");
      await refresh();
    },
    [projectId, refresh],
  );

  const update = useCallback(
    async (
      id: string,
      input: { date: string; label: string; category: AnnotationCategory; notes?: string },
    ) => {
      const { error } = await supabase
        .from("annotations")
        .update({
          date: input.date,
          label: input.label.trim().slice(0, 80),
          category: input.category,
          notes: input.notes?.trim() || null,
        })
        .eq("id", id);
      if (error) {
        toast.error("Não foi possível atualizar: " + error.message);
        return;
      }
      toast.success("Anotação atualizada.");
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("annotations").delete().eq("id", id);
      if (error) {
        toast.error("Não foi possível remover: " + error.message);
        return;
      }
      toast.success("Anotação removida.");
      await refresh();
    },
    [refresh],
  );

  return { annotations, loading, add, remove, refresh };
};
