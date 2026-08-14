import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { 
  ArrowRight, BarChart3, Target, Check, Activity, TrendingUp, 
  Shield, Menu, X, Play, PieChart, Users, ChevronRight, Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";

/* ─────────────────────────────────────────────────────────────
   Animated Counter Hook
   ───────────────────────────────────────────────────────────── */
const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        setCount(Math.round(eased * end));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [end, duration, inView]);

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
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-white/[0.05]" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center z-50">
          <img src={logoKubowebWhite} alt="Kubo Web" className="h-7 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Plataforma", "Integrações", "Agências"].map((label, i) => (
            <a key={label} href={`#${["features", "integrations", "agencies"][i]}`} className="text-[14px] font-semibold text-muted-foreground hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild className="text-[14px] font-semibold text-muted-foreground hover:text-white">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="h-10 px-6 rounded-full font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all">
            <Link to="/login">Acessar Painel</Link>
          </Button>
        </div>

        <button className="md:hidden z-50 p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 pt-24 bg-background/98 backdrop-blur-3xl z-40 flex flex-col px-6"
        >
          <div className="flex flex-col gap-6 mt-8">
            {[["Plataforma", "#features"], ["Integrações", "#integrations"], ["Agências", "#agencies"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-2xl font-bold text-white border-b border-white/[0.05] pb-4">{label}</a>
            ))}
          </div>
          <div className="mt-auto mb-10 flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full h-14 rounded-2xl text-lg border-white/10"><Link to="/login" onClick={() => setMobileOpen(false)}>Fazer Login</Link></Button>
            <Button asChild className="w-full h-14 rounded-2xl bg-white text-black text-lg font-bold"><Link to="/login" onClick={() => setMobileOpen(false)}>Acessar Painel</Link></Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

/* ─────────────────────────────────────────────────────────────
   Hero — Classic SaaS Split Layout
   ───────────────────────────────────────────────────────────── */
const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(258,73%,56%)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[hsl(225,70%,52%)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="mx-auto max-w-[1200px] px-6 w-full relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left: Copy */}
        <motion.div 
          style={{ y: y1, opacity }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start pt-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            V2.0 JÁ ESTÁ DISPONÍVEL
          </motion.div>

          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-tighter leading-[1.05] text-white">
            Domine os dados
            <br />
            das suas <span className="text-primary">campanhas.</span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed max-w-lg">
            O painel de performance definitivo para agências e clientes. Google Ads, Meta Ads e métricas de conversão em um único lugar, atualizados em tempo real.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 w-full">
            <Button asChild size="lg" className="h-14 px-8 rounded-full bg-white text-black font-black text-base hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              <Link to="/login">
                Acessar meu painel
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-bold border-white/20 hover:bg-white/5 transition-all">
              <a href="#features" className="flex items-center">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Ver como funciona
              </a>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm font-semibold text-muted-foreground/60">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Setup em minutos</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Integração nativa</span>
          </div>
        </motion.div>

        {/* Right: Mockup Dashboard */}
        <motion.div 
          initial={{ opacity: 0, x: 50, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative lg:-mr-20 perspective-[1000px]"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
          
          <motion.div 
            whileHover={{ rotateX: 2, rotateY: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative rounded-2xl border border-white/10 bg-card/60 backdrop-blur-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="font-bold text-xs tracking-wider text-muted-foreground uppercase">Visão Geral</span>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Custo (30 dias)", val: "R$ 14.592", trend: "+12%" },
                  { label: "Conversões", val: "842", trend: "+24%", color: "text-green-400" },
                  { label: "Custo por Lead", val: "R$ 17,33", trend: "-11%", color: "text-green-400" },
                  { label: "ROAS (Est)", val: "4.2x", trend: "+0.8x", color: "text-primary" },
                ].map((k) => (
                  <div key={k.label} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{k.label}</div>
                    <div className="text-2xl font-black text-white tabular-nums">{k.val}</div>
                    <div className={`text-xs font-bold mt-1 ${k.color || 'text-white/60'}`}>{k.trend}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="h-32 rounded-lg bg-black/40 border border-white/5 relative overflow-hidden flex items-end">
                <div className="absolute top-3 left-4 text-xs font-bold text-white">Desempenho</div>
                <svg className="w-full h-24" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,40 L0,20 C10,15 20,25 30,10 C40,-5 50,20 60,15 C70,10 80,5 90,0 L100,0 L100,40 Z" fill="url(#chart)" />
                  <path d="M0,20 C10,15 20,25 30,10 C40,-5 50,20 60,15 C70,10 80,5 90,0 L100,0" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────
   Features Section (List style, clean)
   ───────────────────────────────────────────────────────────── */
const FeatureItem = ({ icon: Icon, title, desc, delay }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="flex gap-6 items-start"
    >
      <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-muted-foreground text-[15px] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

const Features = () => (
  <section id="features" className="py-32 bg-black/40 border-y border-white/[0.02]">
    <div className="mx-auto max-w-[1200px] px-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mb-20"
      >
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">
          Esqueça as planilhas complexas. <br/>
          <span className="text-muted-foreground">Foque apenas nos resultados.</span>
        </h2>
        <p className="text-lg text-muted-foreground font-medium">
          Centralizamos Google Ads, Meta Ads e conversões do seu site em um único painel. Pare de perder horas cruzando dados no Excel e comece a ver onde o dinheiro está realmente dando retorno.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        <FeatureItem 
          delay={0.1} icon={Activity} 
          title="Métricas em Tempo Real" 
          desc="Custo por Lead (CPL), Retorno sobre Investimento (ROAS) e Cliques atualizados instantaneamente. Não espere 24h para pausar uma campanha ruim."
        />
        <FeatureItem 
          delay={0.2} icon={PieChart} 
          title="Painel Unificado" 
          desc="Seus clientes não precisam de acessos complexos. Envie um único link onde eles podem ver todas as campanhas de todas as redes em um visual de tirar o fôlego."
        />
        <FeatureItem 
          delay={0.3} icon={Target} 
          title="Metas e Conversões" 
          desc="Defina as metas da semana ou mês e veja a barra de progresso encher conforme os leads chegam. Transparência total para o seu trabalho."
        />
        <FeatureItem 
          delay={0.4} icon={Shield} 
          title="White-label Completo" 
          desc="Agências amam: coloque o seu logo, suas cores institucionais e o seu domínio personalizado. O portal passa a ser um produto exclusivo da sua agência."
        />
      </div>

    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Stats / Numbers
   ───────────────────────────────────────────────────────────── */
const StatBlock = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl md:text-6xl font-black text-white tabular-nums tracking-tighter mb-2">
        {count}<span className="text-primary">{suffix}</span>
      </div>
      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  );
};

const Stats = () => (
  <section className="py-24 relative overflow-hidden">
    <div className="absolute inset-0 bg-primary/5 blur-[150px] pointer-events-none" />
    <div className="mx-auto max-w-[1200px] px-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-white/5 border border-white/5 bg-white/[0.02] rounded-3xl"
      >
        <StatBlock value={100} suffix="%" label="Foco em Dados" />
        <StatBlock value={0} suffix="s" label="Delay de Dados" />
        <StatBlock value={10} suffix="x" label="Mais Clareza" />
        <StatBlock value={24} suffix="/7" label="Disponibilidade" />
      </motion.div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   CTA
   ───────────────────────────────────────────────────────────── */
const CTA = () => (
  <section className="py-32 border-t border-white/[0.02]">
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="mx-auto max-w-[900px] px-6 text-center"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 text-primary mb-8 shadow-[0_0_50px_hsl(var(--primary)/0.5)]">
        <Zap className="w-10 h-10" />
      </div>
      
      <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
        Aumente o nível do seu tráfego pago hoje.
      </h2>
      
      <p className="text-xl text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
        Mostre o valor real do seu trabalho de forma clara e visual. Impressione clientes e escale sua agência.
      </p>
      
      <Button asChild size="lg" className="h-16 px-12 rounded-full bg-white text-black font-black text-lg hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
        <Link to="/login">
          Criar minha conta agora
          <ArrowRight className="ml-3 w-6 h-6" />
        </Link>
      </Button>
    </motion.div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t border-white/5 bg-black py-16">
    <div className="mx-auto max-w-[1200px] px-6 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-3">
        <img src={logoKubowebWhite} alt="Kubo Web" className="h-6 w-auto opacity-70" />
      </div>
      <div className="flex gap-8 text-sm font-bold text-muted-foreground">
        <a href="#features" className="hover:text-white transition-colors">Plataforma</a>
        <Link to="/login" className="hover:text-white transition-colors">Fazer Login</Link>
      </div>
    </div>
    <div className="mx-auto max-w-[1200px] px-6 mt-12 text-center md:text-left text-xs text-muted-foreground/40 font-bold uppercase tracking-widest pt-8 border-t border-white/5">
      © {new Date().getFullYear()} KUBO WEB PORTAL. TODOS OS DIREITOS RESERVADOS.
    </div>
  </footer>
);

/* ─────────────────────────────────────────────────────────────
   Landing Page Root
   ───────────────────────────────────────────────────────────── */
const Landing = () => {
  return (
    <>
      <Helmet>
        <title>Kubo Web | Painel de Alta Performance</title>
        <meta name="description" content="Acompanhe todas as suas campanhas de tráfego pago em um único lugar." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/40 selection:text-white font-sans">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Stats />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Landing;
