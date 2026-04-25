import { useMemo, useState } from "react";
import { ShieldAlert, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { ReferrerStat } from "@/hooks/useHourlyHeatmap";

interface Props {
  referrers: ReferrerStat[];
  totalVisitors: number;
  isLoading?: boolean;
}

// Padrões conhecidos de referrer spam / bots / search hijackers
const SUSPICIOUS_PATTERNS: Array<{ pattern: RegExp; reason: string; category: string }> = [
  { pattern: /syndicatedsearch\.goog/i, reason: "Rede de busca sindicada — geralmente sequestradores de busca em navegadores", category: "Search hijacker" },
  { pattern: /doubleclick\.net/i, reason: "Cliques de rede de display — pode incluir bots ou cliques acidentais", category: "Ad network" },
  { pattern: /googleads\.g\./i, reason: "Tráfego de anúncios — só é legítimo se você tem campanha ativa", category: "Ad network" },
  { pattern: /(semalt|buttons-for-website|best-seo|free-share-buttons|trafficmonsoon|simple-share|social-buttons|hulfingtonpost|ilovevitaly|priceg|darodar|blackhatworth|adcash|7makemoneyonline)/i, reason: "Domínio conhecido de referrer spam", category: "Referrer spam" },
  { pattern: /\.(xyz|click|top|gq|tk|ml|cf)$/i, reason: "TLD frequentemente associado a spam", category: "Suspicious TLD" },
  { pattern: /(crawler|spider|bot|scrape|fetch)/i, reason: "Indício de bot/crawler no domínio", category: "Bot" },
];

const classify = (domain: string) => SUSPICIOUS_PATTERNS.find((p) => p.pattern.test(domain));

export const SuspiciousTrafficCard = ({ referrers, totalVisitors, isLoading }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const flagged = useMemo(() => {
    return referrers
      .map((r) => ({ ...r, threat: classify(r.domain) }))
      .filter((r) => !!r.threat);
  }, [referrers]);

  const suspiciousVisitors = flagged.reduce((s, r) => s + r.visitors, 0);
  const pct = totalVisitors > 0 ? Math.round((suspiciousVisitors / totalVisitors) * 100) : 0;

  const severity: "ok" | "warn" | "alert" =
    pct >= 30 ? "alert" : pct >= 10 ? "warn" : "ok";

  const severityStyles = {
    ok: { color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/10", label: "Tráfego saudável" },
    warn: { color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]/10", label: "Atenção" },
    alert: { color: "text-destructive", bg: "bg-destructive/10", label: "Tráfego ruim alto" },
  }[severity];

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="h-20 bg-muted rounded animate-pulse" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`h-4 w-4 ${severityStyles.color}`} />
          <h3 className="text-sm font-medium text-card-foreground">Qualidade do tráfego</h3>
          <InfoTooltip content="Detecta automaticamente referrers conhecidos de bots, spam e sequestradores de busca. Esses visitantes raramente convertem e poluem suas métricas." />
        </div>
        <Badge variant="outline" className={`text-xs ${severityStyles.color} ${severityStyles.bg} border-transparent`}>
          {severityStyles.label}
        </Badge>
      </div>

      {flagged.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum referrer suspeito detectado no período.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Seu tráfego parece limpo. ✨
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Visitantes suspeitos</span>
              <span className={`text-xs font-semibold ${severityStyles.color}`}>
                {suspiciousVisitors.toLocaleString("pt-BR")} ({pct}%)
              </span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-8 text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            <span>Ver {flagged.length} {flagged.length === 1 ? "origem" : "origens"} suspeita{flagged.length === 1 ? "" : "s"}</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {flagged.map((r) => (
                <div key={r.domain} className="rounded-md border border-border bg-muted/30 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground truncate" title={r.domain}>
                      {r.domain}
                    </span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {r.threat?.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mb-1">
                    {r.threat?.reason}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {r.visitors} visitante{r.visitors === 1 ? "" : "s"} · {r.conversionRate.toFixed(1)}% conversão
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-md bg-primary/5 border border-primary/10 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">Como reduzir tráfego ruim</p>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Bloqueie domínios suspeitos no Cloudflare ou WAF do servidor</li>
                  <li>Adicione Cloudflare Bot Fight Mode (gratuito) para filtrar bots conhecidos</li>
                  <li>Se anuncia: revise palavras-chave negativas e exclua sites da rede de display</li>
                  <li>Pause campanhas de display que enviam tráfego de baixa qualidade</li>
                  <li>Considere CAPTCHA invisível em formulários para barrar submissões automatizadas</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
