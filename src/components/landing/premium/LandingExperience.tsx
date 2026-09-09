import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, BellRing, BrainCircuit, Check, Clock3,
  Copy, Cpu, FileDown, Flame, Gauge, Globe2, Layers3, Lock, MousePointerClick,
  MonitorSmartphone, Radar, Server, ShieldCheck, Sparkles, Target, Users, Zap, X,
  AlertTriangle, Shield
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
  return (
    <section className="lp-bridge">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal">
          <span>O contraste que muda o jogo</span>
          <h2>Por que o Google Analytics<br />ficou para trás.</h2>
          <p>O GA4 se tornou um labirinto de configurações, dados com atraso de até 48 horas e zero foco em conversão rápida de WhatsApp.</p>
        </div>

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

const capabilities = [
  { icon: MousePointerClick, className: "lp-capability--wide", title: "Motor de Conversão de WhatsApp", copy: "Detecte automaticamente cada clique em links de WhatsApp, telefones e formulários no seu site, sem mexer no código do botão.", visual: <WhatsAppDemo /> },
  { icon: Flame, className: "lp-capability--heat", title: "Mapas de Calor 24x7", copy: "Visualize padrões de atividade por dia e horário para saber exatamente quando seu público navega e decide.", visual: <HeatCells /> },
  { icon: BellRing, className: "", title: "Alertas Inteligentes", copy: "Quedas, picos e mudanças anômalas de tráfego aparecem no painel e, no Pro, também diretamente por e-mail.", visual: <div className="lp-alert-demo"><i /><span>Tráfego acima da média</span><b>+31%</b></div> },
  { icon: Target, className: "", title: "Metas e Funis", copy: "Acompanhe a taxa de conversão do primeiro acesso até o clique decisivo em cada página de destino.", visual: <Funnel /> },
  { icon: FileDown, className: "lp-capability--wide", title: "Relatórios Executivos em 1 Clique", copy: "Exporte apresentações e relatórios em PDF corporativo e planilhas Excel XLSX nativas para enviar a clientes.", visual: <ExportPills /> },
  { icon: Layers3, className: "", title: "Multi-tenant & White-label", copy: "Crie organizações separadas para cada cliente da sua agência com relatórios personalizados sob sua marca.", visual: <OrgLayers /> },
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="lp-capabilities">
      <div className="lp-shell">
        <div className="lp-section-head lp-reveal">
          <span>Recursos desenhados para resultados</span>
          <h2>Profundidade quando precisa.<br />Simplicidade sempre.</h2>
          <p>Tudo o que sua agência ou empresa precisa para acompanhar performance web sem o excesso do GA4.</p>
        </div>
        <div className="lp-capability-grid">
          {capabilities.map(({ icon: Icon, className, title, copy, visual }) => (
            <article className={`lp-capability lp-reveal ${className}`} key={title}>
              <div className="lp-capability__icon"><Icon /></div>
              <h3>{title}</h3><p>{copy}</p>{visual}
            </article>
          ))}
        </div>
      </div>
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

function ExportPills() { return <div className="lp-export-pills"><span>PDF Executivo</span><span>Excel Nativo (XLSX)</span><span>CSV Completo</span><span>Apresentação</span></div>; }
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
    ["01", "Crie sua conta", "Comece pelo plano gratuito e configure sua organização em segundos."],
    ["02", "Adicione o seu site", "Cadastre o domínio do seu projeto e copie o snippet de código."],
    ["03", "Instale uma única vez", "Cole o script no cabeçalho do site (WordPress, Webflow, etc.)."],
    ["04", "Acompanhe os dados", "Visitantes e conversões começam a aparecer instantaneamente."],
  ];
  return (
    <section className="lp-setup">
      <div className="lp-shell">
        <div className="lp-section-head lp-reveal">
          <span>Comece sem complexidade</span>
          <h2>Do zero aos primeiros sinais<br />em quatro passos.</h2>
        </div>
        <div className="lp-setup__line">
          {steps.map(([number, title, copy]) => (
            <article className="lp-reveal" key={number}>
              <b>{number}</b>
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
        ) : (
          <Link
            to="/login"
            className={`lp-price-btn ${recommended ? "lp-price-btn--primary" : "lp-price-btn--ghost"}`}
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
        <Link to="/login" className="lp-button">Começar 7 dias grátis <ArrowRight /></Link>
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

