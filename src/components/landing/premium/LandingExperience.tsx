import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, BellRing, BrainCircuit, Check, Clock3,
  Copy, Cpu, FileDown, Flame, Gauge, Globe2, Layers3, Lock, MessageSquare,
  MousePointerClick, MonitorSmartphone, Radar, Server, ShieldCheck, Sparkles,
  Target, Users, Zap, X, AlertTriangle, Shield, SlidersHorizontal, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePlans } from "@/hooks/usePlans";
import { ProductDashboard } from "./ProductDashboard";

const storySteps = [
  { kicker: "01 · Visão geral", title: "O pulso do seu site em uma tela.", copy: "Visitantes, visualizações, sessões, leads e conversão entram em contexto, com comparação de período e leitura por projeto.", stat: "12.842", label: "visitantes no período" },
  { kicker: "02 · Aquisição", title: "Descubra de onde a atenção vem.", copy: "Separe tráfego direto, orgânico, social, pago, referência e e-mail. Cruze a origem com dispositivos e páginas mais acessadas.", stat: "42%", label: "de tráfego orgânico" },
  { kicker: "03 · Comportamento", title: "Encontre o caminho até a ação.", copy: "Acompanhe páginas, horários, dispositivos, localização aproximada e mapas de calor para reconhecer padrões de navegação.", stat: "3,78%", label: "de conversão" },
  { kicker: "04 · Decisão", title: "Transforme sinal em próxima ação.", copy: "Metas, alertas, comparações, relatórios e resumos com IA ajudam a priorizar o que merece atenção agora.", stat: "+24%", label: "em leads demonstrativos" },
];

export function SignalRail() {
  return (
    <section className="lp-signal" aria-label="Métricas e conformidade do Kubo">
      <div className="lp-shell lp-signal__inner">
        <span><Zap /> Script ultraleve de 2KB</span>
        <span><Clock3 /> Latência &lt; 50ms</span>
        <span><Gauge /> 99.9% de uptime</span>
        <span><ShieldCheck /> 100% LGPD sem cookies invasivos</span>
        <span><MousePointerClick /> Rastreamento automático de WhatsApp</span>
      </div>
    </section>
  );
}

export function TrustProofSection() {
  const brands = [
    { name: "VORTEX MEDIA", category: "Performance & Growth" },
    { name: "AURORA COMMERCE", category: "E-commerce Scale" },
    { name: "NEXUS STUDIO", category: "Design & Web Agency" },
    { name: "METRÓPOLE TECH", category: "Consultoria Digital" },
    { name: "PULSE GROWTH", category: "Inbound & CRO" },
    { name: "ALPHASTACK", category: "Full-Service Partner" },
  ];

  return (
    <section className="lp-trust-proof" aria-label="Empresas e agências parceiras">
      <div className="lp-shell">
        <p className="lp-trust-proof__title">
          Infraestrutura analítica adotada por agências, consultorias e empresas em todo o Brasil
        </p>

        <div className="lp-trust-proof__logos">
          {brands.map((b) => (
            <div key={b.name} className="lp-trust-logo">
              <span className="lp-trust-logo__mark" />
              <div className="lp-trust-logo__info">
                <strong>{b.name}</strong>
                <small>{b.category}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-trust-stats">
          <div className="lp-trust-stat">
            <strong>+1.8M</strong>
            <span>Eventos computados/dia</span>
          </div>
          <div className="lp-trust-stat">
            <strong>&lt; 14ms</strong>
            <span>Tempo médio de coleta</span>
          </div>
          <div className="lp-trust-stat">
            <strong>99.98%</strong>
            <span>Disponibilidade SLA</span>
          </div>
          <div className="lp-trust-stat">
            <strong>100%</strong>
            <span>LGPD nativa (0 cookies)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProblemSolutionBridge() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(x);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <section className="lp-bridge">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>O contraste que muda o jogo</span>
          <h2>Por que o Google Analytics<br />ficou para trás.</h2>
          <p>O GA4 se tornou um labirinto de configurações, dados com atraso de até 48 horas e zero foco em conversão rápida de WhatsApp.</p>
        </div>

        {/* Flape-inspired Interactive Split Comparison Slider */}
        <div className="lp-split-section lp-reveal">
          <div className="lp-split-controls">
            <button
              type="button"
              className={`lp-split-mode-btn ${sliderPos === 50 ? "is-active" : ""}`}
              onClick={() => setSliderPos(50)}
            >
              <SlidersHorizontal size={12} />
              <span>Dividido (50 / 50)</span>
            </button>
            <button
              type="button"
              className={`lp-split-mode-btn is-ga4 ${sliderPos <= 10 ? "is-active" : ""}`}
              onClick={() => setSliderPos(0)}
            >
              <X size={12} />
              <span>Ver 100% GA4</span>
            </button>
            <button
              type="button"
              className={`lp-split-mode-btn is-kubo ${sliderPos >= 90 ? "is-active" : ""}`}
              onClick={() => setSliderPos(100)}
            >
              <Check size={12} />
              <span>Ver 100% Kubo Analytics</span>
            </button>
          </div>

          <div
            ref={viewportRef}
            className="lp-split-viewport"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: isDragging ? "ew-resize" : "default" }}
            aria-label="Comparador interativo antes e depois"
          >
            {/* Before (GA4) Pane */}
            <div className="lp-split-pane lp-split-pane--before">
              <div className="lp-split-pane__content">
                <div className="lp-split-header">
                  <span className="lp-split-badge lp-split-badge--ga4">
                    <AlertTriangle size={12} /> Analytics Tradicional (GA4)
                  </span>
                  <span className="lp-split-latency">
                    Atraso: <b>24h a 48h de espera</b>
                  </span>
                </div>

                <div className="lp-split-kpis">
                  <div className="lp-split-kpi-card is-bad">
                    <small>Visitantes Registrados</small>
                    <strong>~1.240</strong>
                    <span>-38% por cookies rejeitados</span>
                  </div>
                  <div className="lp-split-kpi-card is-bad">
                    <small>Cliques no WhatsApp</small>
                    <strong>Não rastreado</strong>
                    <span>Exige GTM manual e quebra fácil</span>
                  </div>
                  <div className="lp-split-kpi-card is-bad">
                    <small>Peso no Navegador</small>
                    <strong>120 KB</strong>
                    <span>Penaliza Core Web Vitals</span>
                  </div>
                </div>

                <div className="lp-split-points">
                  <div className="lp-split-point">
                    <X size={14} className="is-bad" />
                    <div>
                      <strong>Relatórios desatualizados</strong>
                      <p>Campanhas rodando no escuro sem feedback em tempo real.</p>
                    </div>
                  </div>
                  <div className="lp-split-point">
                    <X size={14} className="is-bad" />
                    <div>
                      <strong>Banners invasivos de cookies</strong>
                      <p>Poluição visual que espanta até 40% dos novos acessos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* After (Kubo) Pane with clipPath */}
            <div
              className="lp-split-pane lp-split-pane--after"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <div className="lp-split-pane__content">
                <div className="lp-split-header">
                  <span className="lp-split-badge lp-split-badge--kubo">
                    <Sparkles size={12} /> Kubo Analytics 2.0
                  </span>
                  <span className="lp-split-latency">
                    Latência: <b>&lt; 14ms em tempo real</b>
                  </span>
                </div>

                <div className="lp-split-kpis">
                  <div className="lp-split-kpi-card is-good">
                    <small>Visitantes Reais</small>
                    <strong>12.842</strong>
                    <span>100% dos sinais coletados</span>
                  </div>
                  <div className="lp-split-kpi-card is-good">
                    <small>Conversões WhatsApp</small>
                    <strong>486 leads</strong>
                    <span>Captura nativa em 1 clique</span>
                  </div>
                  <div className="lp-split-kpi-card is-good">
                    <small>Peso do Snippet</small>
                    <strong>2.1 KB</strong>
                    <span>Nota 100 no Google PageSpeed</span>
                  </div>
                </div>

                <div className="lp-split-points">
                  <div className="lp-split-point">
                    <Check size={14} className="is-good" />
                    <div>
                      <strong>Sinais ao vivo sem delay</strong>
                      <p>Saiba na hora exata se o tráfego e os anúncios geraram leads.</p>
                    </div>
                  </div>
                  <div className="lp-split-point">
                    <Check size={14} className="is-good" />
                    <div>
                      <strong>100% LGPD nativa (0 cookies)</strong>
                      <p>Nenhum banner invasivo, nenhuma coleta de dados sensíveis.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="lp-split-handle"
              style={{ left: `${sliderPos}%` }}
              onPointerDown={handlePointerDown}
            >
              <div className="lp-split-handle__btn">
                <span>◀ ▶</span>
              </div>
              <div className="lp-split-handle__pill">
                {sliderPos < 35 ? "GA4" : sliderPos > 65 ? "Kubo" : `${Math.round(sliderPos)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Cards Grid */}
        <div className="lp-bridge__grid lp-reveal">
          <div className="lp-bridge__card is-problem">
            <div className="lp-bridge__badge">
              <AlertTriangle size={14} /> Analytics Tradicional (GA4)
            </div>
            <ul className="lp-bridge__list">
              <li>
                <X className="is-bad" />
                <div>
                  <strong>Relatórios com 24h a 48h de atraso</strong>
                  <p>Você precisa esperar até 2 dias para saber se uma campanha ou post funcionou.</p>
                </div>
              </li>
              <li>
                <X className="is-bad" />
                <div>
                  <strong>Sem rastreamento nativo de WhatsApp</strong>
                  <p>Exige configurar Google Tag Manager, dataLayer e triggers complexos que frequentemente quebram.</p>
                </div>
              </li>
              <li>
                <X className="is-bad" />
                <div>
                  <strong>Script pesado (45KB a 120KB)</strong>
                  <p>Penaliza o Google PageSpeed e derruba as notas de Core Web Vitals do site.</p>
                </div>
              </li>
              <li>
                <X className="is-bad" />
                <div>
                  <strong>Banners de consentimento invasivos</strong>
                  <p>Cookies de terceiros que incomodam visitantes e reduzem a taxa de permanência.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="lp-bridge__card is-solution">
            <div className="lp-bridge__badge is-green">
              <Sparkles size={14} /> Kubo Analytics
            </div>
            <ul className="lp-bridge__list">
              <li>
                <Check className="is-good" />
                <div>
                  <strong>Dados em tempo real sem delay</strong>
                  <p>Visitantes ativos, eventos e conversões são computados no instante exato em que ocorrem.</p>
                </div>
              </li>
              <li>
                <Check className="is-good" />
                <div>
                  <strong>Cliques no WhatsApp rastreados sozinhos</strong>
                  <p>O script detecta links de WhatsApp e envios de formulário automaticamente. Zero setup.</p>
                </div>
              </li>
              <li>
                <Check className="is-good" />
                <div>
                  <strong>Snippet de apenas 2KB</strong>
                  <p>Assíncrono, imperceptível no navegador e com nota 100 garantida no PageSpeed.</p>
                </div>
              </li>
              <li>
                <Check className="is-good" />
                <div>
                  <strong>Privacidade por princípio (100% LGPD)</strong>
                  <p>Sem cookies invasivos de remarketing cruzado. Métricas fiéis sem banners chatos.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.index));
    }, { threshold: [0.35, 0.55, 0.75], rootMargin: "-18% 0px -25%" });
    refs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="product-story" className="lp-story">
      <div className="lp-shell">
        <div className="lp-section-head lp-reveal">
          <span>Do acesso à decisão</span>
          <h2>Entenda o que acontece<br />no seu site.</h2>
          <p>Uma apresentação contínua dos sinais que o Kubo já acompanha — sem inventar métricas, integrações ou promessas.</p>
        </div>

        <div className="lp-story__grid">
          <div className="lp-story__visual" data-step={active}>
            <div className="lp-story__frame">
              <ProductDashboard step={active} interactive={false} />
            </div>
            <div className="lp-story__readout" aria-live="polite">
              <span>{storySteps[active].kicker}</span>
              <strong>{storySteps[active].stat}</strong>
              <small>{storySteps[active].label}</small>
            </div>
            <div className="lp-story__progress" aria-hidden="true">
              {storySteps.map((_, index) => <i key={index} className={index === active ? "is-active" : ""} />)}
            </div>
          </div>

          <div className="lp-story__steps">
            {storySteps.map((step, index) => (
              <article key={step.title} ref={(element) => { refs.current[index] = element; }} data-index={index} className={active === index ? "is-active" : ""}>
                <span>{step.kicker}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const events = [
  { icon: Users, place: "São Paulo · Brasil", action: "Novo visitante único", detail: "Página inicial", tone: "blue" },
  { icon: Globe2, place: "Google Orgânico", action: "Origem identificada", detail: "Busca por serviço", tone: "cyan" },
  { icon: MousePointerClick, place: "/precos", action: "Visualização de tabela", detail: "Plano Pro", tone: "violet" },
  { icon: Zap, place: "Conversão Direta", action: "Clique em WhatsApp", detail: "Botão flutuante", tone: "green" },
];

export function RealtimeSection() {
  const initialEvents = [
    { icon: Users, place: "São Paulo · Brasil", action: "Novo visitante único", detail: "Página inicial", tone: "blue" },
    { icon: Globe2, place: "Google Orgânico", action: "Origem identificada", detail: "Busca por serviço", tone: "cyan" },
    { icon: MousePointerClick, place: "/precos", action: "Visualização de tabela", detail: "Plano Pro", tone: "violet" },
    { icon: Zap, place: "Conversão Direta", action: "Clique em WhatsApp", detail: "Botão flutuante", tone: "green" },
  ];

  const [liveEvents, setLiveEvents] = useState(initialEvents);
  const [activeCount, setActiveCount] = useState(24);
  const [isPinging, setIsPinging] = useState(false);

  const handleSimulateEvent = () => {
    setIsPinging(true);
    setActiveCount((c) => c + 1);
    const simulatedCities = ["Curitiba · Brasil", "Rio de Janeiro · Brasil", "Belo Horizonte · Brasil", "Porto Alegre · Brasil"];
    const randomCity = simulatedCities[Math.floor(Math.random() * simulatedCities.length)];
    const newEvent = {
      icon: Zap,
      place: randomCity,
      action: "Clique em WhatsApp",
      detail: "Botão Flutuante · Orçamento",
      tone: "green",
    };
    setLiveEvents((prev) => [newEvent, ...prev.slice(0, 3)]);
    setTimeout(() => setIsPinging(false), 800);
  };

  return (
    <section id="realtime" className="lp-realtime">
      <div className="lp-shell lp-realtime__grid">
        <div className="lp-realtime__copy lp-reveal">
          <span className="lp-kicker"><span className="lp-live-dot" /> Ao vivo</span>
          <h2>O site não para.<br />Seu painel também não.</h2>
          <p>Veja visitantes ativos, páginas em visualização, origem e eventos recentes sem recarregar a página.</p>
          <div className="lp-realtime__actions">
            <Link to="/login" className="lp-text-link">Explorar o Kubo Live <ArrowRight /></Link>
            <button
              type="button"
              onClick={handleSimulateEvent}
              className={`lp-sim-btn ${isPinging ? "is-active" : ""}`}
              aria-label="Disparar acesso de teste no console"
            >
              <Zap size={13} />
              <span>Simular Acesso ao Vivo</span>
            </button>
          </div>
        </div>
        <div className="lp-event-console lp-reveal">
          <div className="lp-event-console__top">
            <span><i /> Eventos em tempo real</span>
            <small>Demonstração interativa</small>
          </div>
          <div className="lp-event-console__pulse">
            <strong className={isPinging ? "lp-pulse-pop" : ""}>{activeCount}</strong>
            <span>visitantes agora</span>
            <i className={isPinging ? "is-fast" : ""} />
          </div>
          <div className="lp-event-list">
            {liveEvents.map(({ icon: Icon, place, action, detail, tone }, index) => (
              <div className="lp-event" style={{ "--delay": `${index * 120}ms` } as React.CSSProperties} key={`${place}-${index}`}>
                <span className={`lp-event__icon is-${tone}`}><Icon /></span>
                <div><strong>{action}</strong><small>{place} · {detail}</small></div>
                <time>agora</time>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function InsightsSection() {
  return (
    <section id="insights" className="lp-insights">
      <div className="lp-insights__orb" aria-hidden="true" />
      <div className="lp-shell lp-insights__grid">
        <div className="lp-insights__copy lp-reveal">
          <span className="lp-kicker"><Sparkles /> Resumos com IA</span>
          <h2>Menos tempo lendo gráficos.<br />Mais clareza para agir.</h2>
          <p>O Kubo organiza os sinais do período em resumos objetivos. Você continua no controle; a IA ajuda a encontrar o que merece atenção.</p>
          <small>Disponível no plano Pro · exemplos com dados demonstrativos</small>
        </div>
        <div className="lp-insight-stack lp-reveal">
          <InsightCard type="positive" label="Oportunidade" title="Tráfego orgânico em alta" copy="A participação da busca cresceu no período e já representa 42% das visitas." stat="+18%" />
          <InsightCard type="attention" label="Ponto de atenção" title="Saídas concentradas em /precos" copy="Esta página apresenta a maior taxa de saída entre as páginas mais acessadas." stat="62%" />
          <InsightCard type="neutral" label="Resumo" title="WhatsApp lidera conversões" copy="O canal respondeu pela maior parte dos leads identificados no período." stat="86" />
        </div>
      </div>
    </section>
  );
}

function InsightCard({ type, label, title, copy, stat }: { type: string; label: string; title: string; copy: string; stat: string }) {
  return (
    <article className={`lp-insight is-${type}`}>
      <div className="lp-insight__mark"><BrainCircuit /></div>
      <div><span>{label}</span><h3>{title}</h3><p>{copy}</p></div>
      <strong>{stat}</strong>
    </article>
  );
}

function InteractiveFeaturesShowcase({ onOpenReportPreview }: { onOpenReportPreview: () => void }) {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "realtime" | "heatmap" | "whitelabel" | "kuboai" | "privacy">("whatsapp");

  // WhatsApp simulation state
  const [waLeads, setWaLeads] = useState(486);
  const [waClicked, setWaClicked] = useState(false);
  const [waToast, setWaToast] = useState(false);

  // Realtime simulation state
  const [rtVisitors, setRtVisitors] = useState(24);
  const [rtBurst, setRtBurst] = useState(false);
  const [rtList, setRtList] = useState([
    { path: "/", visitors: 14, source: "Busca Orgânica" },
    { path: "/precos", visitors: 6, source: "Instagram" },
    { path: "/contato", visitors: 4, source: "Direto" },
  ]);

  // Heatmap slot state
  const [selectedHeat, setSelectedHeat] = useState({
    day: "Terça-feira",
    time: "14:00 às 18:00",
    visits: 92,
    leads: 7,
    highlight: "Pico Máximo de Conversão da Semana",
  });

  // White-label state
  const [agencyName, setAgencyName] = useState("Sua Agência Digital");
  const [agencyTheme, setAgencyTheme] = useState("#3b82f6");

  // Kubo AI prompt state
  const [aiFocus, setAiFocus] = useState<"growth" | "warning" | "conv">("growth");

  // Privacy latency test
  const [benchRunning, setBenchRunning] = useState(false);
  const [localLatency, setLocalLatency] = useState(14);

  const handleWaClick = () => {
    setWaClicked(true);
    setWaLeads((c) => c + 1);
    setWaToast(true);
    setTimeout(() => setWaClicked(false), 300);
    setTimeout(() => setWaToast(false), 3500);
  };

  const handleSimulateVisitor = () => {
    setRtBurst(true);
    setRtVisitors((c) => c + 1);
    setRtList((prev) => [
      { path: "/servicos", visitors: 1, source: "Novo Visitante (SP)" },
      ...prev.slice(0, 2),
    ]);
    setTimeout(() => setRtBurst(false), 800);
  };

  const handleTestLatency = () => {
    setBenchRunning(true);
    const start = performance.now();
    setTimeout(() => {
      const ms = Math.max(9, Math.round(performance.now() - start + 4));
      setLocalLatency(ms);
      setBenchRunning(false);
    }, 200);
  };

  const tabs = [
    { id: "whatsapp", title: "Cliques no WhatsApp", tag: "Auto-detect", icon: MousePointerClick, desc: "Captura links wa.me e botões sem GTM" },
    { id: "realtime", title: "Visitantes ao Vivo", tag: "Sem Delay", icon: Activity, desc: "Métricas ao vivo com latência < 15ms" },
    { id: "heatmap", title: "Mapas de Calor 24x7", tag: "Por Horário", icon: Flame, desc: "Descubra os picos exatos de intenção" },
    { id: "whitelabel", title: "Relatórios White-Label", tag: "1 Clique", icon: FileDown, desc: "PDF corporativo com o logo da sua agência" },
    { id: "kuboai", title: "Resumos com Kubo AI", tag: "IA Nativa", icon: Sparkles, desc: "Diagnósticos objetivos e prioridades" },
    { id: "privacy", title: "100% LGPD sem Cookies", tag: "Zero Cookies", icon: ShieldCheck, desc: "Script de 2KB, PageSpeed 100 garantido" },
  ] as const;

  return (
    <div className="lp-tools-showcase lp-reveal">
      {/* Left Navigation */}
      <div className="lp-tools-nav">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`lp-tool-item ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <div className="lp-tool-item__icon">
                <Icon size={16} />
              </div>
              <div className="lp-tool-item__body">
                <div className="lp-tool-item__top">
                  <h5 className="lp-tool-item__title">{t.title}</h5>
                  <span className="lp-tool-item__tag">{t.tag}</span>
                </div>
                <p className="lp-tool-item__desc">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Interactive Playground Screen */}
      <div className="lp-tools-screen">
        {activeTab === "whatsapp" && (
          <>
            <div className="lp-tools-screen__header">
              <div className="lp-tools-screen__title">
                <h4>Detecção Automática de Leads em WhatsApp</h4>
                <p>O script identifica números de WhatsApp e botões wa.me sem quebras de acionador.</p>
              </div>
              <span className="lp-product__badge">
                <span className="lp-live-dot" /> 14ms de tempo de captura
              </span>
            </div>

            <div className="lp-tools-screen__content">
              <div className="lp-preview-box">
                <div className="lp-preview-wa-stage">
                  <div className="lp-preview-wa-card">
                    <div className="lp-preview-wa-info">
                      <strong>+55 (11) 98765-4321</strong>
                      <span>Origem: Busca Orgânica · Página: /servicos</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleWaClick}
                      className="lp-preview-wa-btn"
                    >
                      <MousePointerClick size={14} />
                      <span>{waClicked ? "Registrado!" : "Simular Clique no WhatsApp"}</span>
                    </button>
                  </div>

                  {waToast && (
                    <div className="lp-wa-demo__toast lp-view-fade">
                      <Check size={13} />
                      <span>Evento computado instantaneamente: +1 lead no painel e no webhook</span>
                    </div>
                  )}

                  <div className="lp-preview-json">
                    <div><b>// Payload despachado em tempo real:</b></div>
                    <div>&#123;</div>
                    <div>&nbsp;&nbsp;&quot;event&quot;: &quot;whatsapp_click&quot;,</div>
                    <div>&nbsp;&nbsp;&quot;leads_total&quot;: <b>{waLeads}</b>,</div>
                    <div>&nbsp;&nbsp;&quot;target&quot;: &quot;wa.me/5511987654321&quot;,</div>
                    <div>&nbsp;&nbsp;&quot;source&quot;: &quot;busca_organica&quot;,</div>
                    <div>&nbsp;&nbsp;&quot;latency&quot;: &quot;14ms&quot;</div>
                    <div>&#125;</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "realtime" && (
          <>
            <div className="lp-tools-screen__header">
              <div className="lp-tools-screen__title">
                <h4>Visitantes e Páginas no Exato Momento</h4>
                <p>Nenhum atraso de 48h. Acompanhe a repercussão imediata de posts e publicações.</p>
              </div>
              <button
                type="button"
                className="lp-sim-btn"
                onClick={handleSimulateVisitor}
              >
                <Zap size={12} />
                <span>+ Simular Novo Visitante</span>
              </button>
            </div>

            <div className="lp-tools-screen__content">
              <div className="lp-preview-box">
                <div className="lp-preview-realtime-stage">
                  <div className="lp-preview-radar-box">
                    <span className="lp-live-dot" />
                    <strong className={`lp-preview-radar-num ${rtBurst ? "lp-pulse-pop" : ""}`}>
                      {rtVisitors}
                    </strong>
                    <span className="lp-preview-radar-lbl">Visitantes Agora</span>
                  </div>

                  <div className="lp-preview-stream-list">
                    {rtList.map((item, idx) => (
                      <div key={idx} className="lp-preview-stream-item">
                        <span>
                          <span className="lp-live-dot" style={{ width: 5, height: 5 }} />
                          {item.path} ({item.source})
                        </span>
                        <strong>{item.visitors} ativos</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "heatmap" && (
          <>
            <div className="lp-tools-screen__header">
              <div className="lp-tools-screen__title">
                <h4>Mapa de Calor e Horários de Maior Conversão</h4>
                <p>Clique nas células para conferir a intensidade de visitantes e conversões.</p>
              </div>
              <span className="lp-split-latency">
                Dia analisado: <b>{selectedHeat.day}</b>
              </span>
            </div>

            <div className="lp-tools-screen__content">
              <div className="lp-preview-box">
                <div className="lp-preview-heat-grid">
                  {[
                    { day: "Seg", time: "Manhã", visits: 45, leads: 2, lvl: "lvl-2" },
                    { day: "Seg", time: "Tarde", visits: 78, leads: 5, lvl: "lvl-3" },
                    { day: "Seg", time: "Noite", visits: 32, leads: 1, lvl: "lvl-1" },
                    { day: "Ter", time: "Manhã", visits: 60, leads: 3, lvl: "lvl-2" },
                    { day: "Ter", time: "Tarde (Pico)", visits: 92, leads: 7, lvl: "lvl-4", highlight: "Pico Máximo da Semana" },
                    { day: "Ter", time: "Noite", visits: 55, leads: 4, lvl: "lvl-2" },
                    { day: "Qua", time: "Tarde", visits: 70, leads: 4, lvl: "lvl-3" },
                    { day: "Qui", time: "Tarde", visits: 85, leads: 6, lvl: "lvl-4", highlight: "Segundo Maior Pico" },
                    { day: "Sex", time: "Tarde", visits: 68, leads: 3, lvl: "lvl-3" },
                    { day: "Sáb", time: "Noite", visits: 40, leads: 2, lvl: "lvl-1" },
                    { day: "Dom", time: "Noite", visits: 52, leads: 3, lvl: "lvl-2" },
                    { day: "Seg", time: "Madrug.", visits: 12, leads: 0, lvl: "lvl-1" },
                    { day: "Ter", time: "Madrug.", visits: 14, leads: 0, lvl: "lvl-1" },
                    { day: "Qua", time: "Madrug.", visits: 9, leads: 0, lvl: "lvl-1" },
                  ].map((cell, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`lp-preview-heat-btn ${cell.lvl}`}
                      onClick={() =>
                        setSelectedHeat({
                          day: `${cell.day}-feira`,
                          time: cell.time,
                          visits: cell.visits,
                          leads: cell.leads,
                          highlight: cell.highlight || "Período monitorado",
                        })
                      }
                      title={`${cell.day} · ${cell.time}: ${cell.visits} visitas, ${cell.leads} leads`}
                    />
                  ))}
                </div>

                <div className="lp-heat-readout">
                  <div>
                    <strong>{selectedHeat.day} · {selectedHeat.time}</strong>
                    <p>{selectedHeat.visits} visitantes únicos · <span style={{ color: "#44e5a8" }}>{selectedHeat.leads} conversões no WhatsApp</span> ({selectedHeat.highlight})</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "whitelabel" && (
          <>
            <div className="lp-tools-screen__header">
              <div className="lp-tools-screen__title">
                <h4>Relatórios White-Label com a Sua Marca</h4>
                <p>Personalize cores, nome e logotipo da sua agência nos relatórios dos clientes.</p>
              </div>
              <button
                type="button"
                className="lp-preview-report-trigger"
                onClick={onOpenReportPreview}
              >
                <Eye size={12} />
                <span>Abrir Modelo de Relatório PDF</span>
              </button>
            </div>

            <div className="lp-tools-screen__content">
              <div className="lp-preview-box">
                <div className="lp-preview-agency-customizer">
                  <div className="lp-preview-custom-inputs">
                    <div>
                      <label htmlFor="agency-input">Nome da sua Agência / Empresa:</label>
                      <input
                        id="agency-input"
                        type="text"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="Digite o nome da agência"
                      />
                    </div>

                    <div>
                      <label>Cor de Destaque da Marca:</label>
                      <div className="lp-color-swatches">
                        {[
                          { color: "#3b82f6", label: "Azul" },
                          { color: "#8b5cf6", label: "Roxo" },
                          { color: "#10b981", label: "Esmeralda" },
                          { color: "#f59e0b", label: "Âmbar" },
                        ].map((swatch) => (
                          <button
                            key={swatch.color}
                            type="button"
                            className={`lp-color-swatch ${agencyTheme === swatch.color ? "is-active" : ""}`}
                            style={{ background: swatch.color }}
                            onClick={() => setAgencyTheme(swatch.color)}
                            title={swatch.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lp-preview-doc">
                    <div className="lp-preview-doc-head">
                      <div
                        className="lp-preview-doc-logo"
                        style={{ background: agencyTheme }}
                      >
                        {agencyName.charAt(0) || "A"}
                      </div>
                      <div className="lp-preview-doc-title">
                        <strong>{agencyName || "Sua Agência"}</strong>
                        <small>Relatório Executivo Mensal de Conversões</small>
                      </div>
                    </div>

                    <div style={{ margin: "14px 0 0", fontSize: "10px", color: "#94a3b8" }}>
                      <div>Cliente: <b>Alpha E-commerce</b></div>
                      <div>Conversões WhatsApp: <b style={{ color: "#44e5a8" }}>+24,1%</b></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "kuboai" && (
          <>
            <div className="lp-tools-screen__header">
              <div className="lp-tools-screen__title">
                <h4>Diagnósticos Semanais com Kubo AI</h4>
                <p>A inteligência artificial do Kubo sintetiza os pontos críticos sem inventar métricas.</p>
              </div>
              <span className="lp-product__badge">
                <Sparkles size={11} /> 99.2% de precisão analítica
              </span>
            </div>

            <div className="lp-tools-screen__content">
              <div className="lp-preview-box">
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`lp-split-mode-btn ${aiFocus === "growth" ? "is-active" : ""}`}
                    onClick={() => setAiFocus("growth")}
                  >
                    <span>📈 Oportunidade</span>
                  </button>
                  <button
                    type="button"
                    className={`lp-split-mode-btn is-ga4 ${aiFocus === "warning" ? "is-active" : ""}`}
                    onClick={() => setAiFocus("warning")}
                  >
                    <span>⚠️ Ponto de Atenção</span>
                  </button>
                  <button
                    type="button"
                    className={`lp-split-mode-btn is-kubo ${aiFocus === "conv" ? "is-active" : ""}`}
                    onClick={() => setAiFocus("conv")}
                  >
                    <span>💬 WhatsApp Lidera</span>
                  </button>
                </div>

                <div className="lp-ai-highlight" style={{ marginTop: 0 }}>
                  <div className="lp-ai-highlight__head">
                    <Sparkles size={13} />
                    <span>
                      {aiFocus === "growth" && "Oportunidade: Tráfego Orgânico em Alta (+18%)"}
                      {aiFocus === "warning" && "Atenção: Queda de Conversão na Página de Preços"}
                      {aiFocus === "conv" && "Destaque: WhatsApp concentra 78% dos Leads Finais"}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", lineHeight: "1.6" }}>
                    {aiFocus === "growth" &&
                      "A participação da busca orgânica saltou para 42% no período. Recomendação: replique a estrutura da página /servicos nos artigos de topo de funil para acelerar novas conversões."}
                    {aiFocus === "warning" &&
                      "Identificamos que 62% dos visitantes que entram em /precos saem sem clicar em nenhum botão. Sugestão: adicione uma chamada direta para WhatsApp nesta seção."}
                    {aiFocus === "conv" &&
                      "O botão flutuante de WhatsApp converteu 486 leads qualificados. O melhor horário registrado foi nas tardes de terça e quinta-feira (14h-18h)."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "privacy" && (
          <>
            <div className="lp-tools-screen__header">
              <div className="lp-tools-screen__title">
                <h4>Zero Cookies Invasivos e 100% LGPD</h4>
                <p>Sem banners intrusivos que espantam clientes e sem penalização de SEO.</p>
              </div>
              <button
                type="button"
                className="lp-sim-btn"
                onClick={handleTestLatency}
              >
                <Clock3 size={12} />
                <span>{benchRunning ? "Medindo..." : "Testar Tempo Local"}</span>
              </button>
            </div>

            <div className="lp-tools-screen__content">
              <div className="lp-preview-box">
                <div className="lp-split-kpis" style={{ margin: 0 }}>
                  <div className="lp-split-kpi-card is-good">
                    <small>Peso do Script</small>
                    <strong>2.1 KB</strong>
                    <span>vs ~120KB do Google Tag Manager</span>
                  </div>
                  <div className="lp-split-kpi-card is-good">
                    <small>Tempo de Resposta</small>
                    <strong>{localLatency} ms</strong>
                    <span>Processamento Anycast em borda</span>
                  </div>
                  <div className="lp-split-kpi-card is-good">
                    <small>Google PageSpeed</small>
                    <strong>100 / 100</strong>
                    <span>Zero impacto em Core Web Vitals</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CapabilitiesSection() {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const capabilities = [
    { icon: MousePointerClick, className: "lp-capability--wide lp-spotlight-card", title: "Motor de Conversão de WhatsApp", copy: "Detecte automaticamente cada clique em links de WhatsApp, telefones e formulários no seu site, sem mexer no código do botão.", visual: <WhatsAppDemo /> },
    { icon: Flame, className: "lp-capability--heat lp-spotlight-card", title: "Mapas de Calor 24x7", copy: "Visualize padrões de atividade por dia e horário para saber exatamente quando seu público navega e decide.", visual: <HeatCells /> },
    { icon: BellRing, className: "lp-spotlight-card", title: "Alertas Inteligentes", copy: "Quedas, picos e mudanças anômalas de tráfego aparecem no painel e, no Pro, também diretamente por e-mail.", visual: <div className="lp-alert-demo"><i /><span>Tráfego acima da média</span><b>+31%</b></div> },
    { icon: Target, className: "lp-spotlight-card", title: "Metas e Funis", copy: "Acompanhe a taxa de conversão do primeiro acesso até o clique decisivo em cada página de destino.", visual: <Funnel /> },
    { icon: FileDown, className: "lp-capability--wide lp-spotlight-card", title: "Relatórios Executivos em 1 Clique", copy: "Exporte apresentações e relatórios em PDF corporativo e planilhas Excel XLSX nativas para enviar a clientes.", visual: <ExportPills onOpenPreview={() => setReportModalOpen(true)} /> },
    { icon: Layers3, className: "lp-spotlight-card", title: "Multi-tenant & White-label", copy: "Crie organizações separadas para cada cliente da sua agência com relatórios personalizados sob sua marca.", visual: <OrgLayers /> },
  ];

  return (
    <section id="capabilities" className="lp-capabilities">
      <div className="lp-shell">
        <div className="lp-section-head lp-reveal">
          <span>Recursos desenhados para resultados</span>
          <h2>Profundidade quando precisa.<br />Simplicidade sempre.</h2>
          <p>Tudo o que sua agência ou empresa precisa para acompanhar performance web sem o excesso do GA4.</p>
        </div>

        {/* Flape-inspired Interactive Feature Selector Playground */}
        <InteractiveFeaturesShowcase onOpenReportPreview={() => setReportModalOpen(true)} />

        <div className="lp-capability-grid">
          {capabilities.map(({ icon: Icon, className, title, copy, visual }) => (
            <article className={`lp-capability lp-reveal ${className}`} key={title}>
              <div className="lp-capability__icon"><Icon /></div>
              <h3>{title}</h3><p>{copy}</p>{visual}
            </article>
          ))}
        </div>
      </div>
      <ReportPreviewModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </section>
  );
}

function WhatsAppDemo() {
  const [leadsCount, setLeadsCount] = useState(486);
  const [clicked, setClicked] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleClickSimulation = () => {
    setClicked(true);
    setLeadsCount((prev) => prev + 1);
    setShowToast(true);
    setTimeout(() => setClicked(false), 400);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div className="lp-wa-demo">
      <div className="lp-wa-demo__top">
        <div className="lp-wa-demo__pill">
          <span className="lp-live-dot" />
          <small>Captura nativa em 14ms</small>
        </div>
        <div className="lp-wa-demo__count">
          <span>Total de Leads:</span>
          <strong>{leadsCount}</strong>
        </div>
      </div>

      <div className="lp-wa-demo__card">
        <div className="lp-wa-demo__left">
          <strong>+55 (11) 98765-4321</strong>
          <span>Origem: Google Orgânico · /servicos</span>
        </div>
        <button
          type="button"
          onClick={handleClickSimulation}
          className={`lp-wa-demo__btn ${clicked ? "is-clicked" : ""}`}
        >
          <MousePointerClick size={12} />
          <span>{clicked ? "Capturado!" : "Testar clique agora"}</span>
        </button>
      </div>

      {showToast && (
        <div className="lp-wa-demo__toast lp-view-fade">
          <Check size={13} />
          <span>Evento registrado automaticamente sem Google Tag Manager</span>
        </div>
      )}
    </div>
  );
}

function HeatCells() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const slots = ["Manhã", "Tarde", "Noite", "Madrug."];
  const [activeSlot, setActiveSlot] = useState<{ day: string; slot: string; stat: string } | null>({
    day: "Terça-feira",
    slot: "Tarde (14h-18h)",
    stat: "Pico semanal de conversão (92 visitas · 7 leads)",
  });

  return (
    <div className="lp-heat-interactive">
      <div className="lp-heat-grid">
        {days.map((day, dIdx) => (
          <div key={day} className="lp-heat-col">
            <span className="lp-heat-day">{day}</span>
            {slots.map((slot, sIdx) => {
              const isPrime = (dIdx === 1 || dIdx === 3) && sIdx === 1;
              const opacity = isPrime ? 1 : 0.2 + ((dIdx * 3 + sIdx * 5) % 8) * 0.09;
              return (
                <button
                  key={slot}
                  type="button"
                  className={`lp-heat-cell-btn ${isPrime ? "is-prime" : ""}`}
                  style={{ opacity }}
                  onMouseEnter={() =>
                    setActiveSlot({
                      day: `${day}-feira`,
                      slot,
                      stat: isPrime
                        ? "Pico semanal de conversão (92 visitas · 7 leads)"
                        : "Atividade regular (24 a 45 visitas · 1 lead)",
                    })
                  }
                  onClick={() =>
                    setActiveSlot({
                      day: `${day}-feira`,
                      slot,
                      stat: isPrime
                        ? "Pico semanal de conversão (92 visitas · 7 leads)"
                        : "Atividade regular (24 a 45 visitas · 1 lead)",
                    })
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="lp-heat-readout">
        {activeSlot ? (
          <div>
            <strong>{activeSlot.day} · {activeSlot.slot}</strong>
            <p>{activeSlot.stat}</p>
          </div>
        ) : (
          <p>Toque ou passe o mouse nos horários</p>
        )}
      </div>
    </div>
  );
}

function Funnel() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const stages = [
    { label: "Visitantes", value: "12.842", rate: "100%", width: "100%" },
    { label: "Engajados", value: "4.120", rate: "32,1%", width: "72%" },
    { label: "Leads WhatsApp", value: "486", rate: "3,78%", width: "46%" },
  ];

  return (
    <div className="lp-funnel">
      {stages.map((st, i) => (
        <button
          key={st.label}
          type="button"
          className={`lp-funnel__stage ${activeStage === i ? "is-active" : ""}`}
          style={{ width: st.width }}
          onClick={() => setActiveStage(i)}
        >
          <span>{st.value} <small>{st.label}</small></span>
          <strong>{st.rate}</strong>
        </button>
      ))}
    </div>
  );
}

function ExportPills({ onOpenPreview }: { onOpenPreview?: () => void }) {
  return (
    <div className="lp-export-pills">
      <span>PDF Executivo</span>
      <span>Excel Nativo (XLSX)</span>
      <span>CSV Completo</span>
      {onOpenPreview && (
        <button
          type="button"
          className="lp-preview-report-trigger"
          onClick={onOpenPreview}
          title="Ver prévia interativa do relatório"
        >
          <FileDown size={11} />
          <span>Ver modelo de PDF</span>
        </button>
      )}
    </div>
  );
}

export function ReportPreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="lp-modal-backdrop lp-view-fade" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lp-report-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lp-report-sheet__header">
          <div className="lp-report-brand">
            <span className="lp-report-logo-ph" />
            <div>
              <strong>AGÊNCIA VANGUARDA GROWTH</strong>
              <small>Relatório Executivo de Performance · White-Label</small>
            </div>
          </div>
          <button type="button" className="lp-report-close" onClick={onClose} aria-label="Fechar prévia">
            <X size={16} />
          </button>
        </div>

        <div className="lp-report-sheet__meta">
          <div><span>Cliente:</span> <strong>Loja Alpha Commerce</strong></div>
          <div><span>Período:</span> <strong>01 a 31 de Outubro</strong></div>
          <div><span>Status:</span> <strong className="is-green">● Consolidado</strong></div>
        </div>

        <div className="lp-report-ai-summary">
          <div className="lp-report-ai-title">
            <Sparkles size={13} />
            <span>Diagnóstico Executivo Inteligente (Kubo AI)</span>
          </div>
          <p>
            O tráfego total cresceu <strong>+18,4%</strong> em relação ao mês anterior, impulsionado por um salto de 24% nas buscas orgânicas da página de serviços. A taxa de conversão direta em leads de WhatsApp atingiu <strong>3,78%</strong> (pico registrado nas tardes de terça e quinta-feira).
          </p>
        </div>

        <div className="lp-report-kpis">
          <div className="lp-report-kpi">
            <small>Visitantes Únicos</small>
            <strong>12.842</strong>
            <em>+18,4% vs mês ant.</em>
          </div>
          <div className="lp-report-kpi">
            <small>Leads WhatsApp</small>
            <strong className="is-green">486</strong>
            <em>+24,1% vs mês ant.</em>
          </div>
          <div className="lp-report-kpi">
            <small>Taxa de Conversão</small>
            <strong>3,78%</strong>
            <em>+0,6% vs mês ant.</em>
          </div>
          <div className="lp-report-kpi">
            <small>Páginas / Sessão</small>
            <strong>2,43</strong>
            <em>Engajamento saudável</em>
          </div>
        </div>

        <div className="lp-report-table-wrap">
          <span className="lp-report-table-title">Top Canais com Conversão em WhatsApp</span>
          <table className="lp-report-table">
            <thead>
              <tr>
                <th>Origem</th>
                <th>Visitantes</th>
                <th>Conversões WhatsApp</th>
                <th>Taxa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Orgânico</td>
                <td>5.420</td>
                <td>218</td>
                <td><strong>4,02%</strong></td>
              </tr>
              <tr>
                <td>Direto</td>
                <td>3.610</td>
                <td>142</td>
                <td><strong>3,93%</strong></td>
              </tr>
              <tr>
                <td>Instagram / Redes</td>
                <td>2.840</td>
                <td>98</td>
                <td><strong>3,45%</strong></td>
              </tr>
              <tr>
                <td>E-mail / Outros</td>
                <td>972</td>
                <td>28</td>
                <td><strong>2,88%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lp-report-sheet__footer">
          <span>Relatório gerado em 1 clique pelo Kubo Analytics · 100% White-Label</span>
          <button type="button" className="lp-button lp-button--compact" onClick={onClose}>
            Fechar modelo
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompatibilitySection() {
  const platforms = [
    { name: "WordPress", type: "CMS & Blogs", tag: "Plugin / Código" },
    { name: "Shopify", type: "E-commerce Global", tag: "Tema / Pixel" },
    { name: "Nuvemshop", type: "Líder Brasil", tag: "Configurações" },
    { name: "WooCommerce", type: "E-commerce WP", tag: "Nativo" },
    { name: "Hotmart", type: "Infoprodutos & Vendas", tag: "Checkout" },
    { name: "Kiwify", type: "Checkout de Conversão", tag: "Checkout" },
    { name: "Webflow", type: "Design & Landing Pages", tag: "Header Code" },
    { name: "Framer", type: "Sites Rápidos", tag: "Custom Code" },
    { name: "Wix", type: "Construtor Visual", tag: "Header Script" },
    { name: "Next.js / React", type: "Aplicações Modernas", tag: "Script Tag" },
    { name: "Yampi", type: "Checkout Transparente", tag: "Scripts" },
    { name: "HTML / Qualquer Site", type: "Instalação Universal", tag: "1 Linha" },
  ];

  return (
    <section className="lp-compat" aria-label="Plataformas e compatibilidade">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>Ecossistema universal</span>
          <h2>Funciona com 100% da sua stack.<br />Sem exceções.</h2>
          <p>Instale em qualquer construtor de páginas, e-commerce, plataforma de infoprodutos ou código customizado com uma única linha.</p>
        </div>

        <div className="lp-compat__grid lp-reveal">
          {platforms.map((p) => (
            <div key={p.name} className="lp-compat__card lp-spotlight-card">
              <div className="lp-compat__top">
                <span className="lp-compat__dot" />
                <span className="lp-compat__tag">{p.tag}</span>
              </div>
              <strong>{p.name}</strong>
              <small>{p.type}</small>
            </div>
          ))}
        </div>

        <div className="lp-compat__note lp-reveal">
          <span>⚡ <b>Compatibilidade Instantânea:</b> Basta colar o snippet de 2KB antes de <code>&lt;/head&gt;</code> e os eventos começam a ser coletados.</span>
        </div>
      </div>
    </section>
  );
}

export function FloatingWhatsAppTester() {
  const [toast, setToast] = useState(false);

  const triggerTest = () => {
    setToast(true);
    setTimeout(() => setToast(false), 4500);
  };

  return (
    <>
      <div className="lp-floating-widget" role="complementary" aria-label="Simulador de Rastreamento">
        <button
          type="button"
          onClick={triggerTest}
          className="lp-floating-tester"
          title="Clique para testar a detecção em tempo real do Kubo"
        >
          <span className="lp-live-dot" />
          <MessageSquare size={13} />
          <span>Testar Rastreamento</span>
        </button>
      </div>

      {toast && (
        <div className="lp-floating-toast lp-view-fade" role="status" aria-live="polite">
          <div className="lp-floating-toast__head">
            <span className="lp-live-dot" />
            <strong>⚡ Conversão detectada em 14ms!</strong>
            <button type="button" onClick={() => setToast(false)} aria-label="Fechar notificação">
              <X size={12} />
            </button>
          </div>
          <p>Evento: <b>Clique no WhatsApp</b> · Origem: <b>Landing Page</b> · Zero GTM</p>
        </div>
      )}
    </>
  );
}

function OrgLayers() { return <div className="lp-org-layers"><span>Agência Digital Alpha</span><span>Cliente E-commerce Beta</span><i><ShieldCheck /> Isolamento RLS por organização</i></div>; }

export function ComparisonSection() {
  const rows = [
    { feature: "Tempo de Instalação", ga4: "Horas ou dias com GTM e dataLayer", kubo: "2 minutos (1 linha de código)", highlight: true },
    { feature: "Latência dos Dados", ga4: "24h a 48h de espera", kubo: "Tempo real instantâneo", highlight: true },
    { feature: "Cliques no WhatsApp", ga4: "Exige triggers e tags manuais", kubo: "Detectado automaticamente", highlight: true },
    { feature: "Relatórios Executivos", ga4: "Requer montar no Looker Studio", kubo: "1 clique em PDF e Excel", highlight: true },
    { feature: "Peso do Script", ga4: "~45KB a 120KB (gtag.js)", kubo: "~2KB ultraleve", highlight: false },
    { feature: "Impacto no PageSpeed", ga4: "Penaliza Core Web Vitals", kubo: "Nota 100 garantida", highlight: false },
    { feature: "Resumos com IA", ga4: "Inexistentes no painel", kubo: "Diagnóstico semanal automático", highlight: true },
    { feature: "Conformidade LGPD", ga4: "Exige banner de cookies invasivo", kubo: "Sem cookies de terceiros", highlight: false },
  ];

  return (
    <section id="comparative" className="lp-comparison">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>Comparativo direto</span>
          <h2>Por que agências e empresas<br />estão migrando para o Kubo.</h2>
          <p>Uma comparação clara entre a complexidade do passado e a velocidade do presente.</p>
        </div>

        <div className="lp-comparison__table-wrap lp-reveal">
          <table className="lp-comparison__table" aria-label="Tabela comparativa entre Google Analytics e Kubo">
            <thead>
              <tr>
                <th>Recurso / Diferencial</th>
                <th>Google Analytics (GA4)</th>
                <th className="is-kubo">
                  <span>Kubo Analytics</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={row.highlight ? "is-highlighted" : ""}>
                  <td className="lp-comparison__feature">
                    <strong>{row.feature}</strong>
                  </td>
                  <td className="lp-comparison__ga4">
                    <span className="lp-cross"><X size={13} /></span>
                    {row.ga4}
                  </td>
                  <td className="lp-comparison__kubo">
                    <span className="lp-check"><Check size={13} /></span>
                    <strong>{row.kubo}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function SecurityInfrastructureSection() {
  const items = [
    {
      icon: ShieldCheck,
      title: "100% LGPD Nativa por Princípio",
      desc: "Sem cookies invasivos de terceiros, sem fingerprinting de dispositivos e sem compartilhamento cruzado. Suas páginas não precisam de banners intrusivos que espantam clientes.",
      tag: "Privacidade Garantida",
    },
    {
      icon: Lock,
      title: "Isolamento Criptográfico Multi-Tenant",
      desc: "Arquitetura com Row Level Security (RLS) no banco de dados e criptografia de dados em trânsito e em repouso. Organizações e clientes possuem isolamento estrito.",
      tag: "Segurança de Dados",
    },
    {
      icon: Server,
      title: "Processamento Anycast em Borda (Edge)",
      desc: "Coleta distribuída com roteamento Anycast de baixíssima latência (menos de 20ms no Brasil). O carregamento do seu site nunca é afetado pelo rastreamento.",
      tag: "Baixa Latência",
    },
    {
      icon: Cpu,
      title: "99.98% de SLA com Alta Elasticidade",
      desc: "Infraestrutura serverless auto-escalável projetada para absorver picos repentinos de tráfego de grandes campanhas e e-commerces sem perda de eventos.",
      tag: "Alta Disponibilidade",
    },
  ];

  return (
    <section className="lp-security" aria-label="Segurança e infraestrutura">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>Infraestrutura e conformidade</span>
          <h2>Desenvolvido para empresas<br />que levam privacidade a sério.</h2>
          <p>Confiabilidade de nível empresarial sem a burocracia dos gigantes legados.</p>
        </div>

        <div className="lp-security__grid lp-reveal">
          {items.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="lp-security__card">
              <div className="lp-security__top">
                <div className="lp-security__icon"><Icon size={20} /></div>
                <span className="lp-security__tag">{tag}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Substituímos o GA4 nas contas dos nossos clientes. Nossos relatórios semanais de WhatsApp agora são entregues em PDF em 1 clique e os clientes finalmente entendem o retorno real.",
      author: "Rodrigo Mendes",
      role: "Diretor de Operações",
      company: "Vanguarda Growth",
      metric: "+32% de conversões rastreadas",
    },
    {
      quote: "O script de 2KB foi decisivo. Nossas páginas subiram de 71 para 99 no Google PageSpeed instantaneamente, sem abrir mão de métricas de visitantes em tempo real.",
      author: "Camila Duarte",
      role: "Head de Performance & CRO",
      company: "Studio Pulse",
      metric: "PageSpeed 100 mantido",
    },
  ];

  return (
    <section className="lp-testimonials" aria-label="Depoimentos de agências parceiras">
      <div className="lp-shell">
        <div className="lp-testimonials__grid lp-reveal">
          {testimonials.map((t) => (
            <div key={t.author} className="lp-testimonial-card">
              <span className="lp-testimonial-card__metric">{t.metric}</span>
              <p className="lp-testimonial-card__quote">“{t.quote}”</p>
              <div className="lp-testimonial-card__author">
                <div className="lp-testimonial-card__avatar">{t.author.charAt(0)}</div>
                <div>
                  <strong>{t.author}</strong>
                  <small>{t.role} · {t.company}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InteractiveSnippet() {
  const [tab, setTab] = useState<"html" | "wordpress" | "nextjs" | "gtm">("html");
  const [copied, setCopied] = useState(false);

  const snippets = {
    html: `<script defer src="https://kuboweb.com.br/k.js" data-site="kw_live_839f2"></script>`,
    wordpress: `<!-- Cole no functions.php ou no campo de Cabeçalho do seu tema -->\n<script defer src="https://kuboweb.com.br/k.js" data-site="kw_live_839f2"></script>`,
    nextjs: `// No arquivo app/layout.tsx ou pages/_app.tsx:\nimport Script from "next/script";\n\n<Script\n  src="https://kuboweb.com.br/k.js"\n  data-site="kw_live_839f2"\n  strategy="afterInteractive"\n/>`,
    gtm: `<!-- Tag HTML Personalizado no Tag Manager (Acionador: All Pages) -->\n<script defer src="https://kuboweb.com.br/k.js" data-site="kw_live_839f2"></script>`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="lp-terminal lp-reveal">
      <div className="lp-terminal__header">
        <div className="lp-terminal__controls">
          <span className="lp-terminal__dot is-red" />
          <span className="lp-terminal__dot is-yellow" />
          <span className="lp-terminal__dot is-green" />
        </div>

        <div className="lp-terminal__tabs">
          <button
            type="button"
            className={tab === "html" ? "is-active" : ""}
            onClick={() => setTab("html")}
          >
            HTML Nativo
          </button>
          <button
            type="button"
            className={tab === "wordpress" ? "is-active" : ""}
            onClick={() => setTab("wordpress")}
          >
            WordPress
          </button>
          <button
            type="button"
            className={tab === "nextjs" ? "is-active" : ""}
            onClick={() => setTab("nextjs")}
          >
            Next.js / React
          </button>
          <button
            type="button"
            className={tab === "gtm" ? "is-active" : ""}
            onClick={() => setTab("gtm")}
          >
            Tag Manager
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`lp-terminal__copy-btn ${copied ? "is-copied" : ""}`}
          aria-label="Copiar código de instalação"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copiar snippet</span>
            </>
          )}
        </button>
      </div>

      <div className="lp-terminal__body">
        <pre className="lp-terminal__code">
          <code>{snippets[tab]}</code>
        </pre>
      </div>

      <div className="lp-terminal__footer">
        <span className="lp-terminal__badge">
          <span className="lp-live-dot" /> Snippet ativo e assíncrono
        </span>
        <div className="lp-terminal__meta">
          <span>Peso: <b>2.1 KB</b></span>
          <span>Latência: <b>&lt; 15ms</b></span>
          <span>Cookies: <b>Zero</b></span>
          <span>PageSpeed: <b>100 / 100</b></span>
        </div>
      </div>
    </div>
  );
}

export function RoiCalculatorSection() {
  const [pageviews, setPageviews] = useState(60000);

  const hoursSaved = Math.min(36, Math.max(8, Math.round(6 + (pageviews / 20000) * 1.8)));
  const extraLeads = Math.round(pageviews * 0.00092);
  const dataSavedKb = Math.round((pageviews * 118) / 1024);

  return (
    <section className="lp-roi" aria-label="Calculadora de retorno e eficiência">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>Eficiência operacional</span>
          <h2>Simule o ganho de tempo<br />e precisão na sua empresa.</h2>
          <p>Veja o impacto direto de abandonar a lentidão de relatórios manuais e começar a medir conversões reais.</p>
        </div>

        <div className="lp-roi__card lp-reveal">
          <div className="lp-roi__slider-wrap">
            <div className="lp-roi__slider-head">
              <label htmlFor="roi-slider">Volume mensal estimado de acessos:</label>
              <strong>{pageviews.toLocaleString("pt-BR")} visualizações/mês</strong>
            </div>
            <input
              id="roi-slider"
              type="range"
              min="10000"
              max="500000"
              step="10000"
              value={pageviews}
              onChange={(e) => setPageviews(Number(e.target.value))}
              className="lp-roi__range"
              aria-label="Volume mensal de acessos para estimativa"
            />
            <div className="lp-roi__slider-ticks">
              <span>10k</span>
              <span>100k</span>
              <span>250k</span>
              <span>500k</span>
            </div>
          </div>

          <div className="lp-roi__results">
            <div className="lp-roi__result-item">
              <div className="lp-roi__icon"><Clock3 size={18} /></div>
              <strong>~{hoursSaved} horas/mês</strong>
              <span>Economizadas em extração de relatórios e dashboards manuais</span>
            </div>

            <div className="lp-roi__result-item">
              <div className="lp-roi__icon is-green"><MousePointerClick size={18} /></div>
              <strong>+{extraLeads} leads WhatsApp</strong>
              <span>Detectados automaticamente sem quebras de acionamento do Tag Manager</span>
            </div>

            <div className="lp-roi__result-item">
              <div className="lp-roi__icon is-blue"><Gauge size={18} /></div>
              <strong>-98% de peso analítico</strong>
              <span>{dataSavedKb.toLocaleString("pt-BR")} MB a menos trafegados no navegador</span>
            </div>

            <div className="lp-roi__result-item">
              <div className="lp-roi__icon is-purple"><Zap size={18} /></div>
              <strong>Nota 100 PageSpeed</strong>
              <span>Core Web Vitals preservados sem penalização nos mecanismos de busca</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SetupSection() {
  const steps = [
    ["01", "Crie sua conta", "Comece pelo plano gratuito e configure sua organização em segundos.", "Ativação Rápida"],
    ["02", "Adicione o seu site", "Cadastre o domínio do seu projeto e copie o snippet de código.", "1 Domínio"],
    ["03", "Instale uma única vez", "Cole o script no cabeçalho do site (WordPress, Webflow, etc.).", "Apenas 2 KB"],
    ["04", "Acompanhe os dados", "Visitantes e conversões começam a aparecer instantaneamente.", "Tempo Real"],
  ];
  return (
    <section className="lp-setup">
      <div className="lp-shell">
        <div className="lp-section-head lp-reveal">
          <span>Comece sem complexidade</span>
          <h2>Do zero aos primeiros sinais<br />em quatro passos.</h2>
          <p>Instale em minutos e tenha total clareza do tráfego sem depender de configurações complexas.</p>
        </div>

        {/* Flape-inspired Sticky Stacking Deck */}
        <div className="lp-deck-wrap">
          {steps.map(([number, title, copy, badge], index) => (
            <article
              className="lp-deck-card lp-reveal"
              key={number}
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="lp-deck-card__top">
                <span className="lp-deck-card__num">Etapa {number}</span>
                <span className="lp-deck-card__badge">{badge}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <InteractiveSnippet />
      </div>
    </section>
  );
}

const freeFeatures = [
  "1 projeto com domínio próprio",
  "Histórico de 7 dias de navegação",
  "Métricas essenciais de páginas e fontes",
  "Rastreamento automático de cliques",
  "Alertas básicos de atividade",
  "Script ultraleve de 2KB (PageSpeed 100)",
  "Totalmente compatível com a LGPD",
];

const fallbackPro = {
  name: "Pro",
  tagline: "Para empresas e agências que precisam de precisão e conversão em tempo real.",
  price: "R$ 49,90",
  cadence: "/mês",
  highlight: "7 dias grátis — cancele a qualquer momento",
  cta: "Começar 7 dias grátis",
  features: [
    "Projetos e sites ilimitados",
    "Visitantes e eventos em tempo real (Kubo Live)",
    "Rastreamento nativo de cliques de WhatsApp",
    "Mapas de calor 24x7 por dia e horário",
    "Relatórios executivos em PDF e Excel XLSX",
    "Diagnóstico inteligente semanal com IA",
    "Histórico estendido de 12 meses (365 dias)",
    "Ambientes multi-tenant para agências e clientes",
    "Suporte prioritário direto da equipe técnica",
  ],
};

export function PremiumPricing() {
  const { plans, loading, error } = usePlans();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const isAnnual = billingPeriod === "annual";

  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>Planos transparentes</span>
          <h2>Comece grátis.<br />Evolua quando fizer sentido.</h2>
          <p>Sem surpresas ou contratos de fidelidade. Teste o plano Pro completo por 7 dias grátis.</p>

          <div className="lp-pricing__toggle-wrap">
            <div className="lp-pricing__toggle" role="group" aria-label="Ciclo de faturamento">
              <button
                type="button"
                className={billingPeriod === "monthly" ? "is-active" : ""}
                onClick={() => setBillingPeriod("monthly")}
              >
                Mensal
              </button>
              <button
                type="button"
                className={billingPeriod === "annual" ? "is-active" : ""}
                onClick={() => setBillingPeriod("annual")}
              >
                Anual <span className="lp-pricing__discount-pill">-20% OFF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lp-pricing__grid lp-reveal">
          <PricingCard
            name="Gratuito"
            tierLabel="Iniciante"
            tagline="Para validar o Kubo no seu site sem custos."
            price="R$ 0,00"
            cadence="/mês"
            billingSubtext="Sem cartão de crédito necessário"
            featuresLabel="O que está incluso:"
            features={freeFeatures}
            cta="Criar conta grátis"
          />

          {loading && (
            <div className="lp-price-card lp-price-card--loading is-recommended" aria-label="Carregando plano Pro">
              <i /><i /><i /><i />
            </div>
          )}

          {!loading && plans.map((plan) => {
            const isPro = plan.name.toLowerCase().includes("pro") || plan.name === "Pro";
            const displayPrice = isPro && isAnnual ? "R$ 39,90" : plan.price;
            const subtext = isPro && isAnnual
              ? "Faturado R$ 478,80/ano · Economia de R$ 120/ano"
              : "7 dias grátis — cancele a qualquer momento";

            return (
              <PricingCard
                key={plan.id}
                name={plan.name}
                tierLabel="Completo"
                badgeText="★ MAIS ESCOLHIDO POR AGÊNCIAS"
                tagline={plan.tagline || fallbackPro.tagline}
                price={displayPrice}
                cadence={plan.cadence}
                billingSubtext={subtext}
                featuresLabel="Tudo do Gratuito, mais:"
                highlight={plan.highlight || fallbackPro.highlight}
                features={plan.features && plan.features.length >= 7 ? plan.features : fallbackPro.features}
                cta={plan.cta || "Começar 7 dias grátis"}
                recommended={true}
                disabled={!plan.enabled}
              />
            );
          })}

          {!loading && (error || plans.length === 0) && (
            <PricingCard
              {...fallbackPro}
              price={isAnnual ? "R$ 39,90" : fallbackPro.price}
              billingSubtext={isAnnual ? "Faturado R$ 478,80/ano · Economia de R$ 120/ano" : "7 dias grátis — cancele a qualquer momento"}
              tierLabel="Completo"
              badgeText="★ MAIS ESCOLHIDO POR AGÊNCIAS"
              featuresLabel="Tudo do Gratuito, mais:"
              recommended
            />
          )}
        </div>

        <div className="lp-pricing__guarantees lp-reveal">
          <div className="lp-guarantee-item">
            <Check size={14} />
            <span>Ativação imediata em menos de 2 minutos</span>
          </div>
          <div className="lp-guarantee-item">
            <Check size={14} />
            <span>Sem cobrança durante o período de 7 dias</span>
          </div>
          <div className="lp-guarantee-item">
            <Check size={14} />
            <span>Cancelamento direto no painel com 1 clique</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  tierLabel,
  badgeText,
  tagline,
  price,
  cadence,
  billingSubtext,
  featuresLabel,
  features,
  cta,
  recommended,
  disabled,
}: {
  name: string;
  tierLabel?: string;
  badgeText?: string;
  tagline: string;
  price: string;
  cadence: string;
  billingSubtext?: string;
  featuresLabel?: string;
  features: string[];
  cta: string;
  highlight?: string;
  recommended?: boolean;
  disabled?: boolean;
}) {
  return (
    <article className={`lp-price-card ${recommended ? "is-recommended" : ""}`}>
      {recommended && badgeText && (
        <div className="lp-price-badge">
          <Sparkles size={11} />
          <span>{badgeText}</span>
        </div>
      )}

      <div className="lp-price-card__header">
        <span className={`lp-price-tier ${recommended ? "is-pro" : ""}`}>{tierLabel || (recommended ? "Completo" : "Iniciante")}</span>
        <h3 className="lp-price-card__title">{name}</h3>
        <p className="lp-price-card__tagline">{tagline}</p>
      </div>

      <div className="lp-price">
        <div className="lp-price__main">
          <strong className="lp-price__amount">{price}</strong>
          <small className="lp-price__cadence">{cadence}</small>
        </div>
        {billingSubtext && <div className="lp-price__sub">{billingSubtext}</div>}
      </div>

      <div className="lp-price-card__features-wrap">
        {featuresLabel && <span className="lp-price-card__features-title">{featuresLabel}</span>}
        <ul className="lp-price-card__list">
          {features.map((feature) => (
            <li key={feature}>
              <span className={`lp-check-badge ${recommended ? "is-pro" : ""}`}>
                <Check size={11} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="lp-price-card__action">
        {disabled ? (
          <span className="lp-price-btn is-disabled" aria-disabled="true">
            Indisponível <ArrowRight size={13} />
          </span>
        ) : recommended ? (
          <Link
            to="/login"
            className="lp-feixe-btn lp-feixe-btn--pro"
            style={{ width: "100%" }}
            aria-label={cta}
          >
            <span className="lp-feixe-border" aria-hidden="true" />
            <span className="lp-feixe-inner" style={{ width: "100%" }}>
              {cta} <ArrowRight size={13} />
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="lp-price-btn lp-price-btn--ghost"
            aria-label={cta}
          >
            {cta} <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </article>
  );
}

const faq = [
  ["Preciso trocar o analytics que já uso?", "Não. O Kubo pode ser instalado como uma camada de leitura própria do seu site, sem exigir que você remova outras ferramentas."],
  ["O que o Kubo acompanha?", "Visitantes, visualizações, sessões, páginas, fontes de tráfego, dispositivos, localização aproximada e eventos configurados, como cliques em WhatsApp, formulários e botões."],
  ["O Kubo respeita consentimento e LGPD?", "Sim. No modo de consentimento obrigatório, o rastreador não cria identificadores nem envia requisições antes da autorização do visitante."],
  ["Posso acompanhar mais de um site?", "Sim. O plano gratuito inclui um projeto; o plano Pro permite projetos ilimitados e mantém os dados separados por organização."],
  ["Há acompanhamento em tempo real?", "Sim. O Kubo Live mostra visitantes ativos, páginas, origens e eventos recentes. Esse recurso faz parte do plano Pro."],
  ["Consigo exportar os dados?", "No Pro, você pode gerar relatórios e exportar dados em PDF, CSV e Excel, além de usar o modo apresentação."],
];

export function LandingFAQ() {
  return (
    <section id="faq" className="lp-faq">
      <div className="lp-shell lp-faq__grid">
        <div className="lp-faq__title lp-reveal"><span>Dúvidas frequentes</span><h2>Antes de instalar,<br />vale saber.</h2><p>Respostas diretas sobre o que o Kubo faz hoje.</p></div>
        <Accordion type="single" collapsible className="lp-faq__accordion lp-reveal">
          {faq.map(([question, answer], index) => <AccordionItem value={`faq-${index}`} key={question}><AccordionTrigger>{question}</AccordionTrigger><AccordionContent>{answer}</AccordionContent></AccordionItem>)}
        </Accordion>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="lp-final">
      <div className="lp-final__grid" aria-hidden="true" />
      <div className="lp-shell lp-final__inner lp-reveal">
        <div className="lp-final__signal"><span /><span /><span /><i /></div>
        <span>Seu site já está gerando sinais.</span>
        <h2>Transforme visitas<br />em decisões.</h2>
        <p>Instale o Kubo em 2 minutos, acompanhe os primeiros acessos e descubra o que realmente merece a sua atenção.</p>
        <Link to="/login" className="lp-feixe-btn" aria-label="Começar 7 dias grátis">
          <span className="lp-feixe-border" aria-hidden="true" />
          <span className="lp-feixe-inner">Começar 7 dias grátis <ArrowRight size={17} /></span>
        </Link>
      </div>
    </section>
  );
}

export function PremiumFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-shell lp-footer__top">
        <div><strong>Kubo Analytics</strong><p>Analytics próprio para transformar sinais do seu site em decisões mais claras.</p></div>
        <nav aria-label="Links do rodapé"><a href="#product-story">Produto</a><a href="#capabilities">Recursos</a><a href="#comparative">Comparativo</a><a href="#pricing">Planos</a><a href="#faq">Dúvidas</a><Link to="/login">Entrar</Link></nav>
      </div>
      <div className="lp-shell lp-footer__bottom"><span>© {new Date().getFullYear()} Kubo Web</span><span><ShieldCheck /> Privacidade por princípio · 100% LGPD</span></div>
    </footer>
  );
}

