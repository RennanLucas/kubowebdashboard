import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Download, FileText, FileType } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InfoTooltip } from "@/components/InfoTooltip";
import { InsightsHistoryPanel } from "@/components/insights/InsightsHistoryPanel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import logoKuboweb from "@/assets/logo-kuboweb.png";
import { generateInsightDetails, generateLocalInsights, type HourlyPoint, type InsightDetail } from "@/lib/local-insights";
import { compareInsightVersions, type InsightComparisonResult, type InsightHistoryRecord } from "@/lib/insight-history";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Insights() {
  const HISTORY_PAGE_SIZE = 8;
  const DETAIL_SOURCES_PAGE_SIZE = 5;
  const { user } = useAuth();
  const [periodDays, setPeriodDays] = useState<7 | 30>(30);
  const { data, isLoading, error } = useDashboardAnalytics(periodDays);
  const [analysis, setAnalysis] = useState<string>("");
  const [analysisDetails, setAnalysisDetails] = useState<InsightDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [history, setHistory] = useState<InsightHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);
  const [compareInsightId, setCompareInsightId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<InsightComparisonResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"history" | "generated" | null>(null);
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});
  const [visibleSourceCounts, setVisibleSourceCounts] = useState<Record<string, number>>({});
  const reportRef = useRef<HTMLElement>(null);
  const filteredHistory = history.filter((item) => item.period_days === periodDays);
  const hasHistoryForSelectedPeriod = filteredHistory.length > 0;
  const displayDetails = useMemo(() => {
    if (analysisDetails.length > 0) return analysisDetails;
    if (!analysis) return [];

    if (analysisSource === "history") {
      return [
        {
          title: "Detalhes indisponíveis nesta versão",
          reason: "Esta versão foi carregada do histórico salvo sem os detalhes estruturados exibidos no painel.",
          recommendation: "Clique em “Atualizar com IA” quando quiser gerar uma nova leitura com o detalhamento completo desta análise.",
          sources: [
            { label: "Origem", value: "Histórico salvo" },
            { label: "Período", value: `${periodDays} dias` },
          ],
        },
      ];
    }

    return [
      {
        title: "Detalhes ainda não disponíveis",
        reason: "Esta análise não possui o detalhamento estruturado necessário para preencher este painel no momento.",
        recommendation: "Clique em “Atualizar com IA” para gerar uma nova versão com explicações detalhadas e fontes resumidas.",
        sources: [
          { label: "Origem", value: analysisSource === "generated" ? "Análise atual" : "Indefinida" },
          { label: "Período", value: `${periodDays} dias` },
        ],
      },
    ];
  }, [analysis, analysisDetails, analysisSource, periodDays]);

  const applyHistoryItem = (item: InsightHistoryRecord) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setAnalysis(item.content);
    setAnalysisDetails([]);
    setOpenSources({});
    setVisibleSourceCounts({});
    setActiveInsightId(item.id);
    setCompareInsightId(null);
    setComparison(null);
    setAnalysisSource("history");
    setPeriodDays(item.period_days === 7 ? 7 : 30);
  };

  const buildInsightDetails = async () => {
    const hourlyDistribution = await fetchHourly();

    return generateInsightDetails({
      days: periodDays,
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
  };

  const retryDetails = async () => {
    if (!analysis || analysisSource !== "generated") return;

    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const details = await buildInsightDetails();
      setAnalysisDetails(details);
      setOpenSources({});
      setVisibleSourceCounts({});
    } catch (e: any) {
      setDetailsError(e?.message || "Não foi possível carregar os detalhes desta análise.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleSource = (title: string) => {
    setOpenSources((current) => ({
      ...current,
      [title]: !current[title],
    }));
    setVisibleSourceCounts((current) => ({
      ...current,
      [title]: current[title] ?? DETAIL_SOURCES_PAGE_SIZE,
    }));
  };

  const loadMoreSources = (title: string) => {
    setVisibleSourceCounts((current) => ({
      ...current,
      [title]: (current[title] ?? DETAIL_SOURCES_PAGE_SIZE) + DETAIL_SOURCES_PAGE_SIZE,
    }));
  };

  const exportMarkdown = () => {
    const blob = new Blob([analysis], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-insights-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerHeight = 22; // espaço reservado para a logo na primeira página
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const firstPageContentHeight = usableHeight - headerHeight - 4;
      const imgWidth = usableWidth;

      // Carrega logo como dataURL para embed
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = logoKuboweb;
      await new Promise<void>((resolve) => {
        if (logoImg.complete) resolve();
        else {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve();
        }
      });

      const drawHeader = (companyName: string) => {
        // Logo (mantém aspect ratio do arquivo 851x219 ≈ 3.88:1)
        const logoH = 12;
        const logoW = logoH * (logoImg.width && logoImg.height ? logoImg.width / logoImg.height : 3.88);
        try {
          pdf.addImage(logoImg, "PNG", margin, margin, logoW, logoH);
        } catch {
          // ignora se falhar
        }
        // Texto à direita
        pdf.setFontSize(9);
        pdf.setTextColor(110);
        pdf.text(companyName, pageWidth - margin, margin + 5, { align: "right" });
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
          pageWidth - margin,
          margin + 10,
          { align: "right" },
        );
        // Linha divisória
        pdf.setDrawColor(220);
        pdf.setLineWidth(0.2);
        pdf.line(margin, margin + headerHeight - 4, pageWidth - margin, margin + headerHeight - 4);
      };

      const companyName = data?.client?.company_name || "Relatório de Performance";

      let renderedHeight = 0;
      let pageIndex = 0;
      while (renderedHeight < canvas.height) {
        const isFirst = pageIndex === 0;
        const contentHeightMm = isFirst ? firstPageContentHeight : usableHeight;
        const pageHeightPx = (canvas.width * contentHeightMm) / usableWidth;
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;

        if (pageIndex > 0) pdf.addPage();
        if (isFirst) drawHeader(companyName);
        const yPos = isFirst ? margin + headerHeight : margin;
        pdf.addImage(imgData, "JPEG", margin, yPos, imgWidth, sliceImgHeight);
        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          `KUBOWEB  •  Relatório de Insights  •  Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" },
        );
      }

      pdf.save(`relatorio-insights-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exportado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  const fetchHourly = async (): Promise<HourlyPoint[]> => {
    const projectId = data?.client?.project?.id ?? data?.client?.projects?.[0]?.id;
    if (!projectId) return [];
    const since = new Date();
    since.setDate(since.getDate() - periodDays);
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

  const loadHistory = async (options?: { append?: boolean }) => {
    if (!user) return;

    const append = options?.append ?? false;
    const currentHistory = append ? history : [];
    const nextOffset = append ? currentHistory.length : 0;

    if (append) setHistoryLoadingMore(true);
    else setHistoryLoading(true);
    const projectId = data?.client?.project?.id ?? data?.client?.projects?.[0]?.id ?? null;

    let query = supabase
      .from("ai_insights")
      .select("id, content, created_at, period_days, model, project_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(nextOffset, nextOffset + HISTORY_PAGE_SIZE - 1);

    if (projectId) query = query.eq("project_id", projectId);

    const { data: rows, error: historyError } = await query;

    if (historyError) {
      toast.error("Erro ao carregar histórico de insights");
    } else if (rows) {
      const mergedRows = append ? [...currentHistory, ...rows] : rows;
      setHistory(mergedRows);
      setHasMoreHistory(rows.length === HISTORY_PAGE_SIZE);

      const matchingPeriodHistory = mergedRows.find((item) => item.period_days === periodDays);
      const fallbackHistory = matchingPeriodHistory ?? mergedRows[0];

      if (!append && !analysis && fallbackHistory) applyHistoryItem(fallbackHistory);
      else if (!activeInsightId && fallbackHistory) setActiveInsightId(fallbackHistory.id);
    }

    if (append) setHistoryLoadingMore(false);
    else setHistoryLoading(false);
  };

  const generate = async () => {
    setGenerating(true);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const hourlyDistribution = await fetchHourly();
      const result = generateLocalInsights({
        days: periodDays,
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
      try {
        const details = generateInsightDetails({
          days: periodDays,
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
        setAnalysisDetails(details);
      } catch (detailsErr: any) {
        setAnalysisDetails([]);
        setDetailsError(detailsErr?.message || "Não foi possível carregar os detalhes desta análise.");
      }
      setOpenSources({});
      setVisibleSourceCounts({});
      setCompareInsightId(null);
      setComparison(null);
      setAnalysisSource("generated");
      setDetailsLoading(false);

      if (user) {
        const projectId = data?.client?.project?.id ?? data?.client?.projects?.[0]?.id ?? null;
        const { data: insertedInsight, error: insertError } = await supabase
          .from("ai_insights")
          .insert({
            content: result,
            model: "kuboweb-local-insights",
            period_days: periodDays,
            project_id: projectId,
            user_id: user.id,
          })
          .select("id, content, created_at, period_days, model, project_id")
          .single();

        if (insertError) {
          toast.error("Erro ao salvar a geração no histórico");
        } else if (insertedInsight) {
          setActiveInsightId(insertedInsight.id);
          setCompareInsightId(null);
          setComparison(null);
        }

        await loadHistory();
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar análise");
    } finally {
      setDetailsLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!user || !data) return;
    loadHistory();
  }, [user?.id, data?.client?.project?.id]);

  useEffect(() => {
    if (!compareInsightId || !analysis) {
      setComparison(null);
      return;
    }

    const compareTarget = history.find((item) => item.id === compareInsightId);
    setComparison(compareTarget ? compareInsightVersions(analysis, compareTarget.content) : null);
  }, [compareInsightId, history, analysis]);

  useEffect(() => {
    if (!detailsLoading) return;

    if (analysisSource === "history" && analysis) {
      setDetailsLoading(false);
      return;
    }

    if (analysisSource === "generated" && (analysisDetails.length > 0 || detailsError)) {
      setDetailsLoading(false);
    }
  }, [analysis, analysisDetails.length, analysisSource, detailsError, detailsLoading]);

  const handlePeriodChange = (nextPeriod: 7 | 30) => {
    if (nextPeriod === periodDays) return;
    const matchingHistory = history.find((item) => item.period_days === nextPeriod);
    setPeriodDays(nextPeriod);

    if (matchingHistory) {
      applyHistoryItem(matchingHistory);
    } else {
      setActiveInsightId(null);
      setCompareInsightId(null);
      setComparison(null);
      setAnalysis("");
      setAnalysisDetails([]);
      setDetailsLoading(false);
      setDetailsError(null);
      setAnalysisSource(null);
      setOpenSources({});
      setVisibleSourceCounts({});
    }
  };

  const handleRestoreHistory = (item: InsightHistoryRecord) => {
    applyHistoryItem(item);
  };

  const handleToggleCompare = (itemId: string) => {
    setCompareInsightId((current) => (current === itemId ? null : itemId));
  };

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

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
              Ao gerar a análise, a IA cruza os dados dos últimos {periodDays} dias e monta um relatório com insights, riscos, oportunidades e ações sugeridas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
              {[7, 30].map((days) => {
                const isActive = periodDays === days;

                return (
                  <Button
                    key={days}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePeriodChange(days as 7 | 30)}
                    disabled={generating || isLoading}
                    className="min-w-12"
                  >
                    {days}d
                  </Button>
                );
              })}
            </div>
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
               {generating ? "Atualizando com IA..." : analysis ? "Atualizar com IA" : "Gerar com IA"}
            </Button>
          </div>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          A nova versão só é criada quando você clicar no botão. Enquanto a atualização roda, a versão atual continua visível e o histórico anterior é preservado.
        </p>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Nota sobre a IA</span>
          <InfoTooltip
            side="right"
            content={
              <div className="space-y-2">
                <p>
                  A IA interpreta métricas de tráfego, conversões, dispositivos, origens, páginas e padrões por horário para sugerir oportunidades e riscos.
                </p>
                <p>
                  No momento, os resultados podem usar dados simulados em partes do ambiente de demonstração. As recomendações devem servir como apoio à análise, não como decisão automática.
                </p>
              </div>
            }
          />
          <p className="leading-relaxed">
            Os insights são gerados a partir dos dados exibidos no dashboard. Em ambientes de demonstração, parte da base ainda pode ser mockada.
          </p>
        </div>

        <Card className="mb-6 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                {!hasHistoryForSelectedPeriod
                  ? `Atualização com IA necessária para ${periodDays} dias`
                  : analysisSource === "generated"
                    ? `Análise de ${periodDays} dias atualizada com IA`
                    : `Histórico de ${periodDays} dias carregado sem IA`}
              </p>
              <p className="text-muted-foreground">
                {!hasHistoryForSelectedPeriod
                  ? "Ainda não existe uma versão salva para esse período. Se quiser visualizar esse recorte, gere uma nova análise manualmente."
                  : analysisSource === "generated"
                    ? "Você está vendo uma versão recém-atualizada. Só será necessário rodar IA de novo se quiser renovar os insights."
                    : "Você está vendo uma versão já salva no histórico. Só use a atualização com IA se quiser gerar uma leitura nova dos dados."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="mb-6 p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">O que a IA analisa</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A IA cruza os principais sinais do período para transformar números soltos em leitura de desempenho e oportunidades de ação.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Tráfego",
                  description: "Volume de visitantes, evolução no período e tendências de alta ou queda.",
                  example: "Ex.: crescimento acima da média nos últimos dias ou perda de volume em relação ao período anterior.",
                },
                {
                  title: "Conversões",
                  description: "Leads, cliques em WhatsApp, formulários e CTAs com mais resposta.",
                  example: "Ex.: qual caminho gera mais conversões e onde existe fricção no funil.",
                },
                {
                  title: "Origem dos acessos",
                  description: "Canais e fontes que mais trazem visitantes para o site.",
                  example: "Ex.: dependência excessiva de um canal ou oportunidade em busca orgânica e social.",
                },
                {
                  title: "Engajamento",
                  description: "Comportamento dos visitantes nas páginas, rejeição e qualidade da navegação.",
                  example: "Ex.: páginas com muito acesso, mas pouco avanço para conversão.",
                },
                {
                  title: "Sazonalidade",
                  description: "Padrões por dia da semana e horários com maior atenção.",
                  example: "Ex.: melhores janelas para publicar, anunciar ou reforçar ofertas.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {!generating && !historyLoading && !hasHistoryForSelectedPeriod && (
          <Card className="mb-6 border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Nenhum histórico salvo para {periodDays} dias</p>
                <p className="text-muted-foreground">
                  Se você quiser esse período, gere uma nova análise manualmente. Enquanto isso, não vamos consumir IA automaticamente.
                </p>
              </div>
            </div>
          </Card>
        )}

        {!analysis && !generating && (
          <Card className="p-12 text-center border-dashed">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Pronto para gerar sua análise com IA</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Ao clicar em "Gerar análise com IA", o sistema processa os dados dos últimos {periodDays} dias e entrega um relatório com resumo executivo, destaques, pontos de atenção e próximos passos.
            </p>
          </Card>
        )}

        {generating && (
          <Card className="p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Gerando análise com IA</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A IA está lendo os dados dos últimos {periodDays} dias para montar o diagnóstico. Quando terminar, o relatório aparecerá nesta tela com os insights principais e a opção de ver os detalhes de cada recomendação.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Status atual: coletando métricas, cruzando padrões e organizando os resultados.
            </p>
          </Card>
        )}

        {analysis && !generating && (
          <div className="space-y-6">
            <InsightsHistoryPanel
              activeInsightId={activeInsightId}
              compareInsightId={compareInsightId}
              comparison={comparison}
              history={filteredHistory}
              loading={historyLoading}
              loadingMore={historyLoadingMore}
              hasMore={hasMoreHistory}
              onRestore={handleRestoreHistory}
              onLoadMore={() => loadHistory({ append: true })}
              onToggleCompare={handleToggleCompare}
            />

            <Card className="p-8 sm:p-10 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Relatório gerado com IA</h2>
                  <p className="text-sm text-muted-foreground">Expanda os detalhes para entender o motivo por trás de cada recomendação.</p>
                </div>
                <Accordion type="single" collapsible className="w-full sm:w-auto">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:no-underline sm:min-w-52">
                      Ver detalhes da IA
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        {detailsLoading ? (
                          <div className="space-y-3">
                            <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-11/12" />
                              <Skeleton className="h-9 w-28" />
                            </div>
                            <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-10/12" />
                            </div>
                          </div>
                        ) : detailsError ? (
                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                            <p className="text-sm font-medium text-foreground">Não foi possível carregar os detalhes da IA</p>
                            <p className="mt-1 text-sm text-muted-foreground">{detailsError}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={retryDetails}
                              disabled={analysisSource !== "generated"}
                              className="mt-3"
                            >
                              Tentar novamente
                            </Button>
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {displayDetails.map((detail) => (
                              <li key={detail.title} className="rounded-lg border border-border bg-background p-4 text-sm text-foreground/90">
                                <p className="font-medium text-foreground">• {detail.title}</p>
                                <p className="mt-1 text-muted-foreground">{detail.reason}</p>
                                <p className="mt-1"><span className="font-medium text-foreground">Ação sugerida:</span> {detail.recommendation}</p>
                                <div className="mt-3 flex flex-col items-start gap-3">
                                  {detail.sources.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSource(detail.title)}
                                    >
                                      {openSources[detail.title] ? "Ocultar fonte" : "Ver fonte"}
                                    </Button>
                                  )}
                                  {openSources[detail.title] && detail.sources.length > 0 && (
                                    <div className="w-full rounded-md border border-border bg-muted/30 p-3">
                                      <p className="text-xs font-medium text-foreground">Métricas que alimentaram este insight</p>
                                      <ul className="mt-2 space-y-2">
                                        {detail.sources.slice(0, visibleSourceCounts[detail.title] ?? DETAIL_SOURCES_PAGE_SIZE).map((source) => (
                                          <li key={`${detail.title}-${source.label}`} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                            <span className="text-xs text-muted-foreground">{source.label}</span>
                                            <span className="text-sm font-medium text-foreground">{source.value}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      {detail.sources.length > (visibleSourceCounts[detail.title] ?? DETAIL_SOURCES_PAGE_SIZE) && (
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                          <p className="text-xs text-muted-foreground">
                                            Mostrando {Math.min(visibleSourceCounts[detail.title] ?? DETAIL_SOURCES_PAGE_SIZE, detail.sources.length)} de {detail.sources.length} fontes
                                          </p>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => loadMoreSources(detail.title)}
                                          >
                                            Carregar mais
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
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
          </div>
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
