import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, BarChart3, Users, Printer, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useAllUserProjects } from "@/hooks/useAllUserProjects";
import { usePlan } from "@/hooks/usePlan";

const Reports = () => {
  const { selectedProjectId } = useSelectedProject();
  const { data: projects } = useAllUserProjects();
  const selectedProject = useMemo(
    () => projects?.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const plan = usePlan();
  const dateRange = plan.maxHistoryDays >= 30 ? 30 : plan.maxHistoryDays;
  
  const { data: analyticsData, isLoading: loading } = useDashboardAnalytics(dateRange, selectedProjectId);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        toast.error("Escolha uma imagem de até 2 MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast.success("Logo atualizada com sucesso para o relatório.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate real metrics from API data
  const realStats = useMemo(() => {
    if (!analyticsData || !analyticsData.metrics || analyticsData.metrics.length === 0) return null;

    let totalVisitors = 0;
    let leads = 0;

    analyticsData.metrics.forEach((m: any) => {
      totalVisitors += m.visitors || 0;
      leads += (m.whatsapp_clicks || 0) + (m.form_submissions || 0) + (m.button_clicks || 0);
    });

    const convRate = totalVisitors > 0 ? ((leads / totalVisitors) * 100).toFixed(1) : "0.0";

    // Sources logic
    const sources = analyticsData.trafficSources || [];

    return { totalVisitors, leads, convRate, sources };
  }, [analyticsData]);

  return (
      <AppLayout>
        <Helmet>
          <title>Relatórios profissionais — KUBOWEB</title>
          <meta name="description" content="Crie relatórios executivos com dados reais e a identidade visual do cliente." />
          <link rel="canonical" href="https://kubowebdashboard.vercel.app/reports" />
        </Helmet>
        <div className="reports-page p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,.3),transparent_65%)]" />
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200"><ShieldCheck className="h-3.5 w-3.5" />Documento executivo com dados reais</div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><FileText className="h-8 w-8 text-blue-400" />Relatórios profissionais</h1>
                <p className="mt-2 text-sm text-white/65">Prepare uma visão clara do desempenho com a identidade do cliente.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white print:hidden" disabled={!realStats}>
                  <label className="cursor-pointer flex items-center gap-2">
                    <Upload className="h-4 w-4" />Sua Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={!realStats} />
                  </label>
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 print:hidden" disabled={!realStats}><Printer className="h-4 w-4" />Imprimir / PDF</Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !realStats ? (
            <div className="bg-white text-black p-12 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sem dados suficientes</h3>
              <p className="text-gray-500 max-w-md">
                Ainda não há dados suficientes para gerar este relatório para o projeto {selectedProject?.name}. 
                Aguarde o registro de novas visitas ou instale o script de rastreamento.
              </p>
            </div>
          ) : (
            <div className="bg-white text-black p-8 rounded-xl border shadow-sm min-h-[600px]" id="report-preview">
              {/* Report Header */}
              <div className="report-break-avoid flex justify-between items-center border-b pb-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Relatório de Desempenho</h2>
                  <p className="text-gray-500 mt-1">Período: Últimos {dateRange} dias</p>
                  <p className="text-gray-600 font-medium mt-2">Projeto: {selectedProject?.name || "Desconhecido"}</p>
                </div>
                <div className="h-16 w-48 flex items-center justify-end">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo do Cliente" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="h-full w-full border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                      Sua Logo Aqui
                    </div>
                  )}
                </div>
              </div>

              {/* Real Report Content */}
              <div className="report-break-avoid grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="p-5 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-sm">Total de Visitantes</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat('pt-BR').format(realStats.totalVisitors)}</div>
                </div>
                <div className="p-5 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-medium text-sm">Leads Gerados</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat('pt-BR').format(realStats.leads)}</div>
                </div>
                <div className="p-5 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">Taxa de Conversão</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{realStats.convRate}%</div>
                </div>
              </div>

              <div className="report-break-avoid space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Origem do Tráfego</h3>
                {realStats.sources.length === 0 ? (
                  <p className="text-gray-500 py-4">Não disponível</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 font-semibold text-gray-700 border-b">Canal</th>
                        <th className="p-3 font-semibold text-gray-700 border-b text-right">Visitantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realStats.sources.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-gray-800">{row.source === "direct" ? "Acesso Direto" : row.source || "Desconhecido"}</td>
                          <td className="p-3 text-right text-gray-600 font-medium">{new Intl.NumberFormat('pt-BR').format(row.visitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="report-footer mt-16 pt-8 border-t text-center text-sm text-gray-400">
                Gerado automaticamente. Dados baseados no tráfego registrado do projeto.
              </div>
            </div>
          )}
        </div>
      </AppLayout>
  );
};

export default Reports;
