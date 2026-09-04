import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Goals {
  visitors: number;
  leads: number;
  estimatedValue: number;
}

const DEFAULT_GOALS: Goals = { visitors: 0, leads: 0, estimatedValue: 0 };

const currentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
};

export const useGoals = (projectId?: string) => {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setGoals(DEFAULT_GOALS);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("goals")
      .select("visitors_target, leads_target, revenue_target")
      .eq("project_id", projectId)
      .eq("month", currentMonth())
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) setGoals(DEFAULT_GOALS);
        else setGoals({
          visitors: data.visitors_target ?? 0,
          leads: data.leads_target ?? 0,
          estimatedValue: Number(data.revenue_target ?? 0),
        });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  return { goals, loading };
};
