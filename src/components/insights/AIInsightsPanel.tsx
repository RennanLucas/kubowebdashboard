import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePlan } from "@/hooks/usePlan";
import { useRequestScope } from "@/hooks/useRequestScope";
import { requestEdgeFunction } from "@/lib/edge-functions";
import type { AIStatus } from "../../../supabase/functions/ai-weekly-insights/_service";

interface Status extends AIStatus { configured:boolean; model:string }
interface Props { projectId:string; periodDays:7|30; onGenerated:(insight:NonNullable<AIStatus["latest"]>) => void }
export function AIInsightsPanel({ projectId,periodDays,onGenerated }:Props) {
  const { user,session } = useAuth();
  const { activeOrganization } = useOrganization();
  const plan = usePlan();
  const canUseAI = !plan.loading && plan.can("ai_insights");
  const key = `kubo:ai-request:${user?.id}:${activeOrganization?.id}:${projectId}:${periodDays}`;
  const captureScope = useRequestScope(key);
  const queryClient = useQueryClient();
  const [generating,setGenerating] = useState(false);
  const [fault,setFault] = useState<string|null>(null);
  const busy = useRef(false);
  const delivered = useRef<string|null>(null);
  const pendingId = () => {
    try {
      const id = sessionStorage.getItem(key);
      if (id && !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) {
        sessionStorage.removeItem(key);
        return null;
      }
      return id;
    } catch { return null; }
  };
  const queryKey = ["paid-ai-status",user?.id,activeOrganization?.id,projectId,periodDays,canUseAI];
  const query = (action:string) => new URLSearchParams({
    action,project_id:projectId,organization_id:activeOrganization!.id,days:String(periodDays),
  });
  const status = useQuery({
    queryKey,enabled:canUseAI && !!session?.access_token && !!activeOrganization && !!projectId,
    retry:false,staleTime:15000,
    queryFn:({ signal }) => {
      const params = query("status"); const id = pendingId();
      if (id) params.set("request_id",id);
      return requestEdgeFunction<Status>("ai-weekly-insights",session!.access_token,{ query:params,signal });
    },
  });
  useEffect(() => {
    if (status.data?.state==="succeeded" && status.data.latest && delivered.current!==status.data.latest.id) {
      delivered.current=status.data.latest.id;
      onGenerated(status.data.latest);
    }
  },[status.data,onGenerated]);
  const generate = async () => {
    if (busy.current || !canUseAI || !session || !activeOrganization || !status.data?.configured || !status.data.can_generate) return;
    const isCurrent = captureScope();
    let id = pendingId();
    try {
      id ??= crypto.randomUUID();
      // Persist before a billable call. Reloads/retries must reuse the same ID.
      sessionStorage.setItem(key,id);
    } catch { setFault("Não foi possível guardar a solicitação neste navegador. Nenhuma geração foi iniciada."); return; }
    busy.current=true; setGenerating(true); setFault(null);
    try {
      const result = await requestEdgeFunction<Status>("ai-weekly-insights",session.access_token,{
        method:"POST",query:query("generate"),body:{ request_id:id,period_days:periodDays },
        signal: typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(60000) : undefined,
      });
      if (!isCurrent()) return;
      queryClient.setQueryData(queryKey,result);
      if (result.state==="succeeded") sessionStorage.removeItem(key);
    } catch (error) {
      if (!isCurrent()) return;
      setFault(error instanceof Error ? error.message : "Não foi possível concluir a solicitação.");
      // Read-only recovery, never automatically repeat the provider call.
      await status.refetch();
    } finally {
      busy.current=false;
      if (isCurrent()) setGenerating(false);
    }
  };
  const discard = () => {
    try { sessionStorage.removeItem(key); }
    catch { setFault("Não foi possível encerrar a solicitação neste navegador."); return; }
    setFault(null); void status.refetch();
  };
  if (!canUseAI) return null;
  const quota = status.data;
  const inFlight = quota?.state==="started";
  const terminal = quota?.state==="uncertain" || quota?.state==="failed" || (quota?.state==="succeeded" && !quota.latest);
  return <Card className="mb-6 overflow-hidden border-primary/20 p-4 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />Análise com IA · Pro</h2>
        <p className="text-sm text-muted-foreground">Uma análise do projeto selecionado por geração. A quota mensal é compartilhada por todos os membros da organização.</p>
        {quota && <p role="status" className="text-sm"><span className="font-semibold">{quota.remaining} de {quota.limit}</span> análises disponíveis neste mês · {quota.model}</p>}
        {quota?.resets_at && <p className="text-xs text-muted-foreground">Renova em {new Date(quota.resets_at).toLocaleDateString("pt-BR",{ timeZone:"UTC" })} (UTC).</p>}
      </div>
      <Button onClick={inFlight ? () => { void status.refetch(); } : generate}
        disabled={generating || status.isPending || status.isFetching || !quota || !quota.configured || !quota.can_generate
          || terminal || (!inFlight && quota.remaining<=0 && quota.state!=="reserved")}
        className="min-h-11 w-full shrink-0 gap-2 sm:w-auto">
        {generating || status.isFetching ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Sparkles className="h-4 w-4" />}
        {generating ? "Gerando com IA..." : inFlight ? "Consultar resultado" : pendingId() && quota?.state!=="succeeded" ? "Retomar solicitação" : "Gerar com IA"}
      </Button>
    </div>
    {quota && !quota.configured && <p role="status" className="mt-3 text-sm text-muted-foreground">A integração de IA ainda não está disponível. Nenhuma análise paga será iniciada.</p>}
    {quota && !quota.can_generate && <p className="mt-3 text-sm text-muted-foreground">Seu acesso é somente leitura. Peça a um administrador para gerar a análise.</p>}
    {inFlight && <p role="status" className="mt-3 text-sm">Esta solicitação está em processamento. Consulte seu resultado antes de iniciar outra.</p>}
    {quota?.state==="uncertain" && <p role="alert" className="mt-3 text-sm">Não foi possível confirmar a geração. Ela permanece contabilizada na quota porque a chamada pode ter sido processada. Encerrar a solicitação não devolve essa quota; uma nova análise utiliza outra geração.</p>}
    {terminal && <Button variant="outline" onClick={discard} disabled={generating || status.isFetching} className="mt-3">Encerrar solicitação</Button>}
    {(fault || status.error) && <div role="alert" className="mt-4 space-y-2 text-sm">
      <p className="break-words text-destructive">{fault ?? (status.error instanceof Error ? status.error.message : "Não foi possível consultar a quota.")}</p>
      <Button variant="outline" size="sm" onClick={() => { void status.refetch(); }} disabled={status.isFetching || generating} className="gap-2"><RefreshCw className="h-3 w-3" />Consultar solicitação</Button>
    </div>}
  </Card>;
}
