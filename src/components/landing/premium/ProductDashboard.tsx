import { useState, useEffect } from "react";
import {
  Activity, BarChart3, ChevronDown, Clock, Eye, FileDown, Flame, Globe2,
  MousePointerClick, Search, Smartphone, Sparkles, TrendingUp, Users, Zap
} from "lucide-react";

interface ProductDashboardProps {
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

const timeframeConfig: Record<string, TimeframeData> = {
  "7d": {
    visitors: "3.120",
    views: "7.840",
    leads: "114",
    convRate: "3,65%",
    chartPath: "M0 65 Q 15 45, 30 52 T 60 38 T 85 24 T 100 18",
    axis: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  },
  "30d": {
    visitors: "12.842",
    views: "31.296",
    leads: "486",
    convRate: "3,78%",
    chartPath: "M0 70 Q 20 48, 40 55 T 70 32 T 90 20 T 100 12",
    axis: ["01 set", "08 set", "15 set", "22 set", "30 set"],
  },
  "12m": {
    visitors: "148.920",
    views: "384.100",
    leads: "5.620",
    convRate: "3,77%",
    chartPath: "M0 80 Q 25 60, 50 45 T 75 25 T 90 15 T 100 8",
    axis: ["Jan", "Mar", "Mai", "Jul", "Set", "Nov"],
  },
};

export function ProductDashboard({ step = 0, interactive = true }: ProductDashboardProps) {
  const [activeTab, setActiveTab] = useState(step);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "12m">("30d");
  const [selectedMetric, setSelectedMetric] = useState<number>(0);
  const [chartHover, setChartHover] = useState<{ x: number; label: string; value: number } | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  // Synchronize with external step if supplied (e.g. from sticky scroll observer)
  useEffect(() => {
    setActiveTab(step);
  }, [step]);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    if (!interactive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [interactive]);

  const currentData = timeframeConfig[timeframe];

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const stepIdx = Math.min(currentData.axis.length - 1, Math.floor((xPct / 100) * currentData.axis.length));
    const baseValue = parseInt(currentData.visitors.replace(/\D/g, ""), 10) / currentData.axis.length;
    const variation = Math.round(baseValue * (0.85 + (xPct / 100) * 0.45));

    setChartHover({
      x: xPct,
      label: currentData.axis[stepIdx],
      value: variation,
    });
  };

  return (
    <div className="lp-product" aria-label="Demonstração da interface do Kubo Analytics">
      {/* Top Chrome Bar */}
      <div className="lp-product__chrome">
        <div className="lp-product__dots" aria-hidden="true">
          <i /><i /><i />
        </div>
        <div className="lp-product__address">
          <span className="lp-live-dot" /> analytics.kuboweb.com.br
        </div>
        <button
          type="button"
          className="lp-command-trigger"
          onClick={() => interactive && setCommandOpen(!commandOpen)}
          title="Abrir busca rápida (⌘K)"
        >
          <Search size={9} />
          <span>Ações rápidas</span>
          <kbd>⌘K</kbd>
        </button>
        <span className="lp-product__demo">dados demonstrativos interativos</span>
      </div>

      {/* Command Palette Dropdown */}
      {commandOpen && (
        <div className="lp-command-palette lp-view-fade" role="dialog" aria-label="Paleta de Comandos">
          <div className="lp-command-palette__input-wrap">
            <Search size={13} />
            <input
              type="text"
              placeholder="Digite um comando, métrica ou filtro..."
              autoFocus
              readOnly
              value="Filtrar por conversões de WhatsApp..."
            />
            <button type="button" onClick={() => setCommandOpen(false)}>ESC</button>
          </div>
          <div className="lp-command-palette__list">
            <span className="lp-command-group">Comandos Recomendados</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab(0);
                setSelectedMetric(2);
                setCommandOpen(false);
              }}
            >
              <MousePointerClick size={13} />
              <span>Ver leads de WhatsApp capturados no período</span>
              <small>486 leads</small>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab(3);
                setCommandOpen(false);
              }}
            >
              <Zap size={13} />
              <span>Abrir monitoramento ao vivo de visitantes</span>
              <small>Kubo Live</small>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab(2);
                setCommandOpen(false);
              }}
            >
              <Flame size={13} />
              <span>Diagnóstico de horários de pico (Heatmap)</span>
              <small>24x7</small>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab(1);
                setCommandOpen(false);
              }}
            >
              <Globe2 size={13} />
              <span>Análise de canais e páginas mais visitadas</span>
              <small>Origens</small>
            </button>
          </div>
        </div>
      )}

      <div className="lp-product__body">
        {/* Left Sidebar Nav */}
        <aside className="lp-product__sidebar" aria-label="Navegação da demonstração">
          <div className="lp-product__brand">
            <BarChart3 size={15} /> Kubo
          </div>
          <button
            type="button"
            className={activeTab === 0 ? "is-active" : ""}
            onClick={() => interactive && setActiveTab(0)}
          >
            Visão geral
          </button>
          <button
            type="button"
            className={activeTab === 1 ? "is-active" : ""}
            onClick={() => interactive && setActiveTab(1)}
          >
            Aquisição
          </button>
          <button
            type="button"
            className={activeTab === 2 ? "is-active" : ""}
            onClick={() => interactive && setActiveTab(2)}
          >
            Comportamento
          </button>
          <button
            type="button"
            className={activeTab === 3 ? "is-active" : ""}
            onClick={() => interactive && setActiveTab(3)}
          >
            Conversões
          </button>
        </aside>

        {/* Main Dashboard Screen */}
        <div className="lp-product__main">
          <header className="lp-product__header">
            <div>
              <small>Projeto Selecionado</small>
              <strong>Operação Principal · Site Oficial</strong>
            </div>
            <div className="lp-product__header-actions">
              <span className="lp-product__badge">
                <span className="lp-live-dot" /> 24 online
              </span>
              <div className="lp-timeframe-pills" role="group" aria-label="Seletor de período">
                <button
                  type="button"
                  className={timeframe === "7d" ? "is-active" : ""}
                  onClick={() => interactive && setTimeframe("7d")}
                >
                  7D
                </button>
                <button
                  type="button"
                  className={timeframe === "30d" ? "is-active" : ""}
                  onClick={() => interactive && setTimeframe("30d")}
                >
                  30D
                </button>
                <button
                  type="button"
                  className={timeframe === "12m" ? "is-active" : ""}
                  onClick={() => interactive && setTimeframe("12m")}
                >
                  12M
                </button>
              </div>
            </div>
          </header>

          {/* VIEW 0: VISÃO GERAL */}
          {activeTab === 0 && (
            <div className="lp-product__view lp-view-fade">
              <div className="lp-metric-grid">
                <div
                  className={`lp-metric-card-wrap ${selectedMetric === 0 ? "is-selected" : ""}`}
                  onClick={() => interactive && setSelectedMetric(0)}
                >
                  <Metric icon={<Users />} label="Visitantes" value={currentData.visitors} delta="+18,4%" positive />
                </div>
                <div
                  className={`lp-metric-card-wrap ${selectedMetric === 1 ? "is-selected" : ""}`}
                  onClick={() => interactive && setSelectedMetric(1)}
                >
                  <Metric icon={<Eye />} label="Visualizações" value={currentData.views} delta="+12,8%" positive />
                </div>
                <div
                  className={`lp-metric-card-wrap ${selectedMetric === 2 ? "is-selected" : ""}`}
                  onClick={() => interactive && setSelectedMetric(2)}
                >
                  <Metric icon={<MousePointerClick />} label="Leads WhatsApp" value={currentData.leads} delta="+24,1%" positive />
                </div>
                <div
                  className={`lp-metric-card-wrap ${selectedMetric === 3 ? "is-selected" : ""}`}
                  onClick={() => interactive && setSelectedMetric(3)}
                >
                  <Metric icon={<Activity />} label="Taxa de Conversão" value={currentData.convRate} delta="+0,6%" positive />
                </div>
              </div>

              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title">
                    <span>
                      {selectedMetric === 0 && "Visitantes únicos"}
                      {selectedMetric === 1 && "Visualizações de páginas"}
                      {selectedMetric === 2 && "Leads capturados via WhatsApp"}
                      {selectedMetric === 3 && "Taxa de conversão contínua"}
                    </span>
                    <small>
                      {chartHover ? `${chartHover.label}: ${chartHover.value.toLocaleString("pt-BR")} acessos` : "Passe o mouse no gráfico"}
                    </small>
                  </div>
                  <div className="lp-chart-container">
                    <svg
                      viewBox="0 0 100 90"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Gráfico interativo de crescimento de visitantes"
                      onMouseMove={handleChartMouseMove}
                      onMouseLeave={() => setChartHover(null)}
                    >
                      <defs>
                        <linearGradient id="lp-area-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${currentData.chartPath} L100 90 L0 90 Z`} fill="url(#lp-area-blue)" />
                      <path d={currentData.chartPath} fill="none" stroke="#60a5fa" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />

                      {/* Interactive Crosshair & Point on hover */}
                      {chartHover && (
                        <>
                          <line
                            x1={chartHover.x}
                            y1="0"
                            x2={chartHover.x}
                            y2="90"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="0.8"
                            strokeDasharray="2,2"
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle
                            cx={chartHover.x}
                            cy="35"
                            r="3"
                            fill="#60a5fa"
                            stroke="#fff"
                            strokeWidth="1.2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      )}
                    </svg>

                    {/* Floating Tooltip readout on chart */}
                    {chartHover && (
                      <div
                        className="lp-chart-hover-pill"
                        style={{ left: `${Math.max(12, Math.min(88, chartHover.x))}%` }}
                      >
                        <b>{chartHover.label}</b>
                        <span>{chartHover.value.toLocaleString("pt-BR")} vis.</span>
                      </div>
                    )}
                  </div>
                  <div className="lp-product__axis">
                    {currentData.axis.map((item, idx) => (
                      <span key={idx}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className="lp-product__sources">
                  <div className="lp-product__chart-title">
                    <span>Principais Fontes</span>
                    <small>Participação</small>
                  </div>
                  <Source label="Orgânico" value="42%" width="42%" tone="blue" />
                  <Source label="Direto" value="31%" width="31%" tone="cyan" />
                  <Source label="Social" value="18%" width="18%" tone="purple" />
                  <Source label="Referência" value="9%" width="9%" tone="muted" />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: AQUISIÇÃO E FONTES */}
          {activeTab === 1 && (
            <div className="lp-product__view lp-view-fade">
              <div className="lp-metric-grid">
                <Metric icon={<Globe2 />} label="Busca Orgânica" value="5.394" delta="42,0%" positive />
                <Metric icon={<Zap />} label="Acesso Direto" value="3.981" delta="31,0%" positive />
                <Metric icon={<Users />} label="Redes Sociais" value="2.311" delta="18,0%" positive />
                <Metric icon={<Smartphone />} label="Mobile" value="68%" delta="8.732 vis." positive />
              </div>

              <div className="lp-product__analytics">
                <div className="lp-product__chart lp-product__chart--channels">
                  <div className="lp-product__chart-title">
                    <span>Canais x Taxa de Conversão</span>
                    <small>Últimos 30 dias</small>
                  </div>
                  <div className="lp-channel-list">
                    <ChannelRow name="Google Orgânico" visits="4.820" convRate="4,2%" leads="202" width="85%" />
                    <ChannelRow name="Tráfego Direto" visits="3.981" convRate="3,8%" leads="151" width="70%" />
                    <ChannelRow name="Instagram / Bio" visits="1.840" convRate="3,6%" leads="66" width="45%" />
                    <ChannelRow name="LinkedIn Orgânico" visits="471" convRate="5,1%" leads="24" width="25%" />
                    <ChannelRow name="Outros" visits="1.730" convRate="2,5%" leads="43" width="30%" />
                  </div>
                </div>

                <div className="lp-product__sources">
                  <div className="lp-product__chart-title">
                    <span>Dispositivos</span>
                    <small>Total</small>
                  </div>
                  <Source label="Smartphone" value="68%" width="68%" tone="green" />
                  <Source label="Desktop" value="29%" width="29%" tone="blue" />
                  <Source label="Tablet" value="3%" width="3%" tone="muted" />
                  <div className="lp-product__mini-tip">
                    <small>72% dos cliques em WhatsApp ocorrem em dispositivos mobile.</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: COMPORTAMENTO E MAPA DE CALOR */}
          {activeTab === 2 && (
            <div className="lp-product__view lp-view-fade">
              <div className="lp-metric-grid">
                <Metric icon={<Eye />} label="Páginas/Sessão" value="2,8" delta="Média" positive />
                <Metric icon={<Clock />} label="Tempo Médio" value="2m 45s" delta="+18s" positive />
                <Metric icon={<Activity />} label="Taxa de Rejeição" value="38,2%" delta="-4,1%" positive />
                <Metric icon={<Globe2 />} label="Páginas Ativas" value="14" delta="no site" positive />
              </div>

              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title">
                    <span>Páginas Mais Visitadas</span>
                    <small>Visualizações & Rejeição</small>
                  </div>
                  <div className="lp-pages-table">
                    <div className="lp-pages-row lp-pages-row--head">
                      <span>Página</span>
                      <span>Visualizações</span>
                      <span>Rejeição</span>
                    </div>
                    <div className="lp-pages-row">
                      <span>/ (Página Inicial)</span>
                      <strong>14.820</strong>
                      <small>32,1%</small>
                    </div>
                    <div className="lp-pages-row">
                      <span>/servicos</span>
                      <strong>6.240</strong>
                      <small>29,4%</small>
                    </div>
                    <div className="lp-pages-row">
                      <span>/precos</span>
                      <strong>5.410</strong>
                      <small>38,5%</small>
                    </div>
                    <div className="lp-pages-row">
                      <span>/contato</span>
                      <strong>2.890</strong>
                      <small>22,0%</small>
                    </div>
                  </div>
                </div>

                <div className="lp-product__sources">
                  <div className="lp-product__chart-title">
                    <span>Mapa de Calor</span>
                    <small>Horários de Pico</small>
                  </div>
                  <div className="lp-heat-matrix">
                    {Array.from({ length: 28 }, (_, i) => (
                      <span
                        key={i}
                        className="lp-heat-cell"
                        style={{
                          opacity: 0.15 + (((i * 9 + 4) % 10) / 10) * 0.85
                        }}
                      />
                    ))}
                  </div>
                  <div className="lp-product__mini-tip">
                    <small>Pico de visitas e conversão identificado: Terças e Quintas, 14h às 18h.</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: CONVERSÕES E LEADS */}
          {activeTab === 3 && (
            <div className="lp-product__view lp-view-fade">
              <div className="lp-metric-grid">
                <Metric icon={<Zap />} label="Leads WhatsApp" value="386" delta="79,4%" positive />
                <Metric icon={<MousePointerClick />} label="Formulários" value="100" delta="20,6%" positive />
                <Metric icon={<TrendingUp />} label="Taxa de Lead" value="3,78%" delta="+0,6%" positive />
                <Metric icon={<Sparkles />} label="Insights IA" value="3 novos" delta="Semanal" positive />
              </div>

              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title">
                    <span>Últimos Eventos de Conversão</span>
                    <small>Detecção automática</small>
                  </div>
                  <div className="lp-events-feed">
                    <div className="lp-feed-item">
                      <span className="lp-feed-dot is-green" />
                      <div>
                        <strong>Clique no WhatsApp</strong>
                        <small>Botão Flutuante · Página Inicial</small>
                      </div>
                      <time>agora</time>
                    </div>
                    <div className="lp-feed-item">
                      <span className="lp-feed-dot is-blue" />
                      <div>
                        <strong>Envio de Formulário</strong>
                        <small>Orçamento Rápido · /servicos</small>
                      </div>
                      <time>há 2 min</time>
                    </div>
                    <div className="lp-feed-item">
                      <span className="lp-feed-dot is-green" />
                      <div>
                        <strong>Clique no WhatsApp</strong>
                        <small>CTA Secundário · /precos</small>
                      </div>
                      <time>há 5 min</time>
                    </div>
                  </div>
                </div>

                <div className="lp-product__sources">
                  <div className="lp-product__chart-title">
                    <span>Diagnóstico da IA</span>
                    <small>Kubo AI</small>
                  </div>
                  <div className="lp-ai-highlight">
                    <div className="lp-ai-highlight__head">
                      <Sparkles size={13} />
                      <span>Oportunidade</span>
                    </div>
                    <p>
                      O botão de WhatsApp em <strong>/servicos</strong> tem <strong>2,4x</strong> mais cliques que a média. Recomendamos reforçar o destaque no topo.
                    </p>
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

function Metric({
  icon, label, value, delta, positive
}: {
  icon: React.ReactNode; label: string; value: string; delta: string; positive?: boolean;
}) {
  return (
    <div className="lp-metric">
      <div className="lp-metric__top">
        <span>{icon}</span>
        <small>{label}</small>
      </div>
      <strong>{value}</strong>
      <em className={positive ? "is-pos" : ""}>{delta}</em>
    </div>
  );
}

function Source({
  label, value, width, tone = "blue"
}: {
  label: string; value: string; width: string; tone?: string;
}) {
  return (
    <div className={`lp-source is-${tone}`}>
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <i>
        <span style={{ width }} />
      </i>
    </div>
  );
}

function ChannelRow({
  name, visits, convRate, leads, width
}: {
  name: string; visits: string; convRate: string; leads: string; width: string;
}) {
  return (
    <div className="lp-channel-row">
      <div className="lp-channel-row__info">
        <span>{name}</span>
        <div className="lp-channel-row__bar">
          <i style={{ width }} />
        </div>
      </div>
      <div className="lp-channel-row__numbers">
        <span>{visits} vis.</span>
        <strong>{convRate}</strong>
        <small>{leads} leads</small>
      </div>
    </div>
  );
}
