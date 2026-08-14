import { ArrowRight, BarChart3, Target, Sparkles, Check, Activity, TrendingUp, LineChart, Shield, Lock, Globe, Zap, Menu, X, MousePointerClick, Users, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";

/* ─────────────────────────────────────────────────────────────
   Animated counter hook for stats
   ───────────────────────────────────────────────────────────── */
const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
};

/* ─────────────────────────────────────────────────────────────
   Navbar — Frosted glass, minimal, professional
   ───────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/70 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_40px_-10px_rgba(0,0,0,0.3)]" : "bg-transparent"}`}>
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 z-50">
          <img src={logoKubowebWhite} alt="KUBOWEB" className="h-6 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {["Recursos", "Como funciona", "Depoimentos"].map((label, i) => (
            <a key={label} href={`#${["features", "how-it-works", "testimonials"][i]}`} className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/[0.04]">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04]">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="h-9 px-5 text-[13px] font-semibold rounded-lg bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.3)]">
            <Link to="/login">Começar grátis</Link>
          </Button>
        </div>

        <button className="md:hidden z-50 p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 pt-20 bg-background/98 backdrop-blur-3xl z-40 flex flex-col px-6 animate-fade-in">
          <div className="flex flex-col gap-1 mt-8">
            {[["Recursos", "#features"], ["Como funciona", "#how-it-works"], ["Depoimentos", "#testimonials"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="py-4 text-lg font-medium text-foreground border-b border-white/[0.06]">{label}</a>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full h-12 rounded-xl text-base"><Link to="/login" onClick={() => setMobileOpen(false)}>Entrar</Link></Button>
            <Button asChild className="w-full h-12 rounded-xl bg-white text-black text-base font-semibold"><Link to="/login" onClick={() => setMobileOpen(false)}>Começar grátis</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
};

/* ─────────────────────────────────────────────────────────────
   Hero — Massive typography, live dashboard preview
   ───────────────────────────────────────────────────────────── */
const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
    {/* Ambient light orbs */}
    <div className="absolute inset-0 bg-background" />
    <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[hsl(244,75%,62%)]/[0.07] blur-[150px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(262,83%,70%)]/[0.06] blur-[150px]" />
    <div className="absolute top-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-[hsl(199,89%,48%)]/[0.04] blur-[120px]" />

    {/* Dot grid background */}
    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.06)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]" />

    <div className="relative z-10 mx-auto max-w-[1200px] px-6 flex flex-col items-center text-center">
      {/* Announcement pill */}
      <div className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-md px-4 py-2 text-[13px] font-medium text-muted-foreground mb-12 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all cursor-pointer group">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
        </span>
        Novo: Relatórios com IA generativa
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Headline */}
      <h1 className="animate-fade-up text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold tracking-[-0.04em] leading-[0.92] text-foreground max-w-4xl" style={{ animationDelay: "80ms" }}>
        Seus dados.{" "}
        <span className="bg-gradient-to-r from-[hsl(244,75%,65%)] via-[hsl(262,83%,72%)] to-[hsl(199,89%,55%)] bg-clip-text text-transparent">
          Suas decisões.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="animate-fade-up mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed font-normal" style={{ animationDelay: "160ms" }}>
        Analytics de ponta, sem complexidade. Rastreie visitantes, monitore leads e cresça com dados reais — tudo em uma plataforma bonita e rápida.
      </p>

      {/* CTA row */}
      <div className="animate-fade-up mt-10 flex flex-col sm:flex-row items-center gap-4" style={{ animationDelay: "240ms" }}>
        <Button asChild size="lg" className="h-12 px-7 rounded-xl bg-white text-black font-semibold text-[15px] hover:bg-white/90 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_8px_30px_rgba(0,0,0,0.5)] hover:translate-y-[-1px]">
          <Link to="/login">
            Começar grátis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="h-12 px-7 rounded-xl text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04]">
          <a href="#features">
            Ver recursos
            <ChevronRight className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Trust badges */}
      <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground/70" style={{ animationDelay: "320ms" }}>
        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />Sem cartão de crédito</span>
        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />LGPD compliance</span>
        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />{"<"}1KB de script</span>
      </div>

      {/* ─── Dashboard Preview ─── */}
      <div className="animate-fade-up mt-20 w-full max-w-[960px] relative" style={{ animationDelay: "400ms" }}>
        {/* Glow */}
        <div className="absolute -inset-8 bg-gradient-to-b from-[hsl(244,75%,62%)]/[0.12] via-transparent to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="relative rounded-2xl border border-white/[0.08] bg-[hsl(var(--card))]/60 backdrop-blur-xl shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
            </div>
            <div className="mx-auto flex items-center gap-2 px-4 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-muted-foreground/60 font-mono">
              <Lock className="h-2.5 w-2.5" />
              app.kuboweb.com/dashboard
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-5 sm:p-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Visitantes", value: "2.847", delta: "+18%", color: "hsl(var(--success))" },
                { label: "Leads", value: "184", delta: "+24%", color: "hsl(225,70%,52%)" },
                { label: "Conversão", value: "4.8%", delta: "+1.2pp", color: "hsl(262,83%,58%)" },
                { label: "Receita", value: "R$18k", delta: "+12%", color: "hsl(25,95%,53%)" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">{kpi.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{kpi.value}</div>
                  <div className="mt-1 text-[11px] font-semibold tabular-nums" style={{ color: kpi.color }}>{kpi.delta}</div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="h-40 sm:h-52 rounded-xl bg-white/[0.02] border border-white/[0.04] relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(244,75%,62%)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(244,75%,62%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 160 C80 140,160 170,280 120 C400 70,480 130,600 85 C720 40,800 100,920 25 L920 25 C960 10,1000 18,1000 18 L1000 200 L0 200Z" fill="url(#hero-chart-fill)" />
                <path d="M0 160 C80 140,160 170,280 120 C400 70,480 130,600 85 C720 40,800 100,920 25 C960 10,1000 18,1000 18" fill="none" stroke="hsl(244,75%,62%)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Fade-to-background gradient at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Logos / social proof strip
   ───────────────────────────────────────────────────────────── */
const LogoStrip = () => (
  <section className="relative py-16 border-y border-white/[0.04]">
    <div className="mx-auto max-w-[1200px] px-6">
      <p className="text-center text-[13px] text-muted-foreground/50 uppercase tracking-[0.2em] font-medium mb-10">
        Confiado por times que crescem rápido
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {["LOFT", "PLANT STUDIO", "VEXIA", "NÓRDICA", "CASA NOVA", "KUBO LABS"].map((name) => (
          <span key={name} className="text-[15px] font-bold tracking-[0.15em] text-muted-foreground/25 hover:text-muted-foreground/40 transition-colors">{name}</span>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Features — Bento grid, asymmetric
   ───────────────────────────────────────────────────────────── */
const Features = () => (
  <section id="features" className="relative py-28 sm:py-36">
    <div className="mx-auto max-w-[1200px] px-6">
      <div className="max-w-xl mb-20">
        <p className="text-[13px] font-semibold text-[hsl(244,75%,65%)] tracking-[0.15em] uppercase mb-4">Recursos</p>
        <h2 className="text-4xl sm:text-[3.25rem] font-extrabold tracking-[-0.03em] leading-[1.05]">
          Tudo que você precisa.
          <br />
          <span className="text-muted-foreground">Nada que você não precisa.</span>
        </h2>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Large feature — Analytics */}
        <div className="md:col-span-7 group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 overflow-hidden hover:border-white/[0.1] transition-all duration-500 min-h-[380px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[hsl(244,75%,62%)]/[0.05] blur-[100px] rounded-full group-hover:bg-[hsl(244,75%,62%)]/[0.08] transition-colors duration-700" />
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-xl bg-[hsl(244,75%,62%)]/10 border border-[hsl(244,75%,62%)]/20 flex items-center justify-center text-[hsl(244,75%,62%)] mb-6">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">Analytics em tempo real</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-md">
              Cada visitante, cada clique, cada conversão — visualizado no exato milissegundo em que acontece. Zero latência entre dados e ação.
            </p>
          </div>
          {/* Embedded mini chart */}
          <div className="absolute bottom-0 right-0 w-[55%] h-44 bg-background/40 backdrop-blur-md border-t border-l border-white/[0.06] rounded-tl-2xl p-4 transform translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-500">
            <div className="flex items-end gap-[6px] h-full">
              {[35, 55, 40, 75, 50, 90, 65, 100, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-[hsl(244,75%,62%)]/60 to-[hsl(244,75%,62%)]/10 rounded-t-sm transition-all duration-300" style={{ height: `${h}%`, transitionDelay: `${i * 30}ms` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Medium feature — AI Insights */}
        <div className="md:col-span-5 group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 overflow-hidden hover:border-white/[0.1] transition-all duration-500 min-h-[380px]">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(262,83%,70%)]/[0.05] blur-[80px] rounded-full group-hover:bg-[hsl(262,83%,70%)]/[0.08] transition-colors duration-700" />
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-xl bg-[hsl(262,83%,70%)]/10 border border-[hsl(262,83%,70%)]/20 flex items-center justify-center text-[hsl(262,83%,70%)] mb-6">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">Insights com IA</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Relatórios gerados automaticamente que mostram exatamente onde você está perdendo receita — e o que fazer.
            </p>
          </div>
        </div>

        {/* Medium feature — Auto-Track */}
        <div className="md:col-span-4 group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 overflow-hidden hover:border-white/[0.1] transition-all duration-500 min-h-[300px]">
          <div className="absolute top-0 left-0 w-48 h-48 bg-[hsl(var(--success))]/[0.04] blur-[60px] rounded-full group-hover:bg-[hsl(var(--success))]/[0.07] transition-colors duration-700" />
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 flex items-center justify-center text-[hsl(var(--success))] mb-6">
              <MousePointerClick className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">Auto-Track</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              WhatsApp, formulários, cliques em botões — tudo rastreado automaticamente. Sem configuração.
            </p>
          </div>
        </div>

        {/* Medium feature — Privacy */}
        <div className="md:col-span-4 group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 overflow-hidden hover:border-white/[0.1] transition-all duration-500 min-h-[300px]">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[hsl(225,70%,52%)]/[0.04] blur-[60px] rounded-full group-hover:bg-[hsl(225,70%,52%)]/[0.07] transition-colors duration-700" />
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-xl bg-[hsl(225,70%,52%)]/10 border border-[hsl(225,70%,52%)]/20 flex items-center justify-center text-[hsl(225,70%,52%)] mb-6">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">Privacidade total</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Sem cookies, sem dados pessoais. LGPD e GDPR compliant. Seus dados são criptografados e isolados.
            </p>
          </div>
        </div>

        {/* Medium feature — Multi-site */}
        <div className="md:col-span-4 group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 overflow-hidden hover:border-white/[0.1] transition-all duration-500 min-h-[300px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(25,95%,53%)]/[0.04] blur-[60px] rounded-full group-hover:bg-[hsl(25,95%,53%)]/[0.07] transition-colors duration-700" />
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-xl bg-[hsl(25,95%,53%)]/10 border border-[hsl(25,95%,53%)]/20 flex items-center justify-center text-[hsl(25,95%,53%)] mb-6">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">Multi-projeto</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Gerencie dezenas de sites em um único painel. Troque de projeto em um clique.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   How It Works — 3-step process
   ───────────────────────────────────────────────────────────── */
const HowItWorks = () => (
  <section id="how-it-works" className="relative py-28 sm:py-36 border-t border-white/[0.04]">
    <div className="mx-auto max-w-[1200px] px-6">
      <div className="text-center mb-20">
        <p className="text-[13px] font-semibold text-[hsl(244,75%,65%)] tracking-[0.15em] uppercase mb-4">Como funciona</p>
        <h2 className="text-4xl sm:text-[3.25rem] font-extrabold tracking-[-0.03em] leading-[1.05]">
          Três passos. Zero fricção.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
        {[
          { step: "01", title: "Cole o script", desc: "Uma tag de 1KB no HTML do seu site. Funciona com qualquer framework, CMS ou builder.", icon: Zap },
          { step: "02", title: "Acompanhe em tempo real", desc: "Visitantes, páginas, fontes de tráfego, conversões — tudo aparece instantaneamente no painel.", icon: Eye },
          { step: "03", title: "Cresça com dados", desc: "Receba insights de IA, compare períodos, exporte relatórios e tome decisões com clareza.", icon: TrendingUp },
        ].map((item) => (
          <div key={item.step} className="bg-background p-10 sm:p-12 group hover:bg-white/[0.02] transition-colors duration-500">
            <span className="text-[13px] font-bold text-[hsl(244,75%,65%)]/60 tracking-wider">{item.step}</span>
            <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-foreground/60 mt-6 mb-6 group-hover:bg-white/[0.06] group-hover:text-foreground transition-all">
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground mb-3">{item.title}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Stats — Animated counters
   ───────────────────────────────────────────────────────────── */
const StatBlock = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value, 1800);
  return (
    <div ref={ref} className="flex flex-col items-center p-6 sm:p-8">
      <div className="text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] text-foreground tabular-nums">
        {count}<span className="text-[hsl(244,75%,65%)]">{suffix}</span>
      </div>
      <div className="mt-3 text-[13px] font-medium text-muted-foreground/60 uppercase tracking-[0.15em]">{label}</div>
    </div>
  );
};

const Stats = () => (
  <section className="relative py-20">
    <div className="mx-auto max-w-[1200px] px-6">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
        <StatBlock value={60} suffix="s" label="Setup" />
        <StatBlock value={1} suffix="KB" label="Script" />
        <StatBlock value={100} suffix="%" label="LGPD" />
        <StatBlock value={24} suffix="/7" label="Monitoramento" />
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Testimonials — Clean, minimal
   ───────────────────────────────────────────────────────────── */
const Testimonials = () => (
  <section id="testimonials" className="relative py-28 sm:py-36 border-t border-white/[0.04]">
    <div className="mx-auto max-w-[1200px] px-6">
      <div className="text-center mb-20">
        <p className="text-[13px] font-semibold text-[hsl(244,75%,65%)] tracking-[0.15em] uppercase mb-4">Depoimentos</p>
        <h2 className="text-4xl sm:text-[3.25rem] font-extrabold tracking-[-0.03em]">
          O que nossos clientes dizem
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { quote: "Em duas semanas dobramos a taxa de conversão. O painel é absurdamente claro e rápido.", name: "Marina Souza", role: "Head of Growth · Loft" },
          { quote: "Substituímos três ferramentas por uma. Mais rápido, mais bonito, mais barato. Sem olhar para trás.", name: "Rafael Lima", role: "CTO · Plant Studio" },
          { quote: "Os insights de IA já pagaram o investimento do ano inteiro. Mudou completamente nossa rotina de marketing.", name: "Camila Reis", role: "Dir. Marketing · Vexia" },
        ].map((t, i) => (
          <figure key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-white/[0.1] transition-all duration-500">
            <blockquote className="text-[15px] text-foreground/90 leading-relaxed font-normal">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(244,75%,62%)] to-[hsl(262,83%,70%)] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {t.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="text-[13px] text-muted-foreground/60">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   CTA — Final conversion section
   ───────────────────────────────────────────────────────────── */
const CTA = () => (
  <section className="relative py-28 sm:py-36">
    <div className="mx-auto max-w-[900px] px-6 relative z-10">
      <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 sm:p-20 text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[hsl(244,75%,62%)]/[0.08] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-tight">
            Pronto para crescer com
            <br />
            <span className="bg-gradient-to-r from-[hsl(244,75%,65%)] via-[hsl(262,83%,72%)] to-[hsl(199,89%,55%)] bg-clip-text text-transparent">
              clareza total?
            </span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Comece em 60 segundos. Sem cartão de crédito, sem configuração complexa.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-white text-black font-semibold text-[15px] hover:bg-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_4px_20px_rgba(0,0,0,0.4)] hover:translate-y-[-1px] transition-all">
              <Link to="/login">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-[13px] text-muted-foreground/50">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Dados criptografados</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Setup em 1 minuto</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Footer — Minimal, clean
   ───────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t border-white/[0.04] py-10">
    <div className="mx-auto max-w-[1200px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-muted-foreground/50">
      <div className="flex items-center gap-3">
        <img src={logoKubowebWhite} alt="KUBOWEB" className="h-5 w-auto opacity-60" />
        <span>© {new Date().getFullYear()} KUBOWEB</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">Como funciona</a>
        <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
      </div>
    </div>
  </footer>
);

/* ─────────────────────────────────────────────────────────────
   Page composition
   ───────────────────────────────────────────────────────────── */
const Landing = () => (
  <>
    <Helmet>
      <title>KUBOWEB — Analytics invisível, crescimento visível.</title>
      <meta name="description" content="Analytics de ponta para seu site. Rastreie visitantes, monitore leads e cresça com dados reais." />
      <meta property="og:title" content="KUBOWEB — Analytics invisível, crescimento visível." />
      <meta property="og:description" content="Analytics de ponta para seu site. Rastreie visitantes, monitore leads e cresça com dados reais." />
    </Helmet>
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-[hsl(244,75%,62%)]/30">
      <Navbar />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  </>
);

export default Landing;
