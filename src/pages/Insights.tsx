import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Download, FileText, FileType } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import logoKuboweb from "@/assets/logo-kuboweb.png";
import { generateInsightDetails, generateLocalInsights, type HourlyPoint, type InsightDetail } from "@/lib/local-insights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Insights() {
  const [periodDays, setPeriodDays] = useState<7 | 30>(30);
  const { data, isLoading, error } = useDashboardAnalytics(periodDays);
  const [analysis, setAnalysis] = useState<string>("");
  const [analysisDetails, setAnalysisDetails] = useState<InsightDetail[]>([]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pendingAutoGenerate, setPendingAutoGenerate] = useState(false);
  const reportRef = useRef<HTMLElement>(null);

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

  const generate = async () => {
    setGenerating(true);
    setAnalysis("");
    setAnalysisDetails([]);
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
      setAnalysis(result);
      setAnalysisDetails(details);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar análise");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!pendingAutoGenerate || isLoading || !data) return;

    generate();
    setPendingAutoGenerate(false);
  }, [pendingAutoGenerate, isLoading, data]);

  const handlePeriodChange = (nextPeriod: 7 | 30) => {
    if (nextPeriod === periodDays) return;
    setPeriodDays(nextPeriod);
    setPendingAutoGenerate(true);
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
              A IA analisa tráfego, conversões, engajamento, origem dos acessos e sazonalidade dos últimos {periodDays} dias para gerar recomendações acionáveis.
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
               {generating ? "Gerando com IA..." : analysis ? "Gerar novamente com IA" : "Gerar com IA"}
            </Button>
          </div>
        </div>

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

        {!analysis && !generating && (
          <Card className="p-12 text-center border-dashed">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Gere seus insights com IA</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Clique em "Gerar com IA" para cruzar os dados dos últimos {periodDays} dias e receber um resumo com padrões, riscos, oportunidades e próximos passos.
            </p>
          </Card>
        )}

        {generating && (
          <Card className="p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Gerando insights com IA</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A IA está lendo os dados dos últimos {periodDays} dias para montar um diagnóstico com os pontos mais relevantes de tráfego, conversões, engajamento e origem dos acessos.
            </p>
          </Card>
        )}

        {analysis && !generating && (
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
                      <ul className="space-y-3">
                        {analysisDetails.map((detail) => (
                          <li key={detail.title} className="text-sm text-foreground/90">
                            <p className="font-medium text-foreground">• {detail.title}</p>
                            <p className="mt-1 text-muted-foreground">{detail.reason}</p>
                            <p className="mt-1"><span className="font-medium text-foreground">Ação sugerida:</span> {detail.recommendation}</p>
                          </li>
                        ))}
                      </ul>
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
