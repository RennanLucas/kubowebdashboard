import { useEffect, useState } from "react";
import {
  Activity, BarChart3, Clock, Eye, Globe2, MousePointerClick,
  Smartphone, Sparkles, TrendingUp, Users, Zap,
} from "lucide-react";

interface ProductPreviewProps {
  step?: number;
  interactive?: boolean;
}

interface TimeframeData {
  visitors: string;
  views: string;
  leads: string;
  convRate: string;
  chartPath: string;
  axis: string[];
}

const TIMEFRAME_DATA: Record<"7d" | "30d" | "12m", TimeframeData> = {
  "7d": {
    visitors: "3.120", views: "7.840", leads: "114", convRate: "3,65%",
    chartPath: "M0 65 Q 15 45, 30 52 T 60 38 T 85 24 T 100 18",
    axis: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  },
  "30d": {
    visitors: "12.842", views: "31.296", leads: "486", convRate: "3,78%",
    chartPath: "M0 70 Q 20 48, 40 55 T 70 32 T 90 20 T 100 12",
    axis: ["01 set", "08 set", "15 set", "22 set", "30 set"],
  },
  "12m": {
    visitors: "148.920", views: "384.100", leads: "5.620", convRate: "3,77%",
    chartPath: "M0 80 Q 25 60, 50 45 T 75 25 T 90 15 T 100 8",
    axis: ["Jan", "Mar", "Mai", "Jul", "Set", "Nov"],
  },
};

const TABS = ["Visão geral", "Aquisição", "Comportamento", "Conversões"];

/**
 * Interactive mock of the Kubo dashboard used across the landing page.
 * Every number here is clearly labeled as demo data (`lp-product__demo`),
 * never presented as a live or historical customer metric.
 */
export function ProductPreview({ step = 0, interactive = true }: ProductPreviewProps) {
  const [activeTab, setActiveTab] = useState(step);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "12m">("30d");
  const [selectedMetric, setSelectedMetric] = useState(0);
  const [chartHover, setChartHover] = useState<{ x: number; label: string; value: number } | null>(null);

  useEffect(() => setActiveTab(step), [step]);

  const data = TIMEFRAME_DATA[timeframe];

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const idx = Math.min(data.axis.length - 1, Math.floor((xPct / 100) * data.axis.length));
    const base = parseInt(data.visitors.replace(/\D/g, ""), 10) / data.axis.length;
    setChartHover({ x: xPct, label: data.axis[idx], value: Math.round(base * (0.85 + (xPct / 100) * 0.45)) });
  };

  return (
    <div className="lp-product" aria-label="Demonstração da interface do Kubo Analytics">
      <div className="lp-product__chrome">
        <div className="lp-product__dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="lp-product__address"><span className="lp-live-dot" /> analytics.kuboweb.com.br</div>
        <span className="lp-product__demo">dados demonstrativos interativos</span>
      </div>

      <div className="lp-product__body">
        <aside className="lp-product__sidebar" aria-label="Navegação da demonstração">
          <div className="lp-product__brand"><BarChart3 size={15} /> Kubo</div>
          {TABS.map((label, i) => (
            <button key={label} type="button" className={activeTab === i ? "is-active" : ""} onClick={() => interactive && setActiveTab(i)}>
              {label}
            </button>
          ))}
        </aside>

        <div className="lp-product__main">
          <header className="lp-product__header">
            <div>
              <small>Projeto selecionado</small>
              <strong>Operação principal · Site oficial</strong>
            </div>
            <div className="lp-product__header-actions">
              <span className="lp-product__badge"><span className="lp-live-dot" /> 24 online</span>
              <div className="lp-timeframe-pills" role="group" aria-label="Seletor de período">
                {(["7d", "30d", "12m"] as const).map((tf) => (
                  <button key={tf} type="button" className={timeframe === tf ? "is-active" : ""} onClick={() => interactive && setTimeframe(tf)}>
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {activeTab === 0 && (
            <div className="lp-product__view">
              <div className="lp-metric-grid">
                <Metric icon={<Users />} label="Visitantes" value={data.visitors} delta="+18,4%" active={selectedMetric === 0} onClick={() => interactive && setSelectedMetric(0)} />
                <Metric icon={<Eye />} label="Visualizações" value={data.views} delta="+12,8%" active={selectedMetric === 1} onClick={() => interactive && setSelectedMetric(1)} />
                <Metric icon={<MousePointerClick />} label="Leads WhatsApp" value={data.leads} delta="+24,1%" active={selectedMetric === 2} onClick={() => interactive && setSelectedMetric(2)} />
                <Metric icon={<Activity />} label="Taxa de conversão" value={data.convRate} delta="+0,6%" active={selectedMetric === 3} onClick={() => interactive && setSelectedMetric(3)} />
              </div>

              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title">
                    <span>
                      {["Visitantes únicos", "Visualizações de páginas", "Leads via WhatsApp", "Taxa de conversão"][selectedMetric]}
                    </span>
                    <small>{chartHover ? `${chartHover.label}: ${chartHover.value.toLocaleString("pt-BR")} acessos` : "Passe o mouse no gráfico"}</small>
                  </div>
                  <div className="lp-chart-container">
                    <svg viewBox="0 0 100 90" preserveAspectRatio="none" role="img" aria-label="Gráfico de crescimento de visitantes"
                      onMouseMove={handleChartMouseMove} onMouseLeave={() => setChartHover(null)}>
                      <defs>
                        <linearGradient id="lp-area-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${data.chartPath} L100 90 L0 90 Z`} fill="url(#lp-area-blue)" />
                      <path d={data.chartPath} fill="none" stroke="#60a5fa" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                      {chartHover && (
                        <>
                          <line x1={chartHover.x} y1="0" x2={chartHover.x} y2="90" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                          <circle cx={chartHover.x} cy="35" r="3" fill="#60a5fa" stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                        </>
                      )}
                    </svg>
                    {chartHover && (
                      <div className="lp-chart-hover-pill" style={{ left: `${Math.max(12, Math.min(88, chartHover.x))}%` }}>
                        <b>{chartHover.label}</b><span>{chartHover.value.toLocaleString("pt-BR")} vis.</span>
                      </div>
                    )}
                  </div>
                  <div className="lp-product__axis">{data.axis.map((a) => <span key={a}>{a}</span>)}</div>
                </div>

                <div className="lp-product__sources">
                  <div className="lp-product__chart-title"><span>Principais fontes</span><small>Participação</small></div>
                  <Source label="Orgânico" value="42%" width="42%" tone="blue" />
                  <Source label="Direto" value="31%" width="31%" tone="cyan" />
                  <Source label="Social" value="18%" width="18%" tone="purple" />
                  <Source label="Referência" value="9%" width="9%" tone="muted" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="lp-product__view">
              <div className="lp-metric-grid">
                <Metric icon={<Globe2 />} label="Busca orgânica" value="5.394" delta="42,0%" />
                <Metric icon={<Zap />} label="Acesso direto" value="3.981" delta="31,0%" />
                <Metric icon={<Users />} label="Redes sociais" value="2.311" delta="18,0%" />
                <Metric icon={<Smartphone />} label="Mobile" value="68%" delta="8.732 vis." />
              </div>
              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title"><span>Canais × taxa de conversão</span><small>Últimos 30 dias</small></div>
                  <div className="lp-channel-list">
                    <ChannelRow name="Google orgânico" visits="4.820" convRate="4,2%" leads="202" width="85%" />
                    <ChannelRow name="Tráfego direto" visits="3.981" convRate="3,8%" leads="151" width="70%" />
                    <ChannelRow name="Instagram / bio" visits="1.840" convRate="3,6%" leads="66" width="45%" />
                    <ChannelRow name="LinkedIn orgânico" visits="471" convRate="5,1%" leads="24" width="25%" />
                  </div>
                </div>
                <div className="lp-product__sources">
                  <div className="lp-product__chart-title"><span>Dispositivos</span><small>Total</small></div>
                  <Source label="Smartphone" value="68%" width="68%" tone="green" />
                  <Source label="Desktop" value="29%" width="29%" tone="blue" />
                  <Source label="Tablet" value="3%" width="3%" tone="muted" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="lp-product__view">
              <div className="lp-metric-grid">
                <Metric icon={<Eye />} label="Páginas/sessão" value="2,8" delta="Média" />
                <Metric icon={<Clock />} label="Tempo médio" value="2m 45s" delta="+18s" />
                <Metric icon={<Activity />} label="Taxa de rejeição" value="38,2%" delta="-4,1%" />
                <Metric icon={<Globe2 />} label="Páginas ativas" value="14" delta="no site" />
              </div>
              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title"><span>Páginas mais visitadas</span><small>Visualizações &amp; rejeição</small></div>
                  <div className="lp-pages-table">
                    <div className="lp-pages-row lp-pages-row--head"><span>Página</span><span>Visualizações</span><span>Rejeição</span></div>
                    <div className="lp-pages-row"><span>/ (página inicial)</span><strong>14.820</strong><small>32,1%</small></div>
                    <div className="lp-pages-row"><span>/servicos</span><strong>6.240</strong><small>29,4%</small></div>
                    <div className="lp-pages-row"><span>/precos</span><strong>5.410</strong><small>38,5%</small></div>
                  </div>
                </div>
                <div className="lp-product__sources">
                  <div className="lp-product__chart-title"><span>Mapa de calor</span><small>Horários de pico</small></div>
                  <div className="lp-heat-matrix">
                    {Array.from({ length: 28 }, (_, i) => (
                      <span key={i} className="lp-heat-cell" style={{ opacity: 0.15 + (((i * 9 + 4) % 10) / 10) * 0.85 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="lp-product__view">
              <div className="lp-metric-grid">
                <Metric icon={<Zap />} label="Leads WhatsApp" value="386" delta="79,4%" />
                <Metric icon={<MousePointerClick />} label="Formulários" value="100" delta="20,6%" />
                <Metric icon={<TrendingUp />} label="Taxa de lead" value="3,78%" delta="+0,6%" />
                <Metric icon={<Sparkles />} label="Insights IA" value="3 novos" delta="Semanal" />
              </div>
              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title"><span>Últimos eventos de conversão</span><small>Detecção automática</small></div>
                  <div className="lp-events-feed">
                    <div className="lp-feed-item"><span className="lp-feed-dot is-green" /><div><strong>Clique no WhatsApp</strong><small>Botão flutuante · Página inicial</small></div><time>agora</time></div>
                    <div className="lp-feed-item"><span className="lp-feed-dot is-blue" /><div><strong>Envio de formulário</strong><small>Orçamento rápido · /servicos</small></div><time>há 2 min</time></div>
                  </div>
                </div>
                <div className="lp-product__sources">
                  <div className="lp-product__chart-title"><span>Diagnóstico da IA</span><small>Kubo AI</small></div>
                  <div className="lp-ai-highlight">
                    <div className="lp-ai-highlight__head"><Sparkles size={13} /><span>Oportunidade</span></div>
                    <p>O botão de WhatsApp em <strong>/servicos</strong> tem <strong>2,4x</strong> mais cliques que a média. Recomendamos reforçar o destaque no topo.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, delta, active, onClick }: {
  icon: React.ReactNode; label: string; value: string; delta: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div className={`lp-metric ${active ? "is-selected" : ""}`} onClick={onClick}>
      <div className="lp-metric__top"><span>{icon}</span><small>{label}</small></div>
      <strong>{value}</strong>
      <em>{delta}</em>
    </div>
  );
}

function Source({ label, value, width, tone = "blue" }: { label: string; value: string; width: string; tone?: string }) {
  return (
    <div className={`lp-source is-${tone}`}>
      <div><span>{label}</span><b>{value}</b></div>
      <i><span style={{ width }} /></i>
    </div>
  );
}

function ChannelRow({ name, visits, convRate, leads, width }: { name: string; visits: string; convRate: string; leads: string; width: string }) {
  return (
    <div className="lp-channel-row">
      <div className="lp-channel-row__info"><span>{name}</span><div className="lp-channel-row__bar"><i style={{ width }} /></div></div>
      <div className="lp-channel-row__numbers"><span>{visits} vis.</span><strong>{convRate}</strong><small>{leads} leads</small></div>
    </div>
  );
}
