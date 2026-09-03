import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, BellRing, BrainCircuit, Check, Clock3,
  FileDown, Flame, Gauge, Globe2, Layers3, MousePointerClick, MonitorSmartphone,
  Radar, ShieldCheck, Sparkles, Target, Users, Zap,
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
    <section className="lp-signal" aria-label="Recursos centrais do Kubo">
      <div className="lp-shell lp-signal__inner">
        <span><Activity /> Visitantes em tempo real</span>
        <span><MousePointerClick /> Conversões</span>
        <span><Radar /> Fontes de tráfego</span>
        <span><BrainCircuit /> Insights com IA</span>
        <span><ShieldCheck /> Consentimento LGPD</span>
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
            <div className="lp-story__frame"><ProductDashboard /></div>
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
  { icon: Users, place: "São Paulo", action: "Nova visita", detail: "Landing page", tone: "blue" },
  { icon: Globe2, place: "Pesquisa orgânica", action: "Origem detectada", detail: "Google", tone: "cyan" },
  { icon: MousePointerClick, place: "/recursos", action: "Clique em CTA", detail: "Começar grátis", tone: "violet" },
  { icon: Zap, place: "Conversão", action: "Novo lead", detail: "WhatsApp", tone: "green" },
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
  { icon: Gauge, className: "lp-capability--wide", title: "Analytics que explica o período", copy: "KPIs, comparação, fontes, páginas, dispositivos, localização e comportamento em uma leitura consistente.", visual: <MiniChart /> },
  { icon: Flame, className: "lp-capability--heat", title: "Mapas de calor", copy: "Visualize padrões por dia e horário para reconhecer quando a atenção acontece.", visual: <HeatCells /> },
  { icon: BellRing, className: "", title: "Alertas inteligentes", copy: "Quedas, picos e mudanças relevantes aparecem no painel e, no Pro, também por e-mail.", visual: <div className="lp-alert-demo"><i /><span>Tráfego acima da média</span><b>+31%</b></div> },
  { icon: Target, className: "", title: "Metas e funis", copy: "Acompanhe o caminho de visitantes até os eventos de conversão.", visual: <Funnel /> },
  { icon: FileDown, className: "lp-capability--wide", title: "Relatórios que saem do painel", copy: "Exporte PDF, CSV e Excel, compare projetos e use o modo apresentação em reuniões.", visual: <ExportPills /> },
  { icon: Layers3, className: "", title: "Organizações isoladas", copy: "Projetos e assinaturas são separados por organização, com permissões verificadas no acesso.", visual: <OrgLayers /> },
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="lp-capabilities">
      <div className="lp-shell">
        <div className="lp-section-head lp-reveal">
          <span>Uma plataforma, várias leituras</span>
          <h2>Profundidade quando precisa.<br />Simplicidade sempre.</h2>
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

function MiniChart() { return <div className="lp-mini-chart"><svg viewBox="0 0 300 80" preserveAspectRatio="none"><path d="M0 70 C45 60 55 35 92 43 S150 68 183 30 S238 20 300 4" /><path className="is-fill" d="M0 70 C45 60 55 35 92 43 S150 68 183 30 S238 20 300 4 L300 80 L0 80Z" /></svg><span>Visitantes</span><strong>12.842</strong><small>+18,4%</small></div>; }
function HeatCells() { return <div className="lp-heat-cells">{Array.from({ length: 35 }, (_, index) => <i key={index} style={{ opacity: .12 + ((index * 7) % 10) / 12 }} />)}</div>; }
function Funnel() { return <div className="lp-funnel"><span style={{ width: "100%" }}>12.842 <small>visitantes</small></span><span style={{ width: "72%" }}>4.120 <small>engajados</small></span><span style={{ width: "46%" }}>486 <small>leads</small></span></div>; }
function ExportPills() { return <div className="lp-export-pills"><span>PDF</span><span>CSV</span><span>Excel</span><span>Apresentação</span></div>; }
function OrgLayers() { return <div className="lp-org-layers"><span>Organização A</span><span>Organização B</span><i><ShieldCheck /> Acesso isolado</i></div>; }

export function SetupSection() {
  const steps = [
    ["01", "Crie sua conta", "Comece pelo plano gratuito e configure sua organização."],
    ["02", "Adicione o seu site", "Crie um projeto e copie o código de acompanhamento."],
    ["03", "Instale uma vez", "Inclua o snippet nas páginas que deseja analisar."],
    ["04", "Acompanhe", "Os primeiros acessos aparecem no painel e no feed ao vivo."],
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

const freeFeatures = ["1 projeto / site", "Histórico de 7 dias", "Alertas no painel", "Métricas essenciais"];
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
    "Mapas de calor",
    "Resumos com IA e alertas",
    "Histórico estendido de 12 meses",
    "Relatórios em PDF, CSV e Excel",
  ],
};

export function PremiumPricing() {
  const { plans, loading, error } = usePlans();
  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-shell">
        <div className="lp-section-head lp-section-head--center lp-reveal"><span>Planos transparentes</span><h2>Comece grátis.<br />Evolua quando fizer sentido.</h2><p>Sem uma tabela artificial de planos: o Kubo mantém uma opção gratuita e um Pro completo.</p></div>
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
        <p>Instale o Kubo, acompanhe os primeiros acessos e descubra o que merece a sua atenção.</p>
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
        <nav aria-label="Links do rodapé"><a href="#product-story">Produto</a><a href="#capabilities">Recursos</a><a href="#pricing">Planos</a><a href="#faq">Dúvidas</a><Link to="/login">Entrar</Link></nav>
      </div>
      <div className="lp-shell lp-footer__bottom"><span>© {new Date().getFullYear()} Kubo Web</span><span><ShieldCheck /> Privacidade por princípio</span></div>
    </footer>
  );
}
