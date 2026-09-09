import { useState, useEffect } from "react";
import {
  Activity, BarChart3, ChevronDown, Eye, Globe2, MousePointerClick,
  Smartphone, Sparkles, TrendingUp, Users, Zap, Clock
} from "lucide-react";

interface ProductDashboardProps {
  step?: number;
  interactive?: boolean;
}

const chartPath = "M0 77 C 8 72, 13 54, 22 59 S 36 82, 45 49 S 61 37, 70 43 S 83 24, 100 15";

export function ProductDashboard({ step = 0, interactive = true }: ProductDashboardProps) {
  const [activeTab, setActiveTab] = useState(step);

  // Synchronize with external step if supplied (e.g. from sticky scroll observer)
  useEffect(() => {
    setActiveTab(step);
  }, [step]);

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
        <span className="lp-product__demo">dados demonstrativos</span>
      </div>

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
              <button type="button" tabIndex={-1}>
                Últimos 30 dias <ChevronDown size={12} />
              </button>
            </div>
          </header>

          {/* VIEW 0: VISÃO GERAL */}
          {activeTab === 0 && (
            <div className="lp-product__view lp-view-fade">
              <div className="lp-metric-grid">
                <Metric icon={<Users />} label="Visitantes" value="12.842" delta="+18,4%" positive />
                <Metric icon={<Eye />} label="Visualizações" value="31.296" delta="+12,8%" positive />
                <Metric icon={<MousePointerClick />} label="Leads WhatsApp" value="486" delta="+24,1%" positive />
                <Metric icon={<Activity />} label="Taxa de Conversão" value="3,78%" delta="+0,6%" positive />
              </div>

              <div className="lp-product__analytics">
                <div className="lp-product__chart">
                  <div className="lp-product__chart-title">
                    <span>Visitantes e conversões</span>
                    <small>Atualizado em tempo real</small>
                  </div>
                  <svg viewBox="0 0 100 90" preserveAspectRatio="none" role="img" aria-label="Gráfico de crescimento de visitantes">
                    <defs>
                      <linearGradient id="lp-area-blue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${chartPath} L100 90 L0 90 Z`} fill="url(#lp-area-blue)" />
                    <path d={chartPath} fill="none" stroke="#60a5fa" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="lp-product__axis">
                    <span>01 set</span><span>08 set</span><span>15 set</span><span>22 set</span><span>30 set</span>
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
