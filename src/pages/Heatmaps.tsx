import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Activity, ExternalLink, Flame, Globe2, Loader2, MousePointer2, Play, Save, Settings, ShieldCheck } from "lucide-react";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { supabase } from "@/integrations/supabase/client";

const clarityIdPattern = /^[A-Za-z0-9_-]{5,64}$/;

export default function Heatmaps() {
  const { selectedProjectId } = useSelectedProject();
  const { data, isLoading } = useDashboardAnalytics(7, selectedProjectId);
  const projectId = selectedProjectId || data?.client?.project?.id;
  const topPages = data?.topPages || [];
  const [clarityId, setClarityId] = useState("");
  const [savedClarityId, setSavedClarityId] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setClarityId("");
      setSavedClarityId("");
      return;
    }
    setLoadingConfig(true);
    supabase.from("projects").select("clarity_project_id").eq("id", projectId).maybeSingle().then(({ data: project, error }) => {
      if (cancelled) return;
      const value = error ? "" : project?.clarity_project_id || "";
      setClarityId(value);
      setSavedClarityId(value);
      setLoadingConfig(false);
    });
    return () => { cancelled = true; };
  }, [projectId]);

  const totalViews = useMemo(() => topPages.reduce((sum, page) => sum + page.views, 0), [topPages]);

  const saveClarity = async () => {
    if (!projectId) return;
    const normalized = clarityId.trim();
    if (normalized && !clarityIdPattern.test(normalized)) {
      toast.error("Use somente o ID do projeto do Clarity, com 5 a 64 letras, números, _ ou -.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("projects").update({ clarity_project_id: normalized || null }).eq("id", projectId);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar. Confirme sua permissão nesse projeto.");
      return;
    }
    setSavedClarityId(normalized);
    setIsConfiguring(false);
    toast.success(normalized ? "Clarity conectado a este projeto." : "Integração removida deste projeto.");
  };

  const clarityBase = savedClarityId ? `https://clarity.microsoft.com/projects/view/${encodeURIComponent(savedClarityId)}` : "";

  return <AppLayout>
    <Helmet><title>Heatmaps e Gravações — KUBOWEB</title><meta name="description" content="Conecte o Microsoft Clarity ao projeto selecionado para analisar heatmaps e sessões reais." /><link rel="canonical" href="https://kubowebdashboard.vercel.app/heatmaps" /></Helmet>
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <header className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/15 via-background to-rose-500/10 p-6 sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300"><Activity className="h-3.5 w-3.5" />Experiência visual conectada ao Microsoft Clarity</div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><Flame className="h-8 w-8 text-orange-500" />Heatmaps e sessões</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Use as páginas reais do Kubo para priorizar sua análise e abra mapas de calor e gravações no painel oficial do Clarity.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setIsConfiguring((value) => !value)}><Settings className="mr-2 h-4 w-4" />Configurar</Button>{clarityBase && <Button asChild className="bg-orange-600 text-white hover:bg-orange-700"><a href={`${clarityBase}/recordings`} target="_blank" rel="noreferrer"><Play className="mr-2 h-4 w-4" />Assistir sessões</a></Button>}</div>
        </div>
      </header>

      {isConfiguring && <Card className="border-orange-500/25"><CardContent className="space-y-5 p-6"><div><h2 className="text-lg font-semibold">Conectar este projeto ao Clarity</h2><p className="mt-1 text-sm text-muted-foreground">O ID fica salvo no projeto, compartilhado com a equipe e nunca é reaproveitado em outro site.</p></div><ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground"><li>Crie ou abra o site em <a className="font-medium text-orange-600 hover:underline" href="https://clarity.microsoft.com/" target="_blank" rel="noreferrer">clarity.microsoft.com</a>.</li><li>Em Settings → Overview, copie apenas o Project ID.</li><li>Salve abaixo. O tracker do Kubo carregará o Clarity para esse projeto.</li></ol><div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />No modo LGPD estrito, o Clarity só é carregado depois do consentimento para Analytics.</div><div className="flex max-w-xl flex-col gap-3 sm:flex-row"><div className="flex-1"><Label htmlFor="clarity-id" className="sr-only">Project ID do Clarity</Label><Input id="clarity-id" value={clarityId} onChange={(event) => setClarityId(event.target.value)} placeholder="Ex.: a1b2c3d4e5" /></div><Button onClick={saveClarity} disabled={saving || loadingConfig}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar integração</Button></div>{savedClarityId && <button className="text-xs text-destructive hover:underline" onClick={() => setClarityId("")}>Remover integração ao salvar</button>}</CardContent></Card>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.65fr]">
        <Card className="overflow-hidden"><CardContent className="p-0"><div className="border-b bg-muted/30 p-5"><h2 className="font-semibold">Páginas prioritárias</h2><p className="text-xs text-muted-foreground">Dados reais dos últimos 7 dias</p></div><div className="divide-y">{isLoading ? <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Carregando páginas</div> : topPages.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Ainda não há páginas rastreadas.</div> : topPages.map((page, index) => <div key={page.path} className="flex items-center gap-3 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-bold text-orange-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{page.path}</p><p className="text-xs text-muted-foreground">{page.views.toLocaleString("pt-BR")} visualizações</p></div>{clarityBase && <Button asChild size="icon" variant="ghost" title="Abrir no Clarity"><a href={`${clarityBase}/heatmaps`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}</div>)}</div></CardContent></Card>

        <Card className="overflow-hidden border-orange-500/15"><CardContent className="p-0"><div className="grid gap-px bg-border sm:grid-cols-3"><div className="bg-card p-5"><Globe2 className="mb-3 h-5 w-5 text-orange-500" /><p className="text-2xl font-bold">{topPages.length}</p><p className="text-xs text-muted-foreground">páginas analisáveis</p></div><div className="bg-card p-5"><MousePointer2 className="mb-3 h-5 w-5 text-rose-500" /><p className="text-2xl font-bold">{totalViews.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">visualizações no período</p></div><div className="bg-card p-5"><ShieldCheck className="mb-3 h-5 w-5 text-emerald-500" /><p className="text-2xl font-bold">{savedClarityId ? "Conectado" : "Pendente"}</p><p className="text-xs text-muted-foreground">status da integração</p></div></div><div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/20"><Flame className="h-10 w-10" /></div><h2 className="text-2xl font-bold">{savedClarityId ? "Dados visuais prontos no Clarity" : "Conecte para liberar mapas reais"}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{savedClarityId ? "O Kubo não exibe uma simulação. Abra o painel oficial para consultar cliques, rolagem e gravações reais." : "Adicione o Project ID uma vez. A configuração será aplicada somente ao projeto selecionado."}</p><Button className="mt-6 bg-orange-600 text-white hover:bg-orange-700" onClick={() => setIsConfiguring(true)}>{savedClarityId ? "Alterar integração" : "Conectar Microsoft Clarity"}</Button>{clarityBase && <Button asChild variant="link" className="mt-1 text-orange-600"><a href={`${clarityBase}/heatmaps`} target="_blank" rel="noreferrer">Abrir heatmaps <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}</div></CardContent></Card>
      </div>
    </div>
  </AppLayout>;
}
