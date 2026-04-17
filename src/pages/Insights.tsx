import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Download, FileText, FileType } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardAnalytics, useClientData } from "@/hooks/useDashboardData";
import { generateLocalInsights, type HourlyPoint } from "@/lib/local-insights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Insights() {
  const { data, isLoading, error } = useDashboardAnalytics(30);
  const { data: client } = useClientData();
  const [analysis, setAnalysis] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  const fetchHourly = async (): Promise<HourlyPoint[]> => {
    const projectId = (client as any)?.projects?.[0]?.id;
    if (!projectId) return [];
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: rows, error: pvError } = await supabase
      .from("pageviews")
      .select("created_at")
      .eq("project_id", projectId)
      .gte("created_at", since.toISOString())
      .limit(10000);
    if (pvError || !rows) return [];
    const buckets = new Array(24).fill(0);
    for (const r of rows) {
      const h = new Date(r.created_at as string).getHours();
      if (h >= 0 && h < 24) buckets[h] += 1;
    }
    return buckets.map((visitors, hour) => ({ hour, visitors }));
  };

  const generate = async () => {
    setGenerating(true);
    setAnalysis("");
    try {
      await new Promise((r) => setTimeout(r, 300));
      const hourlyDistribution = await fetchHourly();
      const result = generateLocalInsights({
        days: 30,
        metrics: data?.metrics ?? [],
        conversions: {
          whatsapp_clicks: data?.conversions?.whatsapp_clicks ?? 0,
          form_submissions: data?.conversions?.form_submissions ?? 0,
          button_clicks: data?.conversions?.button_clicks ?? 0,
        },
        trafficSources: data?.trafficSources ?? [],
        topPages: data?.topPages ?? [],
        engagement: data?.engagement,
        comparison: data?.comparison,
        devices: data?.devices ?? [],
        countries: data?.countries ?? [],
        hourlyDistribution,
      });
      setAnalysis(result);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar análise");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Insights Automáticos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise automática dos seus dados dos últimos 30 dias — gratuita e instantânea
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analysis && !generating && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={exporting} className="gap-2">
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
                    <FileType className="h-4 w-4" />
                    Exportar como PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportMarkdown} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Exportar como Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={generate} disabled={generating || isLoading} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {analysis ? "Regenerar" : "Gerar análise"}
            </Button>
          </div>
        </div>

        {!analysis && !generating && (
          <Card className="p-12 text-center border-dashed">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Análise inteligente dos seus dados</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Clique em "Gerar análise" para receber recomendações automáticas
              sobre tráfego, conversões, sazonalidade e oportunidades de crescimento.
            </p>
          </Card>
        )}

        {generating && (
          <Card className="p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Analisando seus dados...</p>
          </Card>
        )}

        {analysis && !generating && (
          <Card className="p-8 sm:p-10">
            <article ref={reportRef} className="text-foreground leading-relaxed space-y-4 bg-card
              [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mb-2 [&_h1]:mt-0
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:text-sm [&_p]:text-foreground/90 [&_p]:leading-relaxed
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_ul]:space-y-2 [&_ul]:my-3 [&_ul]:pl-0 [&_ul]:list-none
              [&_ul>li]:text-sm [&_ul>li]:text-foreground/90 [&_ul>li]:pl-5 [&_ul>li]:relative
              [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55rem] [&_ul>li]:before:w-2 [&_ul>li]:before:h-2 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-primary/70
              [&_ol]:space-y-2 [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal
              [&_ol>li]:text-sm [&_ol>li]:text-foreground/90 [&_ol>li]:pl-1
              [&_code]:bg-muted [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
              [&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_table]:border [&_table]:border-border [&_table]:rounded-lg [&_table]:overflow-hidden
              [&_thead]:bg-muted/50
              [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide
              [&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-border [&_td]:text-foreground/90
              [&_tr:hover]:bg-muted/30
              [&_hr]:my-6 [&_hr]:border-border
              [&_em]:text-muted-foreground [&_em]:text-xs [&_em]:not-italic [&_em]:block">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
            </article>
          </Card>
        )}

        {!data?.metrics?.length && !isLoading && (
          <Card className="p-6 mt-4 bg-warning/5 border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                Ainda não há dados suficientes para análise. Instale o tracking primeiro em Configurações.
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
