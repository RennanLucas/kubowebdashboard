import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Globe, Sparkles, ArrowRight, ArrowLeft, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TrackingSnippet from "@/components/TrackingSnippet";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Platform = "wordpress" | "shopify" | "wix" | "gtm" | "html" | "other" | null;

// Janela de escuta após o clique em "Verificar": tempo suficiente para o
// usuário abrir o site em outra aba e o evento chegar no banco.
const POLL_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 3_000;

interface TrackingInstallWizardProps {
  projectId: string;
  projectName: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TrackingInstallWizard({ 
  projectId, 
  projectName, 
  children,
  defaultOpen = false,
  onOpenChange
}: TrackingInstallWizardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [platform, setPlatform] = useState<Platform>(null);
  
  const [verifying, setVerifying] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);
  const [waitingNewVisit, setWaitingNewVisit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Aborta o polling quando o usuário fecha o wizard ou o componente desmonta.
  const cancelRef = useRef(false);

  // Sync with defaultOpen
  useEffect(() => {
    if (defaultOpen !== open) {
      setOpen(defaultOpen);
    }
  }, [defaultOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) onOpenChange(newOpen);
  };

  useEffect(() => {
    if (open) {
      setStep(1);
      setPlatform(null);
      setVerifying(false);
      setHasError(false);
      setWaitingNewVisit(false);
      setSecondsLeft(0);
    } else {
      // Fechou o wizard no meio da escuta: para o polling.
      cancelRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const fetchLatestPageview = async (): Promise<Date | null> => {
    const { data, error } = await supabase
      .from("pageviews")
      .select("created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.created_at ? new Date(data.created_at) : null;
  };

  const verifyInstallation = async () => {
    cancelRef.current = false;
    setVerifying(true);
    setHasError(false);
    setWaitingNewVisit(false);

    try {
      // Baseline = pageview mais recente ANTES de começarmos a escutar.
      // Comparamos contra ele em vez do relógio do browser: uma query
      // instantânea por created_at >= agora nunca acha nada, e qualquer
      // diferença de clock entre cliente e servidor invalidaria o corte.
      const baseline = await fetchLatestPageview();
      setLastSeen(baseline);

      const deadline = Date.now() + POLL_TIMEOUT_MS;

      while (!cancelRef.current && Date.now() < deadline) {
        setSecondsLeft(Math.ceil((deadline - Date.now()) / 1000));

        const latest = await fetchLatestPageview();
        if (latest && (!baseline || latest.getTime() > baseline.getTime())) {
          setLastSeen(latest);
          setStep(3); // 🟢 Instalação confirmada
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      if (cancelRef.current) return;

      if (baseline) {
        // 🟡 Existem visitas antigas, mas nenhuma nova durante a escuta
        setWaitingNewVisit(true);
      } else {
        // 🔴 Nunca recebemos nada deste projeto
        setLastSeen(null);
        setHasError(true);
      }
    } catch (err) {
      console.error("Verification error", err);
      setHasError(true);
    } finally {
      setVerifying(false);
      setSecondsLeft(0);
    }
  };

  const platforms = [
    { id: "wordpress", name: "WordPress", icon: "🌐" },
    { id: "shopify", name: "Shopify", icon: "🛍️" },
    { id: "wix", name: "Wix", icon: "✨" },
    { id: "gtm", name: "Google Tag Manager", icon: "🏷️" },
    { id: "html", name: "HTML/JS", icon: "💻" },
    { id: "other", name: "Outro", icon: "🔧" },
  ] as const;

  const renderPlatformInstructions = () => {
    switch (platform) {
      case "wordpress":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Instalação no WordPress</h4>
            <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Entre no painel do WordPress.</li>
              <li>Acesse a área de código/header do site.</li>
              <li>Procure o campo de código no <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code>.</li>
              <li>Cole o código do Kubo.</li>
              <li>Salve as alterações.</li>
              <li>Volte ao Kubo e clique em <strong>Verificar instalação</strong>.</li>
            </ol>
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-md text-xs">
              <strong>Dica:</strong> Dependendo do tema ou plugin utilizado, o local pode ter um nome diferente.
            </div>
          </div>
        );
      case "shopify":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Instalação no Shopify</h4>
            <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Abra o painel Shopify.</li>
              <li>Acesse a edição do tema.</li>
              <li>Abra o código do tema.</li>
              <li>Procure o arquivo/layout principal.</li>
              <li>Cole o código antes de <code className="text-xs bg-muted px-1 rounded">&lt;/head&gt;</code>.</li>
              <li>Salve.</li>
              <li>Volte ao Kubo.</li>
            </ol>
          </div>
        );
      case "wix":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Instalação no Wix</h4>
            <p className="text-sm text-muted-foreground">
              A instalação deve ser feita através da área de código personalizado ou integrações nas configurações do seu site.
            </p>
            <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Abra as configurações do site.</li>
              <li>Procure a área de código personalizado ou integrações.</li>
              <li>Adicione o script no Head.</li>
            </ul>
          </div>
        );
      case "gtm":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Google Tag Manager</h4>
            <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Abra seu container.</li>
              <li>Crie uma nova Tag.</li>
              <li>Escolha HTML personalizado.</li>
              <li>Cole o script do Kubo.</li>
              <li>Configure para disparar em todas as páginas.</li>
              <li>Salve e publique o container.</li>
              <li>Volte ao Kubo.</li>
            </ol>
            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 p-3 rounded-md text-xs">
              <strong>Importante:</strong> O Google Tag Manager precisa estar publicado para o código começar a funcionar.
            </div>
          </div>
        );
      case "html":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">HTML / JavaScript</h4>
            <p className="text-sm text-muted-foreground">
              Se você controla o código do site, cole o script dentro da tag <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code> em todas as páginas que deseja monitorar.
            </p>
            <div className="p-4 bg-muted/50 rounded-md text-xs font-mono text-muted-foreground">
              &lt;head&gt;<br />
              &nbsp;&nbsp;&lt;!-- outros códigos do seu site --&gt;<br />
              <br />
              &nbsp;&nbsp;<span className="text-primary">&lt;!-- Kubo Analytics --&gt;</span><br />
              &nbsp;&nbsp;<span className="text-foreground">SEU_SCRIPT_AQUI</span><br />
              &lt;/head&gt;
            </div>
          </div>
        );
      case "other":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Não encontrou sua plataforma?</h4>
            <p className="text-sm text-muted-foreground">
              Você pode instalar manualmente adicionando o código do Kubo dentro do <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code> do seu site.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
            <Sparkles className="h-3.5 w-3.5" /> Instalação
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[85vh]">
        
        {/* Left Sidebar - Steps */}
        <div className="bg-muted/30 p-6 border-b md:border-b-0 md:border-r border-border md:w-64 shrink-0 flex flex-col gap-6">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Kubo Analytics
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Projeto: {projectName}
            </p>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${step === 1 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${step === 1 ? 'bg-primary text-primary-foreground' : step > 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">Instalar Código</span>
            </div>
            
            <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${step === 2 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${step === 2 ? 'bg-primary text-primary-foreground' : step > 2 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">Verificar</span>
            </div>

            <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${step === 3 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              <span className="text-sm font-medium whitespace-nowrap">Concluído</span>
            </div>
          </nav>
          
          <div className="mt-auto hidden md:block">
            <h4 className="text-xs font-semibold text-foreground tracking-wider mb-2">O que o Kubo vai acompanhar?</h4>
            <ul className="text-[11px] text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Visitantes</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Páginas visualizadas</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Fontes de tráfego</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Dispositivos</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Localização aproximada</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Eventos/interações</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Sessões</li>
            </ul>
            <p className="text-[10px] text-muted-foreground mt-3">
              O script é leve e foi desenvolvido para minimizar impacto no carregamento do seu site.
            </p>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <DialogTitle className="text-xl md:text-2xl font-bold">Instale o Kubo no seu site</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Para começar a receber dados, adicione o código do Kubo ao seu site. A instalação leva apenas alguns minutos.
                </p>
              </div>

              {!platform ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Escolha onde seu site foi criado:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {platforms.map((p) => (
                      <Button
                        key={p.id}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-wrap"
                        onClick={() => setPlatform(p.id)}
                      >
                        <span className="text-2xl shrink-0">{p.icon}</span>
                        <span className="text-xs font-medium text-center leading-tight whitespace-normal">{p.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground" onClick={() => setPlatform(null)}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  
                  <div className="p-5 border border-border rounded-xl bg-card">
                    {renderPlatformInstructions()}
                  </div>

                  <div className="pt-2">
                    <TrackingSnippet projectId={projectId} />
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button onClick={() => setStep(2)} className="gap-2">
                      Verificar Instalação <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col justify-center max-w-lg mx-auto">
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  {verifying ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : hasError ? (
                    <XCircle className="h-8 w-8 text-destructive" />
                  ) : waitingNewVisit ? (
                    // Aguardando nova visita (tem dado antigo mas nada novo na janela de escuta)
                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                  ) : (
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <h3 className="text-xl font-bold">
                  {verifying
                    ? "Abra seu site agora"
                    : hasError
                    ? "Ainda não detectamos a instalação"
                    : waitingNewVisit
                    ? "Aguardando nova visita"
                    : "Aguardando instalação"}
                </h3>

                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {verifying
                    ? `Estamos escutando novos acessos em tempo real. Abra seu site em outra aba — detectamos automaticamente. (${secondsLeft}s)`
                    : hasError
                    ? "Nenhum dado recebido. Confira se o código está dentro do <head> do seu site e se as alterações foram publicadas."
                    : waitingNewVisit
                    ? "Detectamos visitas anteriores, mas nenhuma nova durante a escuta. Clique em Tentar novamente e abra seu site enquanto escutamos."
                    : "Ainda não recebemos novos dados desse site. Faça o teste abaixo."}
                </p>
              </div>

              <div className="bg-muted/40 p-5 rounded-xl border border-border">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Faça este teste
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Clique em <strong>Verificar instalação</strong> abaixo.</li>
                  <li>Sem fechar esta janela, abra seu site em outra aba (ou janela anônima).</li>
                  <li>Navegue na página inicial e aguarde 2 a 5 segundos.</li>
                  <li>A confirmação aparece aqui sozinha — não precisa voltar e clicar de novo.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  size="lg"
                  onClick={verifyInstallation}
                  disabled={verifying}
                  className="w-full text-base"
                >
                  {verifying ? `Escutando... (${secondsLeft}s)` : (hasError || waitingNewVisit) ? "Tentar novamente" : "Verificar instalação"}
                </Button>
                
                {hasError && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="w-full text-xs">
                      Ver instruções
                    </Button>
                    <Button variant="outline" onClick={() => setStep(1)} className="w-full text-xs">
                      Copiar código
                    </Button>
                  </div>
                )}
              </div>

              {hasError && (
                <div className="mt-4 pt-4 border-t border-border/50 text-center">
                  <h4 className="text-sm font-semibold text-foreground">Precisa de ajuda?</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confira se o código foi publicado no site e não apenas salvo no editor.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 h-full flex flex-col justify-center items-center text-center max-w-md mx-auto">
              
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-20"></div>
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold">🎉 Seu site está conectado!</h2>
              
              <div className="space-y-2 text-muted-foreground">
                <p>O Kubo recebeu os primeiros dados do seu site.</p>
                <p className="text-sm">Seus relatórios e métricas começarão a ser preenchidos conforme novos visitantes acessarem o site.</p>
              </div>

              {lastSeen && (
                <div className="bg-muted/30 py-2 px-4 rounded-full border border-border/50 text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Último acesso detectado {formatDistanceToNow(lastSeen, { addSuffix: true, locale: ptBR })}
                </div>
              )}

              <div className="pt-8 w-full">
                <Button 
                  size="lg" 
                  className="w-full text-base h-12"
                  onClick={() => setOpen(false)}
                >
                  Ir para Dashboard
                </Button>
              </div>

            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
