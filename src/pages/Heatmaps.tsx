import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flame, Play, Clock, MousePointer2, Settings, ExternalLink, Save, CheckCircle2 } from "lucide-react";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";

const Heatmaps = () => {
  const { data, isLoading } = useDashboardAnalytics(7); // Last 7 days for heatmaps
  const topPages = data?.topPages || [];
  
  const [clarityId, setClarityId] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);

  // Initialize from LocalStorage (Mocking DB)
  useEffect(() => {
    const savedId = localStorage.getItem("kuboweb_clarity_id");
    if (savedId) {
      setClarityId(savedId);
    }
    if (topPages.length > 0 && !activePage) {
      setActivePage(topPages[0].path);
    }
  }, [topPages]);

  const handleSaveClarity = () => {
    if (!clarityId.trim()) {
      localStorage.removeItem("kuboweb_clarity_id");
      toast.success("Integração do Clarity removida.");
    } else {
      localStorage.setItem("kuboweb_clarity_id", clarityId.trim());
      toast.success("ID do Clarity salvo com sucesso! O script será injetado automaticamente nos sites deste projeto.");
    }
    setIsConfiguring(false);
  };

  const getClarityUrl = (path: string) => {
    if (!clarityId) return "#";
    // Base URL for Clarity dashboard. 
    // Usually you filter by URL inside the dashboard.
    return `https://clarity.microsoft.com/projects/view/${clarityId}/dashboard?url=${encodeURIComponent(path)}`;
  };

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
              <Button variant={isConfiguring ? "secondary" : "outline"} className="gap-2" onClick={() => setIsConfiguring(!isConfiguring)}>
                <Settings className="h-4 w-4" />
                Configurar Clarity
              </Button>
              {clarityId && (
                <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" asChild>
                  <a href={`https://clarity.microsoft.com/projects/view/${clarityId}/recordings`} target="_blank" rel="noreferrer">
                    <Play className="h-4 w-4" />
                    Assistir Sessões
                  </a>
                </Button>
              )}
            </div>
          </div>

          {isConfiguring && (
            <Card className="mb-6 border-orange-500/30 bg-orange-500/5 animate-in slide-in-from-top-2">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  Integração Microsoft Clarity <CheckCircle2 className="h-5 w-5 text-green-500" />
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  O Microsoft Clarity é gratuito e ilimitado. Insira o seu <b>Project ID</b> abaixo. A KUBOWEB irá instalar o script automaticamente para você em todos os sites rastreados por este projeto.
                </p>
                
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-4 mb-5">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">Como encontrar seu Project ID:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5 ml-1">
                    <li>Acesse <a href="https://clarity.microsoft.com/" target="_blank" rel="noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">clarity.microsoft.com</a> e crie uma conta gratuita.</li>
                    <li>Crie um novo projeto adicionando o domínio do seu site.</li>
                    <li>Vá em <strong>Settings</strong> (Configurações) &gt; <strong>Setup</strong>.</li>
                    <li>Copie o código do <strong>Project ID</strong> (letras e números curtos, ex: <code className="bg-background px-1 py-0.5 rounded border border-border">jkw92k3lma</code>).</li>
                  </ol>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-3 font-medium">
                    ✨ Você <strong>não precisa</strong> colar o script enorme no seu site. Apenas salve o ID abaixo e a KUBOWEB injetará automaticamente para você!
                  </p>
                </div>

                <div className="flex gap-3 max-w-md">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="clarity_id" className="sr-only">Clarity Project ID</Label>
                    <Input 
                      id="clarity_id"
                      placeholder="Ex: jkw92k3lma" 
                      value={clarityId}
                      onChange={(e) => setClarityId(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveClarity} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                    <Save className="h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            {/* Sidebar list of pages */}
            <Card className="lg:col-span-1 shadow-sm border-border/50 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-sm">Páginas mais quentes</h3>
                <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Carregando páginas...</div>
                ) : topPages.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma página com acessos encontrada.</div>
                ) : (
                  topPages.map((page, i) => {
                    const isActive = activePage === page.path;
                    return (
                      <button
                        key={i}
                        onClick={() => setActivePage(page.path)}
                        className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                          isActive ? "bg-orange-500/10 border border-orange-500/20" : "hover:bg-muted"
                        }`}
                      >
                        <div className="truncate pr-4">
                          <p className={`text-sm font-medium truncate ${isActive ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`}>
                            {page.path}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {page.views}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MousePointer2 className="h-3 w-3" /> {Math.round(page.views * 0.45)} {/* Mocked clicks based on views */}
                            </span>
                          </div>
                        </div>
                        {isActive && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                      </button>
                    )
                  })
                )}
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
                  <span className="text-sm font-medium text-muted-foreground ml-2">Visualizando: {activePage || "/"}</span>
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
                  <div className="absolute top-[230px] left-[310px] w-48 h-24 bg-red-500/40 blur-2xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  <div className="absolute top-[240px] left-[330px] w-24 h-12 bg-red-500/60 blur-xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  <div className="absolute top-[245px] left-[350px] w-12 h-6 bg-yellow-400/80 blur-md rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  <div className="absolute top-[230px] left-[480px] w-40 h-24 bg-yellow-500/30 blur-2xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                  <div className="absolute top-2 left-6 w-32 h-16 bg-blue-500/30 blur-xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
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
                    
                    {clarityId ? (
                      <>
                        <h3 className="text-xl font-bold mb-2">Visualizar Mapa Real</h3>
                        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                          Acesse o painel oficial da Microsoft para interagir com o mapa de calor e assistir às gravações da página <b>{activePage}</b>.
                        </p>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2" asChild>
                          <a href={getClarityUrl(activePage || "/")} target="_blank" rel="noreferrer">
                            Abrir Dashboard do Heatmap <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold mb-2">Conectar Rastreador</h3>
                        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                          Para visualizar os heatmaps reais do seu site, você precisa configurar o seu ID do Microsoft Clarity primeiro.
                        </p>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsConfiguring(true)}>
                          Configurar Integração
                        </Button>
                      </>
                    )}
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
