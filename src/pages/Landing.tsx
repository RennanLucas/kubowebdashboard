import { ArrowRight, BarChart3, Target, Sparkles, Check, Activity, TrendingUp, LineChart, Shield, Lock, Globe, Zap, Menu, X, MousePointerClick, Users, Eye, ChevronRight, PieChart, LayoutDashboard } from "lucide-react";
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
   Navbar
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
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/80 backdrop-blur-2xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "bg-transparent"}`}>
      <div className="mx-auto max-w-[1200px] px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 z-50 hover:opacity-80 transition-opacity">
          <img src={logoKubowebWhite} alt="Kubo Web" className="h-7 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Plataforma", "Integrações", "Agências"].map((label, i) => (
            <a key={label} href={`#${["features", "integrations", "agencies"][i]}`} className="text-sm font-medium text-muted-foreground hover:text-white transition-colors relative group">
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/[0.05]">
            <Link to="/login">Fazer Login</Link>
          </Button>
          <Button asChild className="h-10 px-6 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-glow hover:shadow-glow-primary transition-all rounded-lg">
            <Link to="/login">Acessar Painel</Link>
          </Button>
        </div>

        <button className="md:hidden z-50 p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 pt-24 bg-background/98 backdrop-blur-3xl z-40 flex flex-col px-6 animate-fade-in">
          <div className="flex flex-col gap-6 mt-8">
            {[["Plataforma", "#features"], ["Integrações", "#integrations"], ["Agências", "#agencies"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-xl font-bold text-white border-b border-white/[0.05] pb-4">{label}</a>
            ))}
          </div>
          <div className="mt-auto mb-10 flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full h-14 rounded-xl text-lg border-white/10"><Link to="/login" onClick={() => setMobileOpen(false)}>Fazer Login</Link></Button>
            <Button asChild className="w-full h-14 rounded-xl bg-primary text-white text-lg font-bold"><Link to="/login" onClick={() => setMobileOpen(false)}>Acessar Painel</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
};

/* ─────────────────────────────────────────────────────────────
   Hero — Cyberpunk/Web3 Aggressive Vibe
   ───────────────────────────────────────────────────────────── */
const Hero = () => (
  <section className="relative min-h-[110vh] flex flex-col items-center justify-center overflow-hidden pt-20">
    {/* Aggressive Grid Background */}
    <div className="absolute inset-0 bg-grid opacity-30" />
    
    {/* Deep neon glows */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.15] blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
    <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-chart-blue/[0.1] blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

    <div className="relative z-10 mx-auto max-w-[1200px] px-6 flex flex-col items-center text-center mt-10">
      <div className="animate-fade-up inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/[0.05] backdrop-blur-md px-5 py-2 text-sm font-medium text-primary mb-12 shadow-glow-primary hover:bg-primary/[0.1] transition-colors cursor-pointer">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-primary" />
        </span>
        KUBO WEB PORTAL V2.0
      </div>

      <h1 className="animate-fade-up text-[clamp(3rem,8vw,6.5rem)] font-black tracking-tighter leading-[0.95] text-white max-w-5xl drop-shadow-2xl" style={{ animationDelay: "100ms" }}>
        Controle total das
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-glow to-primary">
          suas campanhas.
        </span>
      </h1>

      <p className="animate-fade-up mt-8 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed font-medium" style={{ animationDelay: "200ms" }}>
        O hub central para agências e clientes. Visualize tráfego pago, conversões, ROAS e funis do Google Ads e Meta Ads em tempo real.
      </p>

      <div className="animate-fade-up mt-12 flex flex-col sm:flex-row items-center gap-5" style={{ animationDelay: "300ms" }}>
        <Button asChild size="lg" className="h-14 px-8 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-glow transition-all shadow-glow-primary hover:-translate-y-1">
          <Link to="/login">
            Acessar meu painel
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-xl text-base font-bold text-white border-white/10 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-md hover:border-white/20 transition-all">
          <a href="#features">
            Explorar plataforma
          </a>
        </Button>
      </div>

      {/* ─── Massive Campaign Dashboard Mockup ─── */}
      <div className="animate-fade-up mt-24 w-full max-w-[1000px] relative perspective-[2000px]" style={{ animationDelay: "500ms" }}>
        <div className="absolute -inset-1 bg-gradient-to-b from-primary/50 to-transparent blur-2xl rounded-[2rem] opacity-50" />

        <div className="relative rounded-[2rem] border border-white/[0.1] bg-card/80 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden transform-gpu hover:rotate-x-[2deg] hover:-translate-y-2 transition-transform duration-700 ease-out">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-black/40">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm tracking-wide text-white">VISÃO GERAL DAS CAMPANHAS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded bg-success/20 text-success text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Sincronizado
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-transparent to-black/50">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Investimento", value: "R$ 14.590", sub: "Google Ads + Meta", trend: "+12%" },
                { label: "Conversões", value: "842", sub: "Leads Validados", trend: "+24%", color: "text-success" },
                { label: "Custo por Lead", value: "R$ 17,32", sub: "-R$ 2,10 (14 dias)", trend: "-11%", color: "text-success" },
                { label: "ROAS Estimado", value: "4.2x", sub: "Retorno sobre Ads", trend: "+0.8x", color: "text-primary-glow" },
              ].map((k) => (
                <div key={k.label} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{k.label}</div>
                  <div className="text-3xl font-black text-white tabular-nums tracking-tight">{k.value}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/80">{k.sub}</span>
                    <span className={`text-[11px] font-bold ${k.color || 'text-white'}`}>{k.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Chart */}
            <div className="h-64 rounded-xl bg-black/40 border border-white/[0.05] p-5 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-white">Desempenho: Conversões vs Custo</span>
                <span className="text-xs font-medium text-muted-foreground bg-white/[0.05] px-2 py-1 rounded">Últimos 30 dias</span>
              </div>
              <div className="flex-1 relative mt-4">
                {/* Simulated Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between border-y border-white/[0.05]">
                  <div className="border-b border-white/[0.05] h-full" />
                  <div className="border-b border-white/[0.05] h-full" />
                  <div className="h-full" />
                </div>
                {/* SVG Chart */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area */}
                  <path d="M0 180 C100 160, 200 190, 350 120 C500 50, 600 140, 750 80 C900 20, 950 40, 1000 10 L1000 200 L0 200 Z" fill="url(#chartGlow)" />
                  {/* Line */}
                  <path d="M0 180 C100 160, 200 190, 350 120 C500 50, 600 140, 750 80 C900 20, 950 40, 1000 10" fill="none" stroke="hsl(var(--primary-glow))" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_12px_hsl(var(--primary))]" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Brand Logos (Aggressive styling)
   ───────────────────────────────────────────────────────────── */
const Integrations = () => (
  <section id="integrations" className="py-12 border-y border-white/[0.05] bg-black/50">
    <div className="mx-auto max-w-[1200px] px-6 text-center">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-8">
        Integração direta com as maiores plataformas de Ads
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
        <h3 className="text-2xl font-black tracking-tighter">GOOGLE ADS</h3>
        <h3 className="text-2xl font-black tracking-tighter">META ADS</h3>
        <h3 className="text-2xl font-black tracking-tighter">TIKTOK ADS</h3>
        <h3 className="text-2xl font-black tracking-tighter">LINKEDIN</h3>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Features — Dark Cyberpunk Bento
   ───────────────────────────────────────────────────────────── */
const Features = () => (
  <section id="features" className="py-32 relative">
    <div className="absolute inset-0 bg-dots opacity-20" />
    <div className="mx-auto max-w-[1200px] px-6 relative z-10">
      <div className="mb-20">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-6">
          O fim das planilhas complexas.
          <br />
          <span className="text-muted-foreground">O início dos dados claros.</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl font-medium">
          Diga adeus a relatórios confusos enviados por PDF. Seus clientes e sua agência merecem um painel de alta performance para entender o que realmente está gerando dinheiro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="lg:col-span-2 bg-card border border-white/[0.08] rounded-3xl p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-glow mb-8 shadow-glow">
              <PieChart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Dashboards Consolidados</h3>
            <p className="text-muted-foreground text-lg max-w-md">
              Google Ads, Facebook Ads e Analytics no mesmo lugar. Cruze os dados de investimento com as conversões reais do seu CRM.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-white/[0.08] rounded-3xl p-10 relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-success/10 rounded-full blur-[80px] group-hover:bg-success/20 transition-all duration-700" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center text-success mb-8 shadow-[0_0_30px_hsl(var(--success)/0.3)]">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Tempo Real</h3>
            <p className="text-muted-foreground text-lg">
              Custo por Lead e ROAS atualizados instantaneamente. Sem delays de 24 horas para tomar decisões.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-white/[0.08] rounded-3xl p-10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-warning/10 rounded-full blur-[80px] group-hover:bg-warning/20 transition-all duration-700" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-warning/20 border border-warning/30 flex items-center justify-center text-warning mb-8 shadow-[0_0_30px_hsl(var(--warning)/0.3)]">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Foco em ROAS</h3>
            <p className="text-muted-foreground text-lg">
              Saiba exatamente qual campanha, grupo de anúncios ou criativo está trazendo lucro para a empresa.
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="lg:col-span-2 bg-card border border-white/[0.08] rounded-3xl p-10 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
           <div className="relative z-10 flex flex-col sm:flex-row gap-10 items-center">
             <div className="flex-1">
               <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-8">
                 <Shield className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-black text-white mb-4">White-label para Agências</h3>
               <p className="text-muted-foreground text-lg">
                 Seu logo, suas cores, seu domínio. Ofereça um portal premium para os seus clientes de tráfego pago sem precisar programar uma linha de código.
               </p>
             </div>
             <div className="flex-1 w-full bg-black/50 border border-white/[0.05] rounded-2xl p-6 shadow-inner">
               <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/[0.05]">
                 <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white">AG</div>
                 <div>
                   <div className="text-white font-bold">Agência de Performance</div>
                   <div className="text-xs text-muted-foreground">app.suaagencia.com.br</div>
                 </div>
               </div>
               <div className="space-y-3">
                 <div className="h-4 bg-white/[0.05] rounded w-full" />
                 <div className="h-4 bg-white/[0.05] rounded w-3/4" />
                 <div className="h-4 bg-white/[0.05] rounded w-1/2" />
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Stats 
   ───────────────────────────────────────────────────────────── */
const StatBlock = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl font-black text-white tabular-nums tracking-tighter mb-2">
        {count}<span className="text-primary">{suffix}</span>
      </div>
      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  );
};

const Stats = () => (
  <section className="py-24 border-y border-white/[0.05] bg-black/30 relative">
    <div className="absolute inset-0 bg-primary/5 blur-[150px]" />
    <div className="mx-auto max-w-[1200px] px-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-white/[0.05]">
        <StatBlock value={100} suffix="%" label="Foco em Dados" />
        <StatBlock value={0} suffix="s" label="Delay de Sincronia" />
        <StatBlock value={10} suffix="x" label="Mais Clareza" />
        <StatBlock value={24} suffix="/7" label="Disponibilidade" />
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   CTA Aggressive
   ───────────────────────────────────────────────────────────── */
const CTA = () => (
  <section className="py-32 relative overflow-hidden">
    <div className="mx-auto max-w-[1000px] px-6 relative z-10">
      <div className="rounded-[3rem] bg-gradient-to-b from-card to-black border border-white/[0.1] p-12 md:p-20 text-center shadow-[0_0_100px_rgba(108,60,225,0.15)] relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <Sparkles className="h-12 w-12 text-primary-glow mx-auto mb-8 animate-pulse" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-tight">
            Eleve o nível do seu <br className="hidden md:block" />
            serviço de tráfego.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium mb-12">
            Mostre o valor real do seu trabalho. Clientes que entendem os resultados não cancelam contratos.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-black text-lg hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105">
                <Link to="/login">
                  Criar conta gratuita
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Link>
             </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t border-white/[0.05] bg-black py-16">
    <div className="mx-auto max-w-[1200px] px-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <img src={logoKubowebWhite} alt="Kubo Web" className="h-8 w-auto" />
        </div>
        <div className="flex gap-8 text-sm font-bold text-muted-foreground">
          <a href="#features" className="hover:text-white transition-colors">Plataforma</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrações</a>
          <a href="/login" className="hover:text-white transition-colors">Acessar</a>
        </div>
      </div>
      <div className="mt-12 text-center text-xs text-muted-foreground/50 font-bold uppercase tracking-widest border-t border-white/[0.05] pt-8">
        © {new Date().getFullYear()} KUBO WEB PORTAL. TODOS OS DIREITOS RESERVADOS.
      </div>
    </div>
  </footer>
);

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */
const Landing = () => (
  <>
    <Helmet>
      <title>Kubo Web | Portal de Campanhas & Analytics</title>
      <meta name="description" content="Portal de resultados para agências e clientes. Monitore campanhas do Google Ads e Meta Ads em tempo real." />
    </Helmet>
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/40 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Integrations />
        <Features />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  </>
);

export default Landing;
