import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "./usePlan";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

const decodeJwtPayload = (token: string) => {
  try {
    const base64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!base64) return null;
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

const isTokenStale = (token?: string | null, bufferSeconds = 60) => {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp <= Math.floor(Date.now() / 1000) + bufferSeconds;
};

interface FetchOptions {
  source?: string;
  device?: string;
}

const fetchEndpoint = async (
  endpoint: string,
  days: number,
  projectId: string | undefined,
  accessToken: string,
  opts: FetchOptions = {},
) => {
  const pid = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  let url = `https://${pid}.supabase.co/functions/v1/${endpoint}?days=${days}`;
  if (projectId) url += `&project_id=${projectId}`;
  if (opts.source && opts.source !== "all") url += `&source=${encodeURIComponent(opts.source)}`;
  if (opts.device && opts.device !== "all") url += `&device=${encodeURIComponent(opts.device)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!response.ok) {
    let message = `Erro ao buscar dados (${response.status})`;
    try {
      const err = await response.json();
      message = err.error || err.message || message;
    } catch { }
    throw new Error(message);
  }

  return response.json();
};

const useValidSession = () => {
  const { session, loading } = useAuth();
  
  const getSession = async () => {
    let activeSession = session;
    if (isTokenStale(activeSession?.access_token)) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      activeSession = refreshData.session;
    }
    if (!activeSession?.access_token) {
      await supabase.auth.signOut({ scope: "local" });
      throw new Error("AUTH_EXPIRED");
    }
    return activeSession.access_token;
  };

  return { getSession, session, loading };
};

// --- GRANULAR HOOKS ---

export const useOverview = (days: number, projectId?: string, filters?: FetchOptions) => {
  const { getSession, session, loading: authLoading } = useValidSession();
  const { activeOrganization } = useOrganization();
  const plan = usePlan(!!session);
  const cappedDays = Math.min(days, plan.maxHistoryDays);
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ["dashboard-overview", session?.user?.id, orgId, cappedDays, projectId, filters?.source, filters?.device],
    refetchInterval: 60000,
    enabled: !authLoading && !!session?.access_token && !plan.loading && !!orgId && !!projectId,
    queryFn: async () => {
      const token = await getSession();
      return fetchEndpoint("get-dashboard-overview", cappedDays, projectId, token, filters);
    },
  });
};

export const useTopPages = (days: number, projectId?: string, filters?: FetchOptions) => {
  const { getSession, session, loading: authLoading } = useValidSession();
  const { activeOrganization } = useOrganization();
  const plan = usePlan(!!session);
  const cappedDays = Math.min(days, plan.maxHistoryDays);
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ["dashboard-pages", session?.user?.id, orgId, cappedDays, projectId, filters?.source, filters?.device],
    refetchInterval: 60000,
    enabled: !authLoading && !!session?.access_token && !plan.loading && !!orgId,
    queryFn: async () => {
      const token = await getSession();
      return fetchEndpoint("get-dashboard-pages", cappedDays, projectId, token, filters);
    },
  });
};

export const useTrafficSources = (days: number, projectId?: string, filters?: FetchOptions) => {
  const { getSession, session, loading: authLoading } = useValidSession();
  const { activeOrganization } = useOrganization();
  const plan = usePlan(!!session);
  const cappedDays = Math.min(days, plan.maxHistoryDays);
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ["dashboard-sources", session?.user?.id, orgId, cappedDays, projectId, filters?.device],
    refetchInterval: 60000,
    enabled: !authLoading && !!session?.access_token && !plan.loading && !!orgId,
    queryFn: async () => {
      const token = await getSession();
      return fetchEndpoint("get-dashboard-sources", cappedDays, projectId, token, { device: filters?.device });
    },
  });
};

export const useDevices = (days: number, projectId?: string, filters?: FetchOptions) => {
  const { getSession, session, loading: authLoading } = useValidSession();
  const { activeOrganization } = useOrganization();
  const plan = usePlan(!!session);
  const cappedDays = Math.min(days, plan.maxHistoryDays);
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ["dashboard-devices", session?.user?.id, orgId, cappedDays, projectId, filters?.source],
    refetchInterval: 60000,
    enabled: !authLoading && !!session?.access_token && !plan.loading && !!orgId,
    queryFn: async () => {
      const token = await getSession();
      return fetchEndpoint("get-dashboard-devices", cappedDays, projectId, token, { source: filters?.source });
    },
  });
};

export const useGeo = (days: number, projectId?: string, filters?: FetchOptions) => {
  const { getSession, session, loading: authLoading } = useValidSession();
  const { activeOrganization } = useOrganization();
  const plan = usePlan(!!session);
  const cappedDays = Math.min(days, plan.maxHistoryDays);
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ["dashboard-geo", session?.user?.id, orgId, cappedDays, projectId, filters?.source, filters?.device],
    refetchInterval: 60000,
    enabled: !authLoading && !!session?.access_token && !plan.loading && !!orgId,
    queryFn: async () => {
      const token = await getSession();
      return fetchEndpoint("get-dashboard-geo", cappedDays, projectId, token, filters);
    },
  });
};

// --- LEGACY COMPATIBILITY HOOK ---
export const useDashboardAnalytics = (days: number, projectId?: string, filters?: FetchOptions) => {
  const overview = useOverview(days, projectId, filters);
  const pages = useTopPages(days, projectId, filters);
  const sources = useTrafficSources(days, projectId, filters);
  const devices = useDevices(days, projectId, filters);
  const geo = useGeo(days, projectId, filters);

  const isLoading = overview.isLoading || pages.isLoading || sources.isLoading || devices.isLoading || geo.isLoading;
  const error = overview.error || pages.error || sources.error || devices.error || geo.error;

  const data = useMemo(() => {
    if (!overview.data) return undefined;
    
    return {
      ...overview.data,
      topPages: pages.data?.topPages || null,
      trafficSources: sources.data?.trafficSources || null,
      devices: devices.data?.devices || null,
      browsers: devices.data?.browsers || null,
      operatingSystems: devices.data?.operatingSystems || null,
      countries: geo.data?.countries || null,
      cities: geo.data?.cities || null,
    };
  }, [overview.data, pages.data, sources.data, devices.data, geo.data]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      overview.refetch();
      pages.refetch();
      sources.refetch();
      devices.refetch();
      geo.refetch();
    }
  };
};

/**
 * @deprecated useOrganization() should be used instead. 
 * Kept only for temporary bridge compatibility for components 
 * that still depend on the client's name or lead_value.
 */
export const useClientData = () => {
  const { activeOrganization, loading, error: orgError } = useOrganization();
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useOverview(30);
  
  const client = useMemo(() => {
    if (!activeOrganization) return null;

    return {
      // Temporarily map the active organization to the old 'client' structure
      id: activeOrganization.id,
      company_name: activeOrganization.name,
      // fallback to overview data if needed (e.g. lead_value which wasn't moved to org yet)
      lead_value: overviewData?.client?.lead_value || 25,
      projects: overviewData?.client?.projects || (overviewData?.client?.project ? [overviewData?.client?.project] : []),
    };
  }, [activeOrganization, overviewData]);

  return {
    data: client,
    isLoading: loading || overviewLoading,
    error: orgError || overviewError,
  };
};
