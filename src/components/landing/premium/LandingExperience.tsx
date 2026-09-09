import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, BellRing, BrainCircuit, Check, Clock3,
  FileDown, Flame, Gauge, Globe2, Layers3, MousePointerClick, MonitorSmartphone,
  Radar, ShieldCheck, Sparkles, Target, Users, Zap, X, AlertTriangle, Shield
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
  return (
    <section id="realtime" className="lp-realtime">
      <div className="lp-shell lp-realtime__grid">
        <div className="lp-realtime__copy lp-reveal">
          <span className="lp-kicker"><span className="lp-live-dot" /> Ao vivo</span>
          <h2>O site não para.<br />Seu painel também não.</h2>
          <p>Veja visitantes ativos, páginas em visualização, origem e eventos recentes sem recarregar a página.</p>
          <Link to="/login" className="lp-text-link">Explorar o Kubo Live <ArrowRight /></Link>
        </div>
        <div className="lp-event-console lp-reveal">
          <div className="lp-event-console__top"><span><i /> Eventos em tempo real</span><small>Demonstração</small></div>
          <div className="lp-event-console__pulse"><strong>24</strong><span>visitantes agora</span><i /></div>
          <div className="lp-event-list">
            {events.map(({ icon: Icon, place, action, detail, tone }, index) => (
              <div className="lp-event" style={{ "--delay": `${index * 180}ms` } as React.CSSProperties} key={place}>
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
  return (
    <div className="lp-wa-demo">
      <div className="lp-wa-demo__pill">
        <span className="lp-live-dot" />
        <small>Captura instantânea</small>
      </div>
      <div className="lp-wa-demo__card">
        <div className="lp-wa-demo__left">
          <strong>+55 (11) 98765-4321</strong>
          <span>Origem: Google Orgânico · /servicos</span>
        </div>
        <div className="lp-wa-demo__badge">
          Lead qualificado
        </div>
      </div>
    </div>
  );
}

function HeatCells() { return <div className="lp-heat-cells">{Array.from({ length: 35 }, (_, index) => <i key={index} style={{ opacity: .12 + ((index * 7) % 10) / 12 }} />)}</div>; }
function Funnel() { return <div className="lp-funnel"><span style={{ width: "100%" }}>12.842 <small>visitantes</small></span><span style={{ width: "72%" }}>4.120 <small>engajados</small></span><span style={{ width: "46%" }}>486 <small>leads WhatsApp</small></span></div>; }
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
        <div className="lp-section-head lp-reveal"><span>Comece sem complexidade</span><h2>Do zero aos primeiros sinais<br />em quatro passos.</h2></div>
        <div className="lp-setup__line">
          {steps.map(([number, title, copy]) => <article className="lp-reveal" key={number}><b>{number}</b><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </div>
    </section>
  );
}

const freeFeatures = ["1 projeto / site", "Histórico de 7 dias", "Alertas no painel", "Métricas essenciais", "Rastreamento automático de cliques"];
const fallbackPro = {
  name: "Pro",
  tagline: "KUBOWEB Pro — tudo incluso",
  price: "R$ 49,90",
  cadence: "/mês",
  highlight: "7 dias grátis — cancele a qualquer momento",
  cta: "Começar 7 dias grátis",
  features: [
    "Projetos / sites ilimitados",
    "Conversões e visitantes em tempo real",
    "Mapas de calor por horário e dia",
    "Resumos com IA e alertas por e-mail",
    "Histórico estendido de 12 meses",
    "Relatórios em PDF executivo e Excel XLSX",
    "Ambientes para múltiplos clientes (Multi-tenant)",
  ],
};

export function PremiumPricing() {
  const { plans, loading, error } = usePlans();
  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal"><span>Planos transparentes</span><h2>Comece grátis.<br />Evolua quando fizer sentido.</h2><p>Sem uma tabela artificial de planos: o Kubo mantém uma opção gratuita e um Pro completo com 7 dias grátis.</p></div>
        <div className="lp-pricing__grid lp-reveal">
          <PricingCard name="Gratuito" tagline="Para validar o Kubo no seu site" price="R$ 0,00" cadence="/mês" features={freeFeatures} cta="Criar conta grátis" />
          {loading && <div className="lp-price-card lp-price-card--loading" aria-label="Carregando plano Pro"><i /><i /><i /><i /></div>}
          {!loading && plans.map((plan) => <PricingCard key={plan.id} name={plan.name} tagline={plan.tagline} price={plan.price} cadence={plan.cadence} highlight={plan.highlight} features={plan.features} cta={plan.cta} recommended={plan.recommended} disabled={!plan.enabled} />)}
          {!loading && error && <PricingCard {...fallbackPro} recommended />}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ name, tagline, price, cadence, features, cta, highlight, recommended, disabled }: { name: string; tagline: string; price: string; cadence: string; features: string[]; cta: string; highlight?: string; recommended?: boolean; disabled?: boolean }) {
  return (
    <article className={`lp-price-card ${recommended ? "is-recommended" : ""}`}>
      <div className="lp-price-card__top"><div><span>{recommended ? "Tudo incluso" : "Essencial"}</span><h3>{name}</h3></div>{recommended && <em>Recomendado</em>}</div>
      <p>{tagline}</p><div className="lp-price"><strong>{price}</strong><small>{cadence}</small></div>{highlight && <div className="lp-price__highlight">{highlight}</div>}
      <ul>{features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>
      {disabled
        ? <span className="is-disabled" aria-disabled="true">Indisponível<ArrowRight /></span>
        : <Link to="/login">{cta}<ArrowRight /></Link>}
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

