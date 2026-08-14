import { ArrowRight, BarChart3, Target, Sparkles, Check, Activity, TrendingUp, LineChart, Shield, Lock, Globe, Zap, Menu, X, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import logoKubowebWhite from "../assets/logo_kuboweb_white.webp";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 z-50">
          <img src={logoKubowebWhite} alt="KUBOWEB" className="h-6 w-auto" width="94" height="24" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
          <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
          <a href="#social" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Clientes</a>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild className="text-sm font-medium hover:bg-white/5">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="gradient-primary text-white border-0 shadow-lg shadow-primary/25 rounded-full px-6">
            <Link to="/login">Criar conta gratuita</Link>
          </Button>
        </div>
        <button 
          className="md:hidden z-50 text-foreground p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-0 pt-20 bg-background/95 backdrop-blur-3xl z-40 flex flex-col px-6">
          <div className="flex flex-col gap-6 text-lg font-medium mt-10">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)}>Benefícios</a>
            <a href="#social" onClick={() => setMobileMenuOpen(false)}>Clientes</a>
            <hr className="border-border" />
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
            <Button asChild className="gradient-primary text-white w-full py-6 mt-4">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Criar conta gratuita</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = () => (
  <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32 flex flex-col items-center">
    {/* Ultra-premium background mesh */}
    <div className="absolute inset-0 bg-background" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
    <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse-soft" />
    <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-chart-purple/20 blur-[120px] mix-blend-screen animate-float" style={{ animationDelay: '1s' }} />
    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-chart-blue/20 blur-[120px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center text-center z-10">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground mb-10 animate-fade-up hover:bg-white/10 transition-colors shadow-2xl shadow-primary/20 cursor-pointer">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        KUBOWEB 2.0 IS LIVE
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <h1 className="text-5xl sm:text-7xl lg:text-[6rem] font-bold tracking-tighter text-foreground leading-[0.95] animate-fade-up max-w-5xl" style={{ animationDelay: "100ms" }}>
        Analytics invisível.
        <br />
        <span className="gradient-text animate-gradient pb-2 inline-block">Crescimento visível.</span>
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
      <div className="mt-20 relative animate-fade-up w-full max-w-5xl" style={{ animationDelay: "500ms" }}>
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

const StatItem = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => (
  <div className="flex flex-col items-center justify-center p-4">
    <div className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground tabular-nums flex items-baseline gap-1">
      {value}<span className="text-xl sm:text-2xl text-primary">{suffix}</span>
    </div>
    <div className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
  </div>
);

const Stats = () => (
  <section id="stats" className="relative py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Por que KUBOWEB</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">Feito para times exigentes</h2>
      </div>
      <div className="glass-strong rounded-[2rem] p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatItem value={60} suffix="s" label="Setup em segundos" />
        <StatItem value={1} suffix="KB" label="Script leve" />
        <StatItem value={100} suffix="%" label="Compatível LGPD" />
        <StatItem value={24} suffix="/7" label="Dados em tempo real" />
      </div>
    </div>
  </section>
);

const Features = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter">
            Tudo que você precisa.<br />
            <span className="text-muted-foreground">Construído à perfeição.</span>
          </h2>
        </div>
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
          {/* Large Item */}
          <div className="md:col-span-2 group relative glass-card rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Analytics em Tempo Real</h3>
                <p className="text-muted-foreground max-w-sm">Acompanhe cada clique, visitante e conversão no exato milissegundo em que acontecem. Sem delays.</p>
              </div>
              
              {/* Decorative mini-chart inside the bento box */}
              <div className="absolute -bottom-4 -right-4 w-2/3 h-48 bg-background/50 backdrop-blur-xl border border-white/10 rounded-tl-2xl rounded-br-2xl shadow-2xl p-4 transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500">
                <div className="flex items-end gap-2 h-full opacity-80 pt-10">
                   {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                     <div key={i} className="flex-1 bg-gradient-to-t from-primary/80 to-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                   ))}
                </div>
              </div>
            </div>
          </div>

          {/* Medium Item */}
          <div className="group relative glass-card rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-chart-purple/10 blur-[60px] rounded-full group-hover:bg-chart-purple/20 transition-colors" />
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-chart-purple/10 border border-chart-purple/20 flex items-center justify-center text-chart-purple mb-6">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Insights com IA</h3>
              <p className="text-muted-foreground">Relatórios gerados automaticamente que apontam onde você está perdendo dinheiro.</p>
            </div>
          </div>

          {/* Medium Item */}
          <div className="group relative glass-card rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/10 blur-[60px] rounded-full group-hover:bg-success/20 transition-colors" />
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success mb-6">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Auto-Track</h3>
              <p className="text-muted-foreground">Rastreie envios de formulário e cliques no WhatsApp sem configurar absolutamente nada.</p>
            </div>
          </div>

          {/* Medium/Wide Item */}
          <div className="md:col-span-2 group relative glass-card rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-center h-full">
              <div className="flex-1">
                <div className="h-12 w-12 rounded-2xl bg-chart-blue/10 border border-chart-blue/20 flex items-center justify-center text-chart-blue mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Privacidade Absoluta</h3>
                <p className="text-muted-foreground">100% focado na LGPD e GDPR. Sem cookies irritantes, sem dados expostos. Seus dados são criptografados no banco e pertencem apenas a você.</p>
              </div>
              <div className="flex-1 flex justify-center w-full">
                 <div className="flex gap-4 opacity-50">
                   <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"><Globe className="h-8 w-8" /></div>
                   <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"><Lock className="h-8 w-8" /></div>
                 </div>
              </div>
            </div>
          </div>

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Benefícios</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tighter text-foreground">
              Por que times escolhem <span className="gradient-text">KUBOWEB</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Construímos a plataforma que sempre quisemos usar: rápida, bonita, sem ruído e com tudo
              que importa para crescer.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 gap-8">
              {list.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="shrink-0 h-8 w-8 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 mt-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-foreground">{b.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative glass-strong rounded-[2rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live · agora</div>
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--success))] font-bold">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  84 ativos
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { c: "🇧🇷", p: "/produtos/premium", t: "agora" },
                  { c: "🇧🇷", p: "/checkout", t: "12s" },
                  { c: "🇵🇹", p: "/blog/analytics", t: "34s" },
                  { c: "🇧🇷", p: "/contato", t: "1m" },
                  { c: "🇺🇸", p: "/", t: "2m" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-background/40 border border-border/60 px-4 py-3 text-sm">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-lg">{row.c}</span>
                      <span className="font-mono text-sm text-muted-foreground truncate">{row.p}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold tabular-nums">{row.t}</span>
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

const CTA = () => (
  <section className="relative py-24 sm:py-32 overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
    <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
      <div className="relative overflow-hidden rounded-[3rem] glass-strong border border-primary/20 p-12 sm:p-24 text-center shadow-2xl">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[hsl(var(--primary-glow))]/20 blur-[100px] animate-float" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-20">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-8" />
          <h2 className="text-5xl sm:text-6xl font-bold tracking-tighter">
            Pronto para ver tudo com <span className="gradient-text">clareza?</span>
          </h2>
          <p className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Junte-se às empresas que já descobriram o poder de ter analytics de ponta. 
            Sem complexidade.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
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
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground font-semibold">
            <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-muted-foreground/80" /> Dados criptografados</div>
            <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-warning" /> Setup em 1 minuto</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/5 py-12 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground relative z-10">
      <div className="flex items-center gap-3">
        <img src={logoKubowebWhite} alt="KUBOWEB" className="h-6 w-auto" width="94" height="24" />
        <span className="font-medium">© {new Date().getFullYear()} KUBOWEB</span>
      </div>
      <div className="flex items-center gap-8">
        <a href="#features" className="font-medium hover:text-foreground transition-colors">Recursos</a>
        <a href="#benefits" className="font-medium hover:text-foreground transition-colors">Benefícios</a>
        <Link to="/login" className="font-medium hover:text-foreground transition-colors">Entrar</Link>
      </div>
    </div>
  </footer>
);

const Landing = () => {
  return (
    <>
      <Helmet>
        <title>KUBOWEB — Analytics invisível, crescimento visível.</title>
        <meta name="description" content="Acompanhe visitantes, monitore leads e tome decisões baseadas em dados com o KUBOWEB." />
        <meta property="og:title" content="KUBOWEB — Analytics invisível, crescimento visível." />
        <meta property="og:description" content="Acompanhe visitantes, monitore leads e tome decisões baseadas em dados com o KUBOWEB." />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/" />
        <meta property="og:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <meta name="twitter:title" content="KUBOWEB — Analytics invisível, crescimento visível." />
        <meta name="twitter:description" content="Acompanhe visitantes, monitore leads e tome decisões baseadas em dados com o KUBOWEB." />
        <meta name="twitter:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground">
        <Navbar />
        <main>
          <Hero />
          <Stats />
          <Features />
          <Benefits />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Landing;
