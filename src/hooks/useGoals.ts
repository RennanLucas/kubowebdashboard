import { useCallback, useEffect, useState } from "react";

export interface Goals {
  visitors: number;
  leads: number;
  estimatedValue: number;
}

const DEFAULT_GOALS: Goals = { visitors: 0, leads: 0, estimatedValue: 0 };

const storageKey = (projectId?: string) => `kuboweb:goals:${projectId ?? "default"}`;

export const useGoals = (projectId?: string) => {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(projectId));
      if (raw) setGoals({ ...DEFAULT_GOALS, ...JSON.parse(raw) });
      else setGoals(DEFAULT_GOALS);
    } catch {
      setGoals(DEFAULT_GOALS);
    }
  }, [projectId]);

  const updateGoals = useCallback(
    (next: Partial<Goals>) => {
      setGoals((prev) => {
        const merged = { ...prev, ...next };
        try {
          localStorage.setItem(storageKey(projectId), JSON.stringify(merged));
        } catch {
          // ignore quota errors
        }
        return merged;
      });
    },
    [projectId],
  );

  return { goals, updateGoals };
};
