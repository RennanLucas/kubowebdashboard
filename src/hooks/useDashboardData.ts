import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsResponse {
  client: {
    id: string;
    company_name: string;
    domain: string | null;
    analytics_property_id: string | null;
    project: { id: string; name: string; url: string | null } | null;
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
}

export const useDashboardAnalytics = (days: number) => {
  return useQuery({
    queryKey: ["dashboard-analytics", days],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/get-analytics?days=${days}`;

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

// Backward-compatible hook for onboarding redirect check
export const useClientData = () => {
  const { data, isLoading, error } = useDashboardAnalytics(30);
  return {
    data: data?.client
      ? {
          ...data.client,
          company_name: data.client.company_name,
          projects: data.client.project ? [data.client.project] : [],
        }
      : null,
    isLoading,
    error,
  };
};
