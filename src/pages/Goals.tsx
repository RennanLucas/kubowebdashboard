import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, MousePointerClick, MessageSquare, CreditCard, Loader2, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { usePlan } from "@/hooks/usePlan";
import { useMemo } from "react";
import MonthlyGoalsCard from "@/components/settings/MonthlyGoalsCard";

const Goals = () => {
  const { selectedProjectId } = useSelectedProject();
  const plan = usePlan();
  const dateRange = plan.maxHistoryDays >= 30 ? 30 : plan.maxHistoryDays;
  const { data, isLoading } = useDashboardAnalytics(dateRange, selectedProjectId);
  const projectId = selectedProjectId || data?.client?.project?.id;

  const funnelData = useMemo(() => {
    if (!data) return [];
    
    // Calcula totais reais baseados nas m?tricas
    let visitors = 0;
    let views = 0;
    let whatsapp = 0;
    let forms = 0;
    let buttons = 0;

    data.metrics?.forEach(m => {
      visitors += m.visitors;
      views += (m.views || m.visitors);
      whatsapp += m.whatsapp_clicks;
      forms += m.form_submissions;
      buttons += m.button_clicks;
    });

    const totalLeads = whatsapp + forms + buttons;
    return [
      { name: "Visitantes Únicos", value: visitors, color: "hsl(var(--primary))" },
      { name: "Visualizações", value: views, color: "hsl(var(--primary) / 0.8)" },
      { name: "Cliques em CTA", value: buttons, color: "hsl(var(--primary) / 0.6)" },
      { name: "Iniciaram Contato", value: totalLeads, color: "hsl(var(--primary) / 0.4)" },
      { name: "Leads identificados", value: totalLeads, color: "hsl(var(--success))" },
    ];
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return { whatsapp: 0, forms: 0, buttons: 0, leads: 0 };
    let whatsapp = 0, forms = 0, buttons = 0;
    data.metrics?.forEach(m => {
      whatsapp += m.whatsapp_clicks;
      forms += m.form_submissions;
      buttons += m.button_clicks;
    });
    return { whatsapp, forms, buttons, leads: whatsapp + forms + buttons };
  }, [data]);

  const maxVal = funnelData[0]?.value || 1;
  const finalConversion = maxVal > 0 ? ((stats.leads / maxVal) * 100).toFixed(2) : "0.00";

  return (
      <AppLayout>
        <Helmet>
          <title>Metas e Funis - KUBOWEB</title>
          <meta name="description" content="Defina metas mensais e acompanhe funis com dados reais do projeto selecionado." />
          <link rel="canonical" href="https://kubowebdashboard.vercel.app/goals" />
        </Helmet>
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-background to-violet-500/10 p-6 sm:p-8 shadow-sm">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><Sparkles className="h-3.5 w-3.5" />Objetivos mensais e conversão real</div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3"><Target className="h-8 w-8 text-emerald-500" />Metas e Funis</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Defina metas por projeto, acompanhe o progresso e descubra onde a jornada perde força.</p>
              </div>
              <Button className="gap-2 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700" onClick={() => document.getElementById("monthly-goals")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                <Plus className="h-4 w-4" />Definir meta
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Funil de Conversão Principal</CardTitle>
                <CardDescription>Do acesso ao lead identificado nos últimos {dateRange} dias — sem vendas simuladas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} width={150} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                        formatter={(value: number) => [new Intl.NumberFormat('pt-BR').format(value), 'Usuários']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taxa de Conversão Final</p>
                    <p className="text-2xl font-bold text-success mt-1">{finalConversion}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-border/50 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Cliques no WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stats.whatsapp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-primary" />
                    Envios de Formulário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stats.forms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-border/50 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Cliques em CTA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stats.buttons}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
          {projectId ? <div id="monthly-goals" className="scroll-mt-24"><MonthlyGoalsCard projectId={projectId} /></div> : null}
        </div>
      </AppLayout>
  );
};

export default Goals;
