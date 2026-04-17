import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

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
  conversions: {
    whatsapp_clicks: number;
    button_clicks: number;
    form_submissions: number;
    phone_clicks: number;
    email_clicks: number;
    changes: {
      whatsapp: number;
      buttons: number;
      forms: number;
    };
    recent: Array<{
      type: string;
      label: string;
      page: string;
      time: string;
      metadata: Record<string, any>;
    }>;
  } | null;
  devices: BreakdownItem[] | null;
  browsers: BreakdownItem[] | null;
  operatingSystems: BreakdownItem[] | null;
  countries: BreakdownItem[] | null;
  cities: BreakdownItem[] | null;
  engagement: {
    bounceRate: number;
    avgSessionDuration: number;
    totalSessions: number;
    pagesPerSession: number;
  } | null;
  activeVisitors: number | null;
}

const fetchAnalytics = async (days: number, projectId: string | undefined, accessToken: string) => {
  const pid = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  let url = `https://${pid}.supabase.co/functions/v1/get-analytics?days=${days}`;
  if (projectId) url += `&project_id=${projectId}`;

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
};

export const useDashboardAnalytics = (days: number, projectId?: string) => {
  return useQuery({
    queryKey: ["dashboard-analytics", days, projectId],
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      let { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          session = refreshData.session;
        }
      } else {
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData.session;
      }

      if (!session?.access_token) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("AUTH_EXPIRED");
      }

      let response = await fetchAnalytics(days, projectId, session.access_token);

      if (response.status === 401) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        const refreshedToken = refreshData.session?.access_token;

        if (!refreshedToken) {
          await supabase.auth.signOut({ scope: "local" });
          throw new Error("AUTH_EXPIRED");
        }

        response = await fetchAnalytics(days, projectId, refreshedToken);
      }

      if (response.status === 401) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("AUTH_EXPIRED");
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao buscar dados");
      }

      return (await response.json()) as AnalyticsResponse;
    },
    retry: (failureCount, error) => {
      if (error.message === "AUTH_EXPIRED") return false;
      return failureCount < 2;
    },
  });
};

export const useClientData = () => {
  const { data, isLoading, error } = useDashboardAnalytics(30);
  const client = useMemo(() => {
    if (!data?.client) return null;

    return {
      ...data.client,
      company_name: data.client.company_name,
      lead_value: (data.client as any).lead_value ?? 25,
      projects: data.client.projects || (data.client.project ? [data.client.project] : []),
    };
  }, [data?.client]);

  return {
    data: client,
    isLoading,
    error,
  };
};
