import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Insights() {
  const { data, isLoading, error } = useDashboardAnalytics(30);
  const [analysis, setAnalysis] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  const generate = async () => {
    setGenerating(true);
    setAnalysis("");
    try {
      const summary = {
        days: 30,
        totalVisitors: data?.metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0,
        totalLeads: data?.metrics?.reduce((s, m) => s + m.leads, 0) ?? 0,
        estimatedValue: data?.metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0,
        whatsappClicks: data?.conversions?.whatsapp_clicks ?? 0,
        formSubmissions: data?.conversions?.form_submissions ?? 0,
        buttonClicks: data?.conversions?.button_clicks ?? 0,
        trafficSources: data?.trafficSources?.slice(0, 5) ?? [],
        topPages: data?.topPages?.slice(0, 5) ?? [],
        engagement: data?.engagement,
        comparison: data?.comparison,
        devices: data?.devices?.slice(0, 5) ?? [],
        countries: data?.countries?.slice(0, 5) ?? [],
      };

      const { data: result, error: fnError } = await supabase.functions.invoke("ai-insights", {
        body: { summary },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setAnalysis(result.analysis || "Sem análise disponível.");
    } catch (e: any) {
      const msg = e?.message || "Erro ao gerar análise";
      if (msg.includes("429")) toast.error("Muitas requisições. Aguarde um momento.");
      else if (msg.includes("402")) toast.error("Créditos de IA esgotados. Adicione mais em Configurações.");
      else toast.error(msg);
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
              Insights com IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise automática dos seus dados pelos últimos 30 dias
            </p>
          </div>
          <Button onClick={generate} disabled={generating || isLoading} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {analysis ? "Regenerar" : "Gerar análise"}
          </Button>
        </div>

        {!analysis && !generating && (
          <Card className="p-12 text-center border-dashed">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Análise inteligente dos seus dados</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Clique em "Gerar análise" para que a IA analise seu desempenho e gere recomendações
              personalizadas sobre tráfego, conversões e oportunidades de crescimento.
            </p>
          </Card>
        )}

        {generating && (
          <Card className="p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">A IA está analisando seus dados...</p>
          </Card>
        )}

        {analysis && !generating && (
          <Card className="p-8">
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
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
