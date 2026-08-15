import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Play, Clock, MousePointer2, Settings, ExternalLink } from "lucide-react";

const Heatmaps = () => {
  return (
      <AppLayout>
        <Helmet>
          <title>Heatmaps e Gravações — KUBOWEB</title>
        </Helmet>
        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                Heatmaps & Replay de Sessão
              </h1>
              <p className="page-subtitle">Veja exatamente onde seus usuários clicam e assista às gravações de tela.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar Domínios
              </Button>
              <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
                <Play className="h-4 w-4" />
                Assistir Sessões Recentes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            {/* Sidebar list of pages */}
            <Card className="lg:col-span-1 shadow-sm border-border/50 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-sm">Páginas mais quentes</h3>
                <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {[
                  { path: "/", views: 5430, clicks: 1240, active: true },
                  { path: "/produtos", views: 2100, clicks: 890, active: false },
                  { path: "/checkout", views: 850, clicks: 412, active: false },
                  { path: "/contato", views: 420, clicks: 105, active: false },
                  { path: "/sobre", views: 310, clicks: 45, active: false },
                ].map((page, i) => (
                  <button
                    key={i}
                    className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                      page.active ? "bg-orange-500/10 border border-orange-500/20" : "hover:bg-muted"
                    }`}
                  >
                    <div className="truncate pr-4">
                      <p className={`text-sm font-medium truncate ${page.active ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`}>
                        {page.path}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {page.views}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MousePointer2 className="h-3 w-3" /> {page.clicks}
                        </span>
                      </div>
                    </div>
                    {page.active && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </Card>

            {/* Heatmap Preview Area */}
            <Card className="lg:col-span-3 shadow-sm border-border/50 flex flex-col h-full overflow-hidden bg-muted/10 relative group">
              <div className="p-3 border-b bg-background flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs font-medium border">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Heatmap Ativo
                  </div>
                  <span className="text-sm font-medium text-muted-foreground ml-2">Visualizando: / (Home)</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 via-yellow-500/20 to-red-500/20 rounded-full border border-border/50 backdrop-blur-sm">
                    <span className="text-[10px] font-medium text-blue-500">Frio</span>
                    <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500" />
                    <span className="text-[10px] font-medium text-red-500">Quente</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-900/5 dark:bg-zinc-900/50">
                {/* Mockup of a website with heatmap overlay */}
                <div className="w-[800px] h-[600px] bg-white dark:bg-zinc-950 rounded-lg shadow-2xl border overflow-hidden relative scale-75 md:scale-90 lg:scale-100 origin-top transform transition-transform">
                  
                  {/* Fake Website Header */}
                  <div className="h-16 border-b flex items-center justify-between px-8 bg-zinc-50 dark:bg-zinc-900">
                    <div className="w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="flex gap-6">
                      <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="w-24 h-8 bg-blue-600 rounded" />
                    </div>
                  </div>

                  {/* Fake Website Hero */}
                  <div className="h-80 flex flex-col items-center justify-center text-center px-10 border-b">
                    <div className="w-3/4 h-12 bg-zinc-200 dark:bg-zinc-800 rounded mb-6" />
                    <div className="w-1/2 h-6 bg-zinc-100 dark:bg-zinc-900 rounded mb-8" />
                    <div className="flex gap-4">
                      <div className="w-40 h-12 bg-blue-600 rounded-lg" />
                      <div className="w-40 h-12 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg" />
                    </div>
                  </div>

                  {/* FAKE HEATMAP OVERLAYS */}
                  {/* Main CTA Hotspot */}
                  <div className="absolute top-[230px] left-[310px] w-48 h-24 bg-red-500/40 blur-2xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  <div className="absolute top-[240px] left-[330px] w-24 h-12 bg-red-500/60 blur-xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  <div className="absolute top-[245px] left-[350px] w-12 h-6 bg-yellow-400/80 blur-md rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  
                  {/* Secondary CTA Warm spot */}
                  <div className="absolute top-[230px] left-[480px] w-40 h-24 bg-yellow-500/30 blur-2xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  
                  {/* Nav Logo Cold spot */}
                  <div className="absolute top-2 left-6 w-32 h-16 bg-blue-500/30 blur-xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  
                  {/* Nav Button Hotspot */}
                  <div className="absolute top-2 right-6 w-32 h-16 bg-orange-500/40 blur-xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

                  {/* Random scattered clicks */}
                  {[...Array(15)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-8 h-8 bg-blue-400/30 blur-md rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none"
                      style={{ 
                        top: `${Math.random() * 80 + 10}%`, 
                        left: `${Math.random() * 80 + 10}%` 
                      }} 
                    />
                  ))}
                </div>

                {/* Integration Notice Overlay */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-card p-8 rounded-xl shadow-2xl border max-w-md text-center transform scale-95 group-hover:scale-100 transition-transform duration-300">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Conectar Rastreador</h3>
                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                      Para visualizar os heatmaps reais do seu site, você precisa instalar o script avançado de gravação de tela.
                    </p>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Ver Instruções de Instalação
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AppLayout>
  );
};

export default Heatmaps;
