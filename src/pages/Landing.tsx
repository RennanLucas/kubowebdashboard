import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  Globe,
  LineChart,
  Lock,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";

/* ----------------------------- Animated counter ---------------------------- */
function useCountUp(target: number, durationMs = 1600, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return value;
}

function StatItem({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const v = useCountUp(value, 1800, visible);
  const formatted = value >= 1000 ? Math.round(v).toLocaleString("pt-BR") : v.toFixed(value % 1 ? 1 : 0);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-semibold tracking-tight gradient-text tabular-nums">
        {formatted}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/* ------------------------------- Components -------------------------------- */
const Navbar = () => (
  <header className="fixed top-0 inset-x-0 z-50">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4">
      <nav className="glass-strong rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoKubowebWhite} alt="KUBOWEB" className="h-7 w-auto" width="109" height="28" />
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline tracking-[0.18em] uppercase">
            Analytics
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#stats" className="hover:text-foreground transition-colors">Resultados</a>
          <a href="#benefits" className="hover:text-foreground transition-colors">Benefícios</a>
          <a href="#social" className="hover:text-foreground transition-colors">Clientes</a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline px-3">
            Entrar
          </Link>
          <Button asChild size="sm" className="rounded-full gradient-primary text-white border-0 hover:opacity-90 shadow-lg shadow-primary/30">
            <Link to="/login">
              Começar grátis
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-32">
    <div className="absolute inset-0 hero-bg pointer-events-none" />
    <div className="absolute inset-0 bg-grid pointer-events-none opacity-[0.15]" />
    {/* Floating orbs */}
    <div className="absolute top-0 -left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px] animate-float pointer-events-none" />
    <div className="absolute top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(var(--primary-glow))]/15 blur-[120px] animate-float pointer-events-none" style={{ animationDelay: "2s", animationDuration: "10s" }} />

    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-center">
      <div className="inline-flex items-center gap-2 rounded-full glass border border-primary/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary mb-8 animate-fade-up shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        KUBO 2.0 · Conheça o novo padrão
        <ArrowRight className="h-3.5 w-3.5" />
      </div>

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground leading-[1.1] animate-fade-up" style={{ animationDelay: "100ms" }}>
        Analytics de alto nível para
        <br />
        <span className="gradient-text animate-gradient pb-2 inline-block">decisões que importam.</span>
      </h1>

      <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: "200ms" }}>
        Uma plataforma completa, rápida e refinada. Acompanhe visitantes, leads e conversões em tempo real com design de classe mundial e insights com IA.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "300ms" }}>
        <Button asChild size="lg" className="h-14 px-8 rounded-full gradient-primary text-white border-0 hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]">
          <Link to="/login" className="text-base font-medium">
            Comece em 60 segundos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full glass-card hover:bg-white/10 transition-colors border-border-strong text-base font-medium">
          <a href="#features">Explorar recursos</a>
        </Button>
      </div>

      <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium animate-fade-up" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[hsl(var(--success))]" /> Sem cartão de crédito</div>
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[hsl(var(--success))]" /> 100% focado em LGPD</div>
        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[hsl(var(--success))]" /> Script ultra leve</div>
      </div>

      {/* Premium Dashboard Preview */}
      <div className="mt-20 relative animate-fade-up" style={{ animationDelay: "500ms" }}>
        {/* Glow behind the dashboard */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-chart-purple/20 to-chart-orange/30 blur-[80px] rounded-full opacity-60" />
        
        <div className="relative glass-card rounded-[2rem] p-3 shadow-2xl ring-1 ring-white/10 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="rounded-2xl border border-white/10 bg-background/80 backdrop-blur-xl overflow-hidden shadow-inner">
            {/* Window controls */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5 bg-white/5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/90 shadow-sm" />
                <div className="h-3 w-3 rounded-full bg-warning/90 shadow-sm" />
                <div className="h-3 w-3 rounded-full bg-success/90 shadow-sm" />
              </div>
              <div className="mx-auto px-4 py-1 rounded-md bg-black/20 text-[11px] text-muted-foreground font-mono flex items-center gap-2 border border-white/5 shadow-inner">
                <Lock className="h-3 w-3" />
                app.kuboweb.com/dashboard
              </div>
            </div>
            
            {/* Dashboard Mockup Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { l: "Visitantes Ativos", v: "84", c: "+12", i: Activity, cc: "text-success", bc: "bg-success/10" },
                  { l: "Leads Totais", v: "1.204", c: "+24%", i: Target, cc: "text-chart-blue", bc: "bg-chart-blue/10" },
                  { l: "Taxa de Conversão", v: "4.8%", c: "+1.2pp", i: TrendingUp, cc: "text-chart-purple", bc: "bg-chart-purple/10" },
                  { l: "Receita Estimada", v: "R$ 12k", c: "+8%", i: LineChart, cc: "text-chart-orange", bc: "bg-chart-orange/10" },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-white/5 bg-white/5 p-4 text-left hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{k.l}</span>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${k.bc}`}>
                        <k.i className={`h-4 w-4 ${k.cc}`} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{k.v}</div>
                    <div className={`text-xs font-medium mt-1 ${k.cc}`}>{k.c} <span className="text-muted-foreground">vs ontem</span></div>
                  </div>
                ))}
              </div>
              
              <div className="h-48 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden flex items-end">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 150 C 100 130, 200 180, 300 120 C 400 60, 500 140, 600 90 C 700 40, 800 110, 900 30 C 950 -10, 1000 20, 1000 20 L 1000 200 L 0 200 Z"
                    fill="url(#chart-grad)"
                  />
                  <path
                    d="M0 150 C 100 130, 200 180, 300 120 C 400 60, 500 140, 600 90 C 700 40, 800 110, 900 30 C 950 -10, 1000 20, 1000 20"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_hsl(var(--primary))]"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Stats = () => (
  <section id="stats" className="relative py-20 sm:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Por que KUBOWEB</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">Feito para times exigentes</h2>
      </div>
      <div className="glass-strong rounded-2xl p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatItem value={60} suffix="s" label="Setup em segundos" />
        <StatItem value={1} suffix="KB" label="Script leve" />
        <StatItem value={100} suffix="%" label="Compatível LGPD" />
        <StatItem value={24} suffix="/7" label="Dados em tempo real" />
      </div>
    </div>
  </section>
);

const Features = () => {
  const items = [
    { icon: BarChart3, title: "Analytics em tempo real", desc: "Veja visitantes ativos, páginas e fontes de tráfego enquanto acontecem." },
    { icon: Target, title: "Conversões automáticas", desc: "WhatsApp, formulários, cliques — tudo rastreado sem configuração." },
    { icon: Sparkles, title: "Insights com IA", desc: "Resumos semanais inteligentes que apontam oportunidades de crescimento." },
    { icon: Bell, title: "Alertas inteligentes", desc: "Receba notificações quando algo importante acontecer no seu site." },
    { icon: Globe, title: "Multi-projeto", desc: "Gerencie todos os seus sites em um único painel premium." },
    { icon: Shield, title: "Privacidade total", desc: "Sem cookies, sem dados pessoais. 100% compatível com LGPD." },
  ];
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Recursos</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            Tudo que você precisa, <span className="gradient-text">nada que você não precisa</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa, polida e rápida — pensada para times que valorizam clareza acima de tudo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <div
              key={it.title}
              className="group relative glass-card rounded-[24px] p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full gradient-primary opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-sm mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                  <it.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">{it.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Benefits = () => {
  const list = [
    { title: "Setup em minutos", desc: "Cole o snippet, e pronto. Sem dependências." },
    { title: "Dashboard intuitivo", desc: "Hierarquia visual clara, ações em 1 clique." },
    { title: "Performance imbatível", desc: "Script ultra leve, zero impacto no seu site." },
    { title: "Dados 100% seus", desc: "Banco isolado por cliente com RLS robusto." },
  ];
  return (
    <section id="benefits" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Benefícios</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Por que times escolhem <span className="gradient-text">KUBOWEB</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Construímos a plataforma que sempre quisemos usar: rápida, bonita, sem ruído e com tudo
              que importa para crescer.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-5">
              {list.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="shrink-0 h-7 w-7 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{b.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative glass-strong rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live · agora</div>
                <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--success))] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  84 ativos
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { c: "🇧🇷", p: "/produtos/premium", t: "agora" },
                  { c: "🇧🇷", p: "/checkout", t: "12s" },
                  { c: "🇵🇹", p: "/blog/analytics", t: "34s" },
                  { c: "🇧🇷", p: "/contato", t: "1m" },
                  { c: "🇺🇸", p: "/", t: "2m" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-background/40 border border-border/60 px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base">{row.c}</span>
                      <span className="font-mono text-xs text-muted-foreground truncate">{row.p}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{row.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Social = () => (
  <section id="social" className="relative py-20 sm:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Prova social</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
          Confiado por equipes que crescem
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {[
          {
            quote: "Em duas semanas dobramos a taxa de conversão do site. O painel é absurdamente claro.",
            name: "Marina Souza",
            role: "Head of Growth · Loft",
          },
          {
            quote: "Substituímos três ferramentas por uma. Mais rápido, mais bonito, mais barato.",
            name: "Rafael Lima",
            role: "CTO · Plant Studio",
          },
          {
            quote: "Os insights de IA da KUBOWEB já pagaram o ano inteiro. Mudou nossa rotina.",
            name: "Camila Reis",
            role: "Diretora de Marketing · Vexia",
          },
        ].map((t, i) => (
          <figure key={i} className="glass rounded-2xl p-6 glass-card-hover">
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
            </div>
            <blockquote className="text-sm text-foreground leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
        {["LOFT", "PLANT STUDIO", "VEXIA", "NÓRDICA", "KUBO LABS", "CASA NOVA"].map((b) => (
          <span key={b} className="text-sm font-bold tracking-[0.18em] text-muted-foreground">{b}</span>
        ))}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="relative py-24 sm:py-32 overflow-hidden">
    <div className="absolute inset-0 bg-grid opacity-[0.05]" />
    <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
      <div className="relative overflow-hidden rounded-[2.5rem] glass-strong border border-primary/20 p-12 sm:p-20 text-center shadow-2xl">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[hsl(var(--primary-glow))]/20 blur-[100px] animate-float" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-20">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-6" />
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Pronto para ver tudo com <span className="gradient-text">clareza?</span>
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Junte-se às empresas que já descobriram o poder de ter analytics de ponta. 
            Sem complexidade.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-10 rounded-full gradient-primary text-white border-0 hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] text-base font-semibold">
              <Link to="/login">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-full glass border-border-strong text-base font-semibold hover:bg-white/5">
              <Link to="/login">Acessar painel</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> Dados criptografados e isolados</div>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /> Instalação em 1 minuto</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border/60 py-10">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <img src={logoKubowebWhite} alt="KUBOWEB" className="h-5 w-auto" width="78" height="20" />
        <span>© {new Date().getFullYear()} KUBOWEB</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
        <a href="#benefits" className="hover:text-foreground transition-colors">Benefícios</a>
        <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
      </div>
    </div>
  </footer>
);

const Landing = () => {
  return (
    <>
      <Helmet>
        <title>KUBOWEB — Analytics e geração de leads para seu site</title>
        <meta name="description" content="Acompanhe visitantes, monitore leads e tome decisões baseadas em dados com o KUBOWEB." />
        <meta property="og:title" content="KUBOWEB — Analytics e geração de leads para seu site" />
        <meta property="og:description" content="Acompanhe visitantes, monitore leads e tome decisões baseadas em dados com o KUBOWEB." />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/" />
        <meta property="og:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <meta name="twitter:title" content="KUBOWEB — Analytics e geração de leads para seu site" />
        <meta name="twitter:description" content="Acompanhe visitantes, monitore leads e tome decisões baseadas em dados com o KUBOWEB." />
        <meta name="twitter:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <Stats />
          <Features />
          <Benefits />
          {/* <Social /> hidden until we have real customer quotes */}
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Landing;
