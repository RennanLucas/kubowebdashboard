import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsResponse {
  client: {
    id: string;
    company_name: string;
    domain: string | null;
    project: { id: string; name: string; url: string | null } | null;
    projects: Array<{ id: string; name: string; url: string | null }>;
  } | null;
  metrics: Array<{
    date: string;
    visitors: number;
    leads: number;
    conversion_rate: number;
    estimated_value: number;
    whatsapp_clicks: number;
    form_submissions: number;
    button_clicks: number;
  }> | null;
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
    color: string;
  }> | null;
  topPages: Array<{
    path: string;
    name: string;
    views: number;
    avgTime: string;
    bounceRate: number;
  }> | null;
  comparison: {
    visitors: number;
    views: number;
    prevVisitors: number;
    prevViews: number;
  } | null;
}

export const useDashboardAnalytics = (days: number, projectId?: string) => {
  return useQuery({
    queryKey: ["dashboard-analytics", days, projectId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const pid = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      let url = `https://${pid}.supabase.co/functions/v1/get-analytics?days=${days}`;
      if (projectId) url += `&project_id=${projectId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao buscar dados");
      }

      return (await response.json()) as AnalyticsResponse;
    },
  });
};

export const useClientData = () => {
  const { data, isLoading, error } = useDashboardAnalytics(30);
  return {
    data: data?.client
      ? {
          ...data.client,
          company_name: data.client.company_name,
          projects: data.client.projects || (data.client.project ? [data.client.project] : []),
        }
      : null,
    isLoading,
    error,
  };
};
