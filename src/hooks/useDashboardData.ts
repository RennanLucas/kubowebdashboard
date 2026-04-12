import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export const useClientData = () => {
  return useQuery({
    queryKey: ["client-data"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*, projects(*)")
        .limit(1)
        .single();
      if (error) throw error;
      return clients;
    },
  });
};

export const useWebsiteMetrics = (projectId: string | undefined, days: number) => {
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["website-metrics", projectId, days],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_metrics")
        .select("*")
        .eq("project_id", projectId!)
        .gte("date", startDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useTrafficSources = (projectId: string | undefined, days: number) => {
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["traffic-sources", projectId, days],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traffic_sources")
        .select("*")
        .eq("project_id", projectId!)
        .gte("date", startDate)
        .order("source");
      if (error) throw error;

      // Aggregate by source
      const grouped = data.reduce<Record<string, number>>((acc, row) => {
        acc[row.source] = (acc[row.source] || 0) + row.visitors;
        return acc;
      }, {});

      const total = Object.values(grouped).reduce((s, v) => s + v, 0);
      const colorMap: Record<string, string> = {
        Google: "hsl(var(--chart-blue))",
        "Redes Sociais": "hsl(var(--chart-purple))",
        Direto: "hsl(var(--chart-green))",
        "Anúncios": "hsl(var(--chart-orange))",
      };

      return Object.entries(grouped)
        .map(([source, visitors]) => ({
          source,
          visitors,
          percentage: Math.round((visitors / total) * 100),
          color: colorMap[source] || "hsl(var(--chart-blue))",
        }))
        .sort((a, b) => b.visitors - a.visitors);
    },
  });
};

export const usePageMetrics = (projectId: string | undefined, days: number) => {
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["page-metrics", projectId, days],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_metrics")
        .select("*")
        .eq("project_id", projectId!)
        .gte("date", startDate)
        .order("views", { ascending: false });
      if (error) throw error;

      // Aggregate by page_path
      const grouped = data.reduce<Record<string, { views: number; totalTime: number; totalBounce: number; count: number }>>((acc, row) => {
        if (!acc[row.page_path]) {
          acc[row.page_path] = { views: 0, totalTime: 0, totalBounce: 0, count: 0 };
        }
        acc[row.page_path].views += row.views;
        acc[row.page_path].totalTime += Number(row.avg_time_on_page);
        acc[row.page_path].totalBounce += Number(row.bounce_rate);
        acc[row.page_path].count += 1;
        return acc;
      }, {});

      const nameMap: Record<string, string> = {
        "/": "Página Inicial",
        "/servicos": "Serviços",
        "/contato": "Contato",
        "/sobre": "Sobre Nós",
        "/portfolio": "Portfólio",
      };

      return Object.entries(grouped)
        .map(([path, d]) => {
          const avgSeconds = Math.round(d.totalTime / d.count);
          const mins = Math.floor(avgSeconds / 60);
          const secs = avgSeconds % 60;
          return {
            path,
            name: nameMap[path] || path,
            views: d.views,
            avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
            bounceRate: Number((d.totalBounce / d.count).toFixed(1)),
          };
        })
        .sort((a, b) => b.views - a.views);
    },
  });
};
