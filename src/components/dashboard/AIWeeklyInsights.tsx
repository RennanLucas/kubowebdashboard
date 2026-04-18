import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, RefreshCw, Lock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsightStatus {
  used: number;
  remaining: number;
  limit: number;
  latest: {
    id: string;
    content: string;
    created_at: string;
    period_days: number;
    model: string | null;
  } | null;
}

const callFn = async (action: "status" | "generate") => {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-weekly-insights?action=${action}`;
  const res = await fetch(url, {
    method: action === "generate" ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || json?.error || "Erro");
  return json as InsightStatus;
};

export const AIWeeklyInsights = () => {
  const [status, setStatus] = useState<InsightStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const s = await callFn("status");
      setStatus(s);
    } catch (e: any) {
      // silencioso, mostramos card vazio
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const s = await callFn("generate");
      setStatus(s);
      toast.success("Insights atualizados ✨");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar insights");
      load();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </Card>
    );
  }

  const remaining = status?.remaining ?? 0;
  const limit = status?.limit ?? 2;
  const latest = status?.latest;

  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Resumo semanal com IA</h3>
            <p className="text-xs text-muted-foreground">
              Análise automática dos últimos 7 dias
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={remaining > 0 ? "secondary" : "outline"} className="gap-1">
            <Calendar className="h-3 w-3" />
            {remaining}/{limit} este mês
          </Badge>
          <Button
            size="sm"
            onClick={generate}
            disabled={generating || remaining === 0}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : remaining === 0 ? (
              <Lock className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {latest ? "Regenerar" : "Gerar agora"}
          </Button>
        </div>
      </div>

      {!latest && !generating && (
        <div className="text-center py-8">
          <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Clique em <strong>Gerar agora</strong> para receber um resumo inteligente
            destacando tendências, picos e quedas dos seus dados.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Você tem {remaining} usos disponíveis este mês.
          </p>
        </div>
      )}

      {generating && !latest && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analisando seus dados com IA...</p>
        </div>
      )}

      {latest && (
        <>
          <div
            className="text-foreground leading-relaxed
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0
              [&_p]:text-sm [&_p]:text-foreground/90 [&_p]:mb-2
              [&_ul]:space-y-1.5 [&_ul]:my-2 [&_ul]:pl-0 [&_ul]:list-none
              [&_ul>li]:text-sm [&_ul>li]:text-foreground/90 [&_ul>li]:pl-5 [&_ul>li]:relative
              [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55rem] [&_ul>li]:before:w-1.5 [&_ul>li]:before:h-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-primary/70
              [&_strong]:text-foreground [&_strong]:font-semibold"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.content}</ReactMarkdown>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Gerado em{" "}
              {new Date(latest.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {remaining === 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                Limite mensal atingido — volta em {nextMonthLabel()}
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

const nextMonthLabel = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long" });
};
