import { useCallback, useEffect, useState } from "react";

export interface Annotation {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  createdAt: string;
}

const storageKey = (projectId?: string) => `kuboweb:annotations:${projectId ?? "default"}`;

export const useAnnotations = (projectId?: string) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(projectId));
      setAnnotations(raw ? JSON.parse(raw) : []);
    } catch {
      setAnnotations([]);
    }
  }, [projectId]);

  const persist = useCallback(
    (next: Annotation[]) => {
      setAnnotations(next);
      try {
        localStorage.setItem(storageKey(projectId), JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [projectId],
  );

  const add = useCallback(
    (date: string, label: string) => {
      const item: Annotation = {
        id: crypto.randomUUID(),
        date,
        label: label.trim().slice(0, 60),
        createdAt: new Date().toISOString(),
      };
      persist([...annotations, item]);
    },
    [annotations, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(annotations.filter((a) => a.id !== id));
    },
    [annotations, persist],
  );

  return { annotations, add, remove };
};
