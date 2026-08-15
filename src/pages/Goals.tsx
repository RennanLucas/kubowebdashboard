import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlanFeatureGuard } from "@/components/auth/PlanFeatureGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, ArrowRight, MousePointerClick, MessageSquare, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const funnelData = [
  { name: "Visitantes Únicos", value: 12450, color: "hsl(var(--primary))" },
  { name: "Visualizaram Produto", value: 4320, color: "hsl(var(--primary) / 0.8)" },
  { name: "Adicionaram ao Carrinho", value: 850, color: "hsl(var(--primary) / 0.6)" },
  { name: "Iniciaram Checkout", value: 320, color: "hsl(var(--primary) / 0.4)" },
  { name: "Compras (Meta)", value: 145, color: "hsl(var(--success))" },
];

const Goals = () => {
  return (
    <PlanFeatureGuard feature="goals" fallbackPath="/dashboard">
      <AppLayout>
        <Helmet>
          <title>Metas e Funis — KUBOWEB</title>
        </Helmet>
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Metas de Conversão
              </h1>
              <p className="page-subtitle">Acompanhe a jornada do cliente e descubra onde estão as quedas.</p>
            </div>
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Funil de Vendas Principal</CardTitle>
                <CardDescription>Conversão de Visitante até Compra (Últimos 30 dias)</CardDescription>
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
                    <p className="text-2xl font-bold text-success mt-1">1.16%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Maior Queda</p>
                    <p className="text-lg font-semibold text-destructive mt-1">Produto → Carrinho (-80%)</p>
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
                      <p className="text-3xl font-bold text-foreground">84</p>
                      <p className="text-sm text-success font-medium flex items-center mt-1">
                        +12% <ArrowRight className="h-3 w-3 inline -rotate-45 ml-1" />
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                      <span className="font-bold text-sm">3.2%</span>
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
                      <p className="text-3xl font-bold text-foreground">32</p>
                      <p className="text-sm text-destructive font-medium flex items-center mt-1">
                        -5% <ArrowRight className="h-3 w-3 inline rotate-45 ml-1" />
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                      <span className="font-bold text-sm">1.1%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-border/50 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Vendas (Hotmart/Eduzz)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold text-foreground">18</p>
                      <p className="text-sm text-muted-foreground mt-1">Aguardando webhook</p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center">
                      <span className="font-bold text-sm text-muted-foreground">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </PlanFeatureGuard>
  );
};

export default Goals;
