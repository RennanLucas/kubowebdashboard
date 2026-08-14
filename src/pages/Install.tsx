import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Download, Share, Plus, CheckCircle2, Smartphone, Apple, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { toast } from "sonner";

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {n}
    </span>
    <span className="text-sm text-foreground/90 leading-relaxed">{children}</span>
  </li>
);

const Install = () => {
  const { canPrompt, promptInstall, installed, platform } = useInstallPrompt();

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") toast.success("App instalado com sucesso!");
    else if (outcome === "dismissed") toast("Instalação cancelada");
  };

  return (
    <>
      <Helmet>
        <title>Instalar app — KUBOWEB</title>
        <meta name="description" content="Instale o KUBOWEB como aplicativo no seu celular ou computador." />
        <meta property="og:title" content="Instalar app — KUBOWEB" />
        <meta property="og:description" content="Instale o KUBOWEB como aplicativo no seu celular ou computador." />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/install" />
        <meta property="og:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <meta name="twitter:title" content="Instalar app — KUBOWEB" />
        <meta name="twitter:description" content="Instale o KUBOWEB como aplicativo no seu celular ou computador." />
        <meta name="twitter:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/install" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-3 border-b border-border flex items-center gap-3">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold">Instalar aplicativo</h1>
      </header>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-sidebar shadow-inner flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-sidebar-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-1">KUBOWEB no seu celular</h2>
          <p className="text-sm text-muted-foreground">
            Instale o app para acesso rápido, ícone na tela inicial e tela cheia sem barra do navegador.
          </p>
        </div>

        {installed ? (
          <Card className="p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">App já instalado</h3>
            <p className="text-sm text-muted-foreground">
              Você está usando o KUBOWEB como aplicativo. Acesse pelo ícone na tela inicial.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue={platform} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ios" className="text-xs gap-1">
                <Apple className="h-3.5 w-3.5" /> iPhone
              </TabsTrigger>
              <TabsTrigger value="android" className="text-xs gap-1">
                <Smartphone className="h-3.5 w-3.5" /> Android
              </TabsTrigger>
              <TabsTrigger value="desktop" className="text-xs gap-1">
                <Monitor className="h-3.5 w-3.5" /> PC
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="animate-fade-up">
              <Card className="p-5 glass-card border-border/50 shadow-sm">
                <h3 className="font-semibold mb-3 text-sm">No iPhone / iPad (Safari)</h3>
                <ol className="space-y-3">
                  <Step n={1}>
                    Abra esta página no <strong>Safari</strong> (não funciona no Chrome no iOS).
                  </Step>
                  <Step n={2}>
                    Toque no botão <Share className="inline h-4 w-4 mx-1" /> <strong>Compartilhar</strong> na barra inferior.
                  </Step>
                  <Step n={3}>
                    Role e toque em <Plus className="inline h-4 w-4 mx-1" /> <strong>Adicionar à Tela de Início</strong>.
                  </Step>
                  <Step n={4}>
                    Confirme tocando em <strong>Adicionar</strong>. O ícone do KUBOWEB aparece na sua tela inicial.
                  </Step>
                </ol>
              </Card>
            </TabsContent>

            <TabsContent value="android" className="animate-fade-up">
              <Card className="p-5 glass-card border-border/50 shadow-sm">
                <h3 className="font-semibold mb-4 text-sm">No Android (Chrome)</h3>

                {canPrompt && platform === "android" ? (
                  <Button onClick={handleInstall} className="w-full mb-4" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Instalar agora
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground mb-4">
                    Abra esta página no <strong>Chrome</strong> do Android. Se o botão de instalação não aparecer automaticamente, siga os passos:
                  </p>
                )}

                <ol className="space-y-3">
                  <Step n={1}>
                    Toque no menu do Chrome (3 pontinhos no canto superior direito).
                  </Step>
                  <Step n={2}>
                    Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
                  </Step>
                  <Step n={3}>
                    Confirme tocando em <strong>Instalar</strong>. O ícone do KUBOWEB aparece na sua tela inicial como um app.
                  </Step>
                  <Step n={4}>
                    Abra pelo ícone — o app roda em tela cheia, sem barra do navegador.
                  </Step>
                </ol>

                <p className="text-xs text-muted-foreground mt-4">
                  💡 Funciona também no <strong>Samsung Internet</strong> e <strong>Edge</strong> no Android.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="desktop" className="animate-fade-up">
              <Card className="p-5 glass-card border-border/50 shadow-sm">
                <h3 className="font-semibold mb-4 text-sm">No computador (Chrome / Edge)</h3>

                {canPrompt && platform === "desktop" ? (
                  <Button onClick={handleInstall} className="w-full mb-4" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Instalar agora
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground mb-4">
                    Se o botão de instalação não aparecer automaticamente, siga os passos abaixo:
                  </p>
                )}

                <ol className="space-y-3">
                  <Step n={1}>
                    Procure pelo ícone de instalação <Download className="inline h-4 w-4 mx-1" /> no canto direito da barra de endereço.
                  </Step>
                  <Step n={2}>
                    Ou abra o menu (3 pontinhos) e clique em <strong>Instalar KUBOWEB</strong>.
                  </Step>
                  <Step n={3}>
                    Confirme. O app abre em janela própria, separado do navegador.
                  </Step>
                </ol>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          O app funciona com a sua mesma conta e sincroniza em tempo real com a versão web.
        </p>
      </main>
    </div>
  </>
  );
};

export default Install;
