import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, ArrowRight, MousePointerClick, MessageSquare, CreditCard, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { usePlan } from "@/hooks/usePlan";
import { useMemo } from "react";

const Goals = () => {
  const { selectedProjectId } = useSelectedProject();
  const plan = usePlan();
  const dateRange = plan.maxHistoryDays >= 30 ? 30 : plan.maxHistoryDays;
  const { data, isLoading } = useDashboardAnalytics(dateRange, selectedProjectId);

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
    const checkout = Math.round(totalLeads * 0.4); // Estimativa para exemplo se nuo houver webhook
    const sales = Math.round(totalLeads * 0.1); // Estimativa

    return [
      { name: "Visitantes �nicos", value: visitors, color: "hsl(var(--primary))" },
      { name: "Visualiza��es", value: views, color: "hsl(var(--primary) / 0.8)" },
      { name: "Cliques em CTA", value: buttons, color: "hsl(var(--primary) / 0.6)" },
      { name: "Iniciaram Contato", value: totalLeads, color: "hsl(var(--primary) / 0.4)" },
      { name: "Convers�es", value: sales, color: "hsl(var(--success))" },
    ];
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return { whatsapp: 0, forms: 0, buttons: 0, sales: 0 };
    let whatsapp = 0, forms = 0, buttons = 0;
    data.metrics?.forEach(m => {
      whatsapp += m.whatsapp_clicks;
      forms += m.form_submissions;
      buttons += m.button_clicks;
    });
    return { whatsapp, forms, buttons, sales: Math.round((whatsapp + forms + buttons) * 0.1) };
  }, [data]);

  const maxVal = funnelData[0]?.value || 1;
  const finalConversion = maxVal > 0 ? ((stats.sales / maxVal) * 100).toFixed(2) : "0.00";

  return (
      <AppLayout>
        <Helmet>
          <title>Metas e Funis � KUBOWEB</title>
        </Helmet>
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Metas de Convers�o
              </h1>
              <p className="page-subtitle">Acompanhe a jornada do cliente e descubra onde est�o as quedas.</p>
            </div>
            <Button className="gap-2 shadow-md" disabled>
              <Plus className="h-4 w-4" />
              Nova Meta (Em Breve)
            </Button>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Funil de Convers�o Principal</CardTitle>
                <CardDescription>Convers�o de Visitante at� Convers�o (�ltimos {dateRange} dias)</CardDescription>
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
                        formatter={(value: number) => [new Intl.NumberFormat('pt-BR').format(value), 'Usu�rios']}
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
                    <p className="text-sm text-muted-foreground">Taxa de Convers�o Final</p>
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
                    Envios de Formul�rio
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
        </div>
      </AppLayout>
  );
};

export default Goals;
