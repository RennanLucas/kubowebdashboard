import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ChevronRight, Loader2, ListChecks, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChecklistState {
  hasProject: boolean;
  hasEvents: boolean;
  hasLeadValue: boolean;
  hasGoals: boolean;
  hasAnnotation: boolean;
}

interface Step {
  key: keyof ChecklistState;
  title: string;
  description: string;
  cta: string;
  ctaPath: string;
}

const STEPS: Step[] = [
  {
    key: "hasProject",
    title: "Criar seu primeiro projeto",
    description:
      "Cadastre o site que deseja monitorar. Você pode adicionar múltiplos projetos na mesma conta.",
    cta: "Criar projeto",
    ctaPath: "/onboarding",
  },
  {
    key: "hasEvents",
    title: "Instalar o script de tracking",
    description:
      "Copie o snippet de rastreamento e cole antes do </body> em todas as páginas do site. A confirmação é automática assim que o primeiro evento for recebido.",
    cta: "Copiar script",
    ctaPath: "/onboarding",
  },
  {
    key: "hasLeadValue",
    title: "Configurar o valor por lead",
    description:
      "Defina o valor monetário médio de um lead para que a plataforma calcule automaticamente o valor estimado e o ROI das campanhas.",
    cta: "Definir valor",
    ctaPath: "/settings",
  },
  {
    key: "hasGoals",
    title: "Definir metas mensais",
    description:
      "Estabeleça objetivos de visitantes, leads e faturamento para acompanhar o progresso ao longo do mês.",
    cta: "Configurar metas",
    ctaPath: "/settings",
  },
  {
    key: "hasAnnotation",
    title: "Registrar a primeira anotação",
    description:
      "Marque eventos relevantes (campanhas, lançamentos, ajustes no site) no gráfico para correlacionar variações de tráfego com ações realizadas.",
    cta: "Abrir Dashboard",
    ctaPath: "/dashboard",
  },
];

const STORAGE_KEY = "kuboweb_onboarding_dismissed_v1";

export function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [state, setState] = useState<ChecklistState>({
    hasProject: false,
    hasEvents: false,
    hasLeadValue: false,
    hasGoals: false,
    hasAnnotation: false,
  });
  const cancelledRef = useRef(false);
  const inFlightRef = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!user || inFlightRef.current) return;
      inFlightRef.current = true;
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        // 1. Cliente + valor por lead
        const { data: client } = await supabase
          .from("clients")
          .select("id, lead_value")
          .eq("user_id", user.id)
          .maybeSingle();

        const hasLeadValue =
          !!client && Number(client.lead_value ?? 0) > 0 && Number(client.lead_value) !== 25;

        if (!client) {
          if (!cancelledRef.current) {
            setState({
              hasProject: false,
              hasEvents: false,
              hasLeadValue: false,
              hasGoals: false,
              hasAnnotation: false,
            });
          }
          return;
        }

        // 2. Projetos
        const { data: projects } = await supabase
          .from("projects")
          .select("id")
          .eq("client_id", client.id);

        const projectIds = (projects ?? []).map((p) => p.id);
        const hasProject = projectIds.length > 0;

        if (!hasProject) {
          if (!cancelledRef.current) {
            setState({
              hasProject: false,
              hasEvents: false,
              hasLeadValue,
              hasGoals: false,
              hasAnnotation: false,
            });
          }
          return;
        }

        // 3..5 em paralelo
        const [pv, gl, an] = await Promise.all([
          supabase
            .from("pageviews")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
            .limit(1),
          supabase
            .from("goals")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
            .limit(1),
          supabase
            .from("annotations")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
            .limit(1),
        ]);

        const hasEvents = (pv.count ?? 0) > 0;
        const hasGoals = (gl.count ?? 0) > 0;
        const hasAnnotation = (an.count ?? 0) > 0;

        if (!cancelledRef.current) {
          setState({ hasProject, hasEvents, hasLeadValue, hasGoals, hasAnnotation });
        }
      } catch (err) {
        console.error("[OnboardingChecklist] failed", err);
      } finally {
        inFlightRef.current = false;
        if (!cancelledRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user]
  );

  // Carga inicial
  useEffect(() => {
    cancelledRef.current = false;
    load();
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  // Atualização automática ao voltar para a aba/janela ou trocar de projeto
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") load(true);
    };
    const handleFocus = () => load(true);
    const handleProjectChanged = () => load(true);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("project-changed", handleProjectChanged as EventListener);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("project-changed", handleProjectChanged as EventListener);
    };
  }, [load]);

  const completed = useMemo(
    () => STEPS.filter((s) => state[s.key]).length,
    [state]
  );
  const total = STEPS.length;
  const percent = Math.round((completed / total) * 100);
  const allDone = completed === total;

  const dismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
  if (allDone && dismissed) return null;

  return (
    <Card className="p-5 mb-4 border-primary/20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
              Checklist de onboarding
              {allDone ? (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                  Concluído
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  {completed}/{total}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allDone
                ? "Sua conta está totalmente configurada."
                : "Conclua os passos abaixo para extrair o máximo da plataforma."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!allDone && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => load(true)}
              disabled={refreshing || loading}
              title="Atualizar status"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          )}
          {allDone && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_KEY, "1");
                } catch {}
                window.location.reload();
              }}
            >
              Ocultar
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Progress value={percent} className="h-2" />
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
          <span>{percent}% concluído</span>
          <span>
            {completed} de {total} passos
          </span>
        </div>
      </div>

      <ol className="space-y-2">
        {STEPS.map((step, idx) => {
          const done = state[step.key];
          return (
            <li
              key={step.key}
              className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {loading ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={`text-sm font-medium ${
                      done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
              {!done && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-8 text-xs"
                  onClick={() => navigate(step.ctaPath)}
                >
                  {step.cta}
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
