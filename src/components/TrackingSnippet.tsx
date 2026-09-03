import { useState } from "react";
import { Copy, Check, Code2, ShieldCheck, Info, MousePointerClick, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TrackingSnippetProps {
  projectId: string;
}

const TrackingSnippet = ({ projectId }: TrackingSnippetProps) => {
  const [copied, setCopied] = useState(false);
  const [consentCopied, setConsentCopied] = useState(false);
  const [requireConsent, setRequireConsent] = useState(false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const scriptUrl = `${supabaseUrl}/functions/v1/tracker-script?pid=${projectId}${
    requireConsent ? "&consent=required" : ""
  }`;
  const snippet = `<script src="${scriptUrl}" defer></script>`;
  const consentSnippet = `// Botão “Aceitar analytics” do seu banner\nwindow.kuboweb.consent(true);\n\n// Botão “Recusar” ou “Revogar consentimento”\nwindow.kuboweb.consent(false);`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyConsent = async () => {
    await navigator.clipboard.writeText(consentSnippet);
    setConsentCopied(true);
    setTimeout(() => setConsentCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Código de Rastreamento</h3>
        </div>
        <Button
          type="button"
          variant={copied ? "default" : "secondary"}
          size="sm"
          className={`gap-2 h-8 transition-all ${copied ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          onClick={handleCopy}
          aria-label="Copiar código de rastreamento"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar código
            </>
          )}
        </Button>
      </div>
      <div className="relative group">
        <code className="block text-xs sm:text-sm bg-background p-4 rounded-md border border-border select-all font-mono text-muted-foreground break-words whitespace-pre-wrap">
          {snippet}
        </code>
      </div>

      <div className={`overflow-hidden rounded-xl border transition-colors ${
        requireConsent
          ? "border-primary/30 bg-primary/[0.045]"
          : "border-border/70 bg-background/55"
      }`}>
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="flex min-w-0 gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              requireConsent
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-border bg-muted/50 text-muted-foreground"
            }`}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="require-consent" className="cursor-pointer text-sm font-semibold text-foreground">
                  Aguardar autorização do visitante
                </Label>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  requireConsent
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {requireConsent ? "ATIVADO" : "DESATIVADO"}
                </span>
              </div>
              <p id="consent-mode-description" className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                {requireConsent
                  ? "O Kubo aguarda o visitante aceitar Analytics no banner do site. Antes disso, nenhuma visita é enviada."
                  : "O Kubo começa a medir assim que a página abre. Use esta opção somente quando sua operação possuir uma base legal adequada."}
              </p>
            </div>
          </div>
          <Switch
            id="require-consent"
            checked={requireConsent}
            onCheckedChange={setRequireConsent}
            aria-describedby="consent-mode-description"
            className="mt-1 shrink-0"
          />
        </div>

        {requireConsent && (
          <div className="grid border-t border-primary/15 bg-background/35 sm:grid-cols-3">
            <div className="flex gap-2.5 border-b border-border/50 p-3 sm:border-b-0 sm:border-r">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">1</span>
              <p className="text-[11px] leading-relaxed text-muted-foreground"><strong className="block text-foreground">O banner pergunta</strong>O visitante escolhe aceitar ou recusar.</p>
            </div>
            <div className="flex gap-2.5 border-b border-border/50 p-3 sm:border-b-0 sm:border-r">
              <MousePointerClick className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted-foreground"><strong className="block text-foreground">Se aceitar</strong>O rastreamento começa normalmente.</p>
            </div>
            <div className="flex gap-2.5 p-3">
              <Ban className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted-foreground"><strong className="block text-foreground">Se recusar</strong>Nenhum dado de visita é enviado.</p>
            </div>
          </div>
        )}
      </div>

      {requireConsent && (
        <div className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Conecte ao banner do seu site</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Adicione cada comando à ação correspondente do banner.</p>
            </div>
            <Button
              type="button"
              variant={consentCopied ? "default" : "ghost"}
              size="sm"
              className={`gap-2 h-7 text-xs transition-all ${consentCopied ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
              onClick={handleCopyConsent}
              aria-label="Copiar código de consentimento"
            >
              {consentCopied ? (
                <>
                  <Check className="h-3 w-3" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copiar
                </>
              )}
            </Button>
          </div>
          <code className="block text-xs bg-background p-4 rounded-md border border-border select-all font-mono text-muted-foreground break-words whitespace-pre-wrap">
            {consentSnippet}
          </code>
          <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <p><strong className="text-foreground">Importante:</strong> o Kubo não cria o banner de consentimento. Seu site precisa exibir um banner próprio e executar os comandos acima. Sem essa integração, nenhuma visita será registrada enquanto este modo estiver ativado.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Leve (~1KB)</span>
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Rastreamento sem cookies</span>
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Modo de consentimento</span>
      </div>
    </div>
  );
};

export default TrackingSnippet;
