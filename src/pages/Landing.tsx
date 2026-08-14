import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowRight, Activity, Shield, PieChart, Target, Play, 
  ChevronRight, Sparkles, BarChart3, LineChart, Globe, Zap, Users, TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";

/* ─────────────────────────────────────────────────────────────
   Premium CSS & Animations (Injected dynamically)
   ───────────────────────────────────────────────────────────── */
const PremiumStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .bg-grid-white {
      background-size: 40px 40px;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    }
    
    .linear-text-gradient {
      background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.5) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    .primary-text-gradient {
      background: linear-gradient(90deg, hsl(var(--primary)) 0%, #B28DFF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    .glass-panel {
      background: rgba(10, 10, 10, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
    }

    .premium-hover {
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .premium-hover:hover {
      transform: translateY(-5px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 40px -10px rgba(108, 60, 225, 0.3);
      background: rgba(255, 255, 255, 0.03);
    }

    .animate-float-slow {
      animation: floatSlow 8s ease-in-out infinite;
    }
    .animate-float-fast {
      animation: floatFast 5s ease-in-out infinite;
    }

    @keyframes floatSlow {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(2deg); }
    }
    @keyframes floatFast {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(-1deg); }
    }

    .reveal-scroll {
      opacity: 0;
      transform: translateY(40px);
      transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal-scroll.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `}} />
);

/* ─────────────────────────────────────────────────────────────
   Intersection Observer Hook 
   ───────────────────────────────────────────────────────────── */
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

/* ─────────────────────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      scrolled ? "glass-panel py-3" : "bg-transparent py-6"
    }`}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center z-50">
          <img src={logoKubowebWhite} alt="Kubo Web" className="h-6 sm:h-7 w-auto hover:opacity-80 transition-opacity" />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {["Visão Geral", "Recursos", "Integrações"].map((label, i) => (
            <a key={label} href={`#${["hero", "features", "integrations"][i]}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex text-sm font-medium text-white/60 hover:text-white hover:bg-white/5">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="h-10 px-6 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Link to="/login">Acessar Painel</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

/* ─────────────────────────────────────────────────────────────
   Ultra-Premium Hero Section (Linear / Vercel style)
   ───────────────────────────────────────────────────────────── */
const Hero = () => {
  return (
    <section id="hero" className="relative min-h-[120vh] flex flex-col items-center justify-start pt-40 overflow-hidden bg-black">
      {/* Absolute Backgrounds */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-grid-white opacity-40 pointer-events-none" />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 w-full relative z-10 flex flex-col items-center text-center">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-2 text-xs font-bold text-primary mb-10 animate-fade-in shadow-[0_0_20px_rgba(108,60,225,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          NOVO PORTAL KUBO WEB 2.0
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-black tracking-tighter leading-[1.0] mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <span className="linear-text-gradient">O motor de tração das</span>
          <br />
          <span className="primary-text-gradient">suas campanhas.</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-white/50 font-medium leading-relaxed max-w-2xl mb-12 animate-fade-up" style={{ animationDelay: '200ms' }}>
          Projetado para agências de alta performance e clientes exigentes. 
          Unifique Google Ads e Meta Ads em um painel absoluto, com métricas precisas e tempo real.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Button asChild size="lg" className="h-14 px-10 rounded-full bg-primary text-white font-bold text-base hover:bg-primary-glow hover:shadow-[0_0_40px_rgba(108,60,225,0.5)] transition-all">
            <Link to="/login">
              Acessar Painel Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-full text-base font-bold text-white border-white/10 glass-panel hover:bg-white/5 transition-all">
            <a href="#features" className="flex items-center">
              Explorar Plataforma
            </a>
          </Button>
        </div>

        {/* The "Wow" Dashboard Mockup */}
        <div className="mt-24 w-full relative perspective-[2000px] animate-fade-up" style={{ animationDelay: '500ms' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20 h-full w-full pointer-events-none" style={{ bottom: '-10%' }} />
          
          <div className="relative mx-auto w-full max-w-6xl glass-panel rounded-t-[2rem] border-b-0 overflow-hidden shadow-[0_-20px_100px_rgba(108,60,225,0.2)] transform-gpu hover:translate-y-[-10px] transition-transform duration-1000 ease-out">
            {/* Mockup Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-white/[0.02]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="mx-auto flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-md border border-white/5">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-mono text-white/50">app.kuboweb.com.br</span>
              </div>
            </div>
            
            {/* Mockup Body */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-b from-transparent to-black/80">
              {/* Left Sidebar */}
              <div className="hidden md:flex flex-col gap-2">
                {['Visão Geral', 'Google Ads', 'Meta Ads', 'Relatórios', 'Configurações'].map((item, i) => (
                  <div key={item} className={`px-4 py-2.5 rounded-lg text-sm font-medium ${i === 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/40'}`}>
                    {item}
                  </div>
                ))}
              </div>
              
              {/* Main Content */}
              <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* KPI Card */}
                  <div className="glass-panel p-5 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">ROAS Global</div>
                    <div className="text-3xl font-black text-white">4.8x</div>
                    <div className="text-green-400 text-xs font-bold mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12.5%</div>
                  </div>
                  <div className="glass-panel p-5 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Custo por Lead</div>
                    <div className="text-3xl font-black text-white">R$ 14,20</div>
                    <div className="text-green-400 text-xs font-bold mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> -8.3%</div>
                  </div>
                </div>

                {/* Big Chart Area */}
                <div className="glass-panel h-48 rounded-xl border border-white/5 bg-white/[0.01] p-5 relative overflow-hidden flex items-end">
                  <div className="absolute top-4 left-4 text-xs font-bold text-white/60 uppercase tracking-widest">Desempenho de Conversões</div>
                  <svg className="w-full h-32" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="premiumChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,40 L0,25 C15,10 25,30 40,15 C55,0 70,25 85,10 C95,0 100,10 100,10 L100,40 Z" fill="url(#premiumChart)" />
                    <path d="M0,25 C15,10 25,30 40,15 C55,0 70,25 85,10 C95,0 100,10 100,10" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" className="drop-shadow-[0_0_8px_rgba(108,60,225,1)]" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────
   Features — Premium Bento Grid
   ───────────────────────────────────────────────────────────── */
const Features = () => {
  return (
    <section id="features" className="py-40 bg-black relative">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="mb-24 text-center max-w-3xl mx-auto reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 linear-text-gradient">
            Tudo o que você precisa. <br/>Sem a complexidade que você odeia.
          </h2>
          <p className="text-lg text-white/50 font-medium">
            Esqueça PDFs estáticos e planilhas confusas. Entregue valor real com um portal interativo, rápido e focado 100% no ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Large Feature 1 */}
          <div className="md:col-span-2 glass-panel p-10 rounded-[2rem] premium-hover reveal-scroll relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-8 shadow-inner">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Unificação de Plataformas</h3>
              <p className="text-white/50 text-lg max-w-md leading-relaxed">
                Google Ads, Meta Ads e o seu CRM trabalhando juntos. Chega de somar números manualmente para descobrir o custo real de aquisição.
              </p>
            </div>
          </div>

          {/* Small Feature 1 */}
          <div className="glass-panel p-10 rounded-[2rem] premium-hover reveal-scroll relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-green-500/10 rounded-full blur-[60px] group-hover:bg-green-500/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 mb-8">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Tempo Real</h3>
              <p className="text-white/50 leading-relaxed">
                Dados processados instantaneamente. Tome decisões antes que o orçamento seja gasto.
              </p>
            </div>
          </div>

          {/* Small Feature 2 */}
          <div className="glass-panel p-10 rounded-[2rem] premium-hover reveal-scroll relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mb-8">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">White-label</h3>
              <p className="text-white/50 leading-relaxed">
                Sua marca, seu domínio. Entregue um produto premium com o logo da sua agência.
              </p>
            </div>
          </div>

          {/* Large Feature 2 */}
          <div className="md:col-span-2 glass-panel p-10 rounded-[2rem] premium-hover reveal-scroll relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-8">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Foco Exclusivo em ROAS</h3>
                <p className="text-white/50 text-lg leading-relaxed">
                  Chega de métricas de vaidade. O painel destaca exclusivamente o que importa: Investimento vs Retorno Financeiro.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────
   Premium CTA 
   ───────────────────────────────────────────────────────────── */
const CTA = () => {
  return (
    <section className="py-40 relative bg-black overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,60,225,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="mx-auto max-w-4xl px-6 relative z-10 text-center reveal-scroll">
        <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-10 shadow-[0_0_80px_rgba(108,60,225,0.6)] animate-pulse">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 linear-text-gradient">
          Pronto para escalar?
        </h2>
        
        <p className="text-xl text-white/50 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          Junte-se às agências e empresas que estão mudando a forma de analisar tráfego pago. Acesso instantâneo, setup em 5 minutos.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Button asChild size="lg" className="h-16 px-12 rounded-full bg-white text-black font-black text-lg hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <Link to="/login">
              Começar Gratuitamente
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="bg-black py-12 border-t border-white/5">
    <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <img src={logoKubowebWhite} alt="Kubo Web" className="h-5 w-auto opacity-50" />
      <div className="text-xs font-bold text-white/30 uppercase tracking-widest">
        © {new Date().getFullYear()} Kubo Web. Premium Analytics.
      </div>
    </div>
  </footer>
);

/* ─────────────────────────────────────────────────────────────
   Main Landing Component
   ───────────────────────────────────────────────────────────── */
const Landing = () => {
  useScrollReveal();

  return (
    <>
      <Helmet>
        <title>Kubo Web | Analytics Premium</title>
        <meta name="description" content="O hub central para agências e clientes." />
      </Helmet>
      
      {/* Inject our premium CSS safely */}
      <PremiumStyles />

      <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-primary/40 selection:text-white">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Landing;
