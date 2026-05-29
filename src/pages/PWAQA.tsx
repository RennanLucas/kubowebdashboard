import { Helmet } from "react-helmet-async";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw, Trash2, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";

type Status = "ok" | "warn" | "fail" | "loading";

interface CheckRow {
  label: string;
  status: Status;
  detail?: string;
}

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-warning" />;
  if (status === "fail") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
};

const Row = ({ label, status, detail }: CheckRow) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
    <div className="flex items-start gap-2.5 min-w-0">
      <span className="mt-0.5 shrink-0">
        <StatusIcon status={status} />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        {detail && (
          <div className="text-[11px] text-muted-foreground mt-0.5 break-all font-mono">
            {detail}
          </div>
        )}
      </div>
    </div>
  </div>
);

const PWAQA = () => {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [swSupported] = useState(typeof navigator !== "undefined" && "serviceWorker" in navigator);
  const [manifest, setManifest] = useState<any>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<{ name: string; count: number }[]>([]);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);
  const isPreviewHost =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com") ||
      window.location.hostname === "localhost");

  const refresh = useCallback(async () => {
    if (!swSupported) return;
    const reg = (await navigator.serviceWorker.getRegistration()) ?? null;
    setSwRegistration(reg);
    setUpdateAvailable(!!reg?.waiting);

    // Manifest fetch
    try {
      const res = await fetch("/manifest.webmanifest");
      if (res.ok) {
        setManifest(await res.json());
        setManifestError(null);
      } else {
        setManifestError(`HTTP ${res.status}`);
      }
    } catch (e) {
      setManifestError(String(e));
    }

    // Cache contents
    if ("caches" in window) {
      const names = await caches.keys();
      const stats = await Promise.all(
        names.map(async (name) => {
          const c = await caches.open(name);
          const keys = await c.keys();
          return { name, count: keys.length };
        }),
      );
      setCacheStats(stats);
    }
  }, [swSupported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCheckUpdate = async () => {
    if (!swRegistration) return;
    setChecking(true);
    try {
      await swRegistration.update();
      await refresh();
      toast.success("Verificação concluída", {
        description: swRegistration.waiting
          ? "Nova versão pronta para ativar."
          : "Você está na versão mais recente.",
      });
    } catch (e) {
      toast.error("Falha ao verificar update", { description: String(e) });
    } finally {
      setChecking(false);
    }
  };

  const handleActivateUpdate = () => {
    if (!swRegistration?.waiting) return;
    swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => window.location.reload(), 300);
  };

  const handleClearCache = async () => {
    if (!confirm("Limpar todos os caches e desregistrar o service worker? A próxima visita vai recarregar tudo.")) return;
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    if (swRegistration) await swRegistration.unregister();
    toast.success("Cache limpo. Recarregando...");
    setTimeout(() => window.location.reload(), 600);
  };

  const totalCached = cacheStats.reduce((s, c) => s + c.count, 0);

  // Build check rows
  const envChecks: CheckRow[] = [
    {
      label: "Service Worker suportado pelo navegador",
      status: swSupported ? "ok" : "fail",
      detail: swSupported ? "navigator.serviceWorker presente" : "API ausente",
    },
    {
      label: "Ambiente de execução",
      status: isPreviewHost ? "warn" : "ok",
      detail: isPreviewHost
        ? "Preview/iframe — SW não registra aqui por design"
        : window.location.host,
    },
    {
      label: "Modo standalone (instalado)",
      status: isStandalone ? "ok" : "warn",
      detail: isStandalone ? "App instalado na tela inicial" : "Rodando no navegador (não instalado)",
    },
  ];

  const swChecks: CheckRow[] = [
    {
      label: "Service Worker registrado",
      status: swRegistration ? "ok" : isPreviewHost ? "warn" : "fail",
      detail: swRegistration?.active?.scriptURL ?? "—",
    },
    {
      label: "Estado",
      status: swRegistration?.active?.state === "activated" ? "ok" : "warn",
      detail: swRegistration?.active?.state ?? "sem worker ativo",
    },
    {
      label: "Atualização aguardando ativação",
      status: updateAvailable ? "warn" : "ok",
      detail: updateAvailable ? "Nova versão pronta — clique em 'Ativar'" : "Nenhuma pendente",
    },
  ];

  const cacheChecks: CheckRow[] = [
    {
      label: "Caches ativos",
      status: cacheStats.length > 0 ? "ok" : "warn",
      detail: cacheStats.length === 0 ? "nenhum cache ainda" : `${cacheStats.length} bucket(s)`,
    },
    {
      label: "Total de itens cacheados",
      status: totalCached >= 3 ? "ok" : "warn",
      detail: `${totalCached} entrada(s)`,
    },
    ...cacheStats.map<CheckRow>((c) => ({
      label: c.name,
      status: c.count > 0 ? "ok" : "warn",
      detail: `${c.count} entrada(s)`,
    })),
  ];

  const manifestChecks: CheckRow[] = manifestError
    ? [{ label: "manifest.webmanifest", status: "fail", detail: manifestError }]
    : manifest
      ? [
          { label: "name", status: manifest.name ? "ok" : "fail", detail: manifest.name },
          { label: "short_name", status: manifest.short_name ? "ok" : "fail", detail: manifest.short_name },
          { label: "start_url", status: manifest.start_url ? "ok" : "fail", detail: manifest.start_url },
          { label: "display", status: manifest.display === "standalone" ? "ok" : "warn", detail: manifest.display },
          { label: "theme_color", status: manifest.theme_color ? "ok" : "warn", detail: manifest.theme_color },
          {
            label: "icons",
            status: Array.isArray(manifest.icons) && manifest.icons.length >= 2 ? "ok" : "fail",
            detail: `${manifest.icons?.length ?? 0} ícone(s)`,
          },
        ]
      : [{ label: "manifest.webmanifest", status: "loading" }];

  return (
    <PageContainer>
      <Helmet>
        <title>QA do PWA — KUBOWEB</title>
        <meta name="description" content="Diagnóstico do Progressive Web App da plataforma KUBOWEB." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/admin/pwa-qa" />
      </Helmet>
      <div className="mb-4">
        <Link to="/admin" className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Admin
        </Link>
      </div>

      <PageHeader
        title="QA do PWA"
        subtitle="Diagnóstico em tempo real do service worker, cache e manifest. Use após cada deploy para confirmar que o app instalável está saudável."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleCheckUpdate} disabled={checking || !swRegistration}>
              {checking ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />}
              Verificar update
            </Button>
            {updateAvailable && (
              <Button size="sm" onClick={handleActivateUpdate}>
                Ativar nova versão
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Limpar cache
            </Button>
          </>
        }
      />

      {isPreviewHost && (
        <div className="mt-6 rounded-md border border-warning/30 bg-warning/5 p-3 text-[13px] text-foreground">
          <strong>Atenção:</strong> você está no preview do Lovable. O service worker é desativado de propósito aqui para não atrapalhar o desenvolvimento. Para validar de verdade, acesse a versão publicada (kubowebdashboard.lovable.app).
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Ambiente"
          subtitle="Onde o app está rodando agora"
          actions={<Badge variant="outline" className="text-[10px]">{envChecks.filter(c => c.status === "ok").length}/{envChecks.length}</Badge>}
        >
          <div className="-mb-2">
            {envChecks.map((c) => <Row key={c.label} {...c} />)}
          </div>
        </SectionCard>

        <SectionCard
          title="Service Worker"
          subtitle="Status do worker que serve o app offline"
          actions={<Badge variant="outline" className="text-[10px]">{swChecks.filter(c => c.status === "ok").length}/{swChecks.length}</Badge>}
        >
          <div className="-mb-2">
            {swChecks.map((c) => <Row key={c.label} {...c} />)}
          </div>
        </SectionCard>

        <SectionCard
          title="Cache"
          subtitle="Recursos pré-cacheados pelo workbox"
          actions={<Badge variant="outline" className="text-[10px]">{totalCached} itens</Badge>}
        >
          <div className="-mb-2">
            {cacheChecks.map((c) => <Row key={c.label} {...c} />)}
          </div>
        </SectionCard>

        <SectionCard
          title="Manifest"
          subtitle="Metadados que definem como o app é instalado"
          actions={<Badge variant="outline" className="text-[10px]">{manifestChecks.filter(c => c.status === "ok").length}/{manifestChecks.length}</Badge>}
        >
          <div className="-mb-2">
            {manifestChecks.map((c) => <Row key={c.label} {...c} />)}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Checklist manual" subtitle="Faça em um dispositivo real após cada deploy">
        <ol className="text-[13px] space-y-2 text-foreground/90 list-decimal list-inside marker:text-muted-foreground">
          <li>Abra a versão publicada em uma aba anônima e instale o app via /install.</li>
          <li>Abra o app instalado e confirme que NÃO aparece a barra do navegador.</li>
          <li>Volte aqui e confirme que "Modo standalone" está OK.</li>
          <li>Faça um novo deploy. Recarregue. O toast "Nova versão disponível" deve aparecer.</li>
          <li>Clique em "Atualizar" — o app deve recarregar com a versão nova.</li>
          <li>Desligue o Wi-Fi e abra o app — a tela de loading e shell devem aparecer (offline ready).</li>
        </ol>
      </SectionCard>
    </PageContainer>
  );
};

export default PWAQA;
