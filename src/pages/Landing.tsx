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
    <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />
    {/* Floating orbs */}
    <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-float pointer-events-none" />
    <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-[hsl(var(--primary-glow))]/20 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-center">
      <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-6 animate-fade-up">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
        </span>
        Novo · Insights com IA em tempo real
        <ArrowRight className="h-3 w-3" />
      </div>

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.05] animate-fade-up" style={{ animationDelay: "60ms" }}>
        Analytics premium para
        <br />
        <span className="gradient-text animate-gradient">decisões que importam.</span>
      </h1>

      <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: "120ms" }}>
        Acompanhe visitantes, leads e conversões em tempo real — com privacidade total e
        insights inteligentes que cabem em qualquer site, instalados em minutos.
      </p>

      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <Button asChild size="lg" className="h-12 px-7 rounded-full gradient-primary text-white border-0 hover:opacity-90 shadow-xl shadow-primary/40 animate-pulse-glow">
          <Link to="/login">
            Comece em 60 segundos
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-full glass border-border-strong">
          <a href="#features">Ver recursos</a>
        </Button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> Sem cartão</div>
        <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> LGPD compliant</div>
        <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> Script &lt; 1KB</div>
      </div>

      {/* Mock dashboard preview */}
      <div className="mt-16 relative animate-fade-up" style={{ animationDelay: "320ms" }}>
        <div className="absolute -inset-4 gradient-primary opacity-30 blur-3xl rounded-3xl" />
        <div className="relative glass-strong rounded-2xl p-3 shadow-2xl">
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/60">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]/80" />
              <div className="ml-3 text-[10px] text-muted-foreground">app.kuboweb.com/dashboard</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
              {[
                { l: "Visitantes", v: "12.487", c: "+18%", i: Users },
                { l: "Leads", v: "342", c: "+24%", i: Target },
                { l: "Conversão", v: "2.74%", c: "+0.4pp", i: TrendingUp },
                { l: "Valor", v: "R$ 84k", c: "+31%", i: LineChart },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border border-border/60 bg-background/40 p-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k.l}</span>
                    <k.i className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">{k.v}</div>
                  <div className="text-[10px] text-[hsl(var(--success))] font-medium">{k.c}</div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="h-32 rounded-lg gradient-primary opacity-80 relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <path
                    d="M0 90 L 40 70 L 80 78 L 120 50 L 160 62 L 200 38 L 240 48 L 280 22 L 320 30 L 360 12 L 400 18 L 400 120 L 0 120 Z"
                    fill="rgba(255,255,255,0.2)"
                  />
                  <path
                    d="M0 90 L 40 70 L 80 78 L 120 50 L 160 62 L 200 38 L 240 48 L 280 22 L 320 30 L 360 12 L 400 18"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
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
              className="group relative glass rounded-2xl p-6 glass-card-hover overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full gradient-primary opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500" />
              <div className="relative">
                <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-4">
                  <it.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{it.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
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
  <section className="relative py-20 sm:py-28">
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-10 sm:p-16 text-center">
        <div className="absolute inset-0 gradient-primary opacity-20" />
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[hsl(var(--primary-glow))]/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />

        <div className="relative">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Pronto para ver tudo com <span className="gradient-text">clareza?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Comece grátis em 60 segundos. Sem cartão, sem fricção. Cancele quando quiser.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-8 rounded-full gradient-primary text-white border-0 hover:opacity-90 shadow-xl shadow-primary/40">
              <Link to="/login">
                Criar minha conta
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full glass border-border-strong">
              <Link to="/login">Já sou cliente</Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Dados criptografados</div>
            <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Setup em 60s</div>
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
