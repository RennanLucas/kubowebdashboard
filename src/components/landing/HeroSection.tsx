import { ArrowRight, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-[120vh] flex flex-col items-center justify-start pt-40 overflow-hidden bg-black">
      {/* Absolute Backgrounds */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-grid-white opacity-40 pointer-events-none" />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 w-full relative z-10 flex flex-col items-center text-center">
        {/* Headline */}
        <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black tracking-tighter leading-[1.0] mb-8 animate-fade-up">
          <span className="linear-text-gradient">Toda a sua operação de performance.</span>
          <br />
          <span className="primary-text-gradient">Em um único lugar.</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-white/50 font-medium leading-relaxed max-w-3xl mb-12 animate-fade-up" style={{ animationDelay: '100ms' }}>
          Conecte Google Ads, Meta Ads, CRM e seus dados de receita em uma plataforma inteligente criada para agências que precisam de mais controle, escala e resultados.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-fade-up" style={{ animationDelay: '200ms' }}>
          <Button asChild size="lg" className="h-14 px-10 rounded-full bg-primary text-white font-bold text-base hover:bg-primary-glow hover:shadow-[0_0_40px_rgba(108,60,225,0.5)] transition-all">
            <Link to="/login">
              Começar gratuitamente
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-full text-base font-bold text-white border-white/10 glass-panel hover:bg-white/5 transition-all">
            <a href="#features" className="flex items-center">
              Ver a plataforma
            </a>
          </Button>
        </div>

        {/* Dashboard Mockup */}
        <div className="mt-24 w-full relative perspective-[2000px] animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20 h-full w-full pointer-events-none" style={{ bottom: '-10%' }} />
          
          <div className="relative mx-auto w-full max-w-6xl glass-panel rounded-t-[2rem] border-b-0 overflow-hidden shadow-[0_-20px_100px_rgba(108,60,225,0.2)] transform-gpu hover:translate-y-[-10px] transition-transform duration-1000 ease-out">
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
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 bg-gradient-to-b from-transparent to-black/80">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col gap-2">
                {['Visão Geral', 'Google Ads', 'Meta Ads', 'CRM', 'Relatórios'].map((item, i) => (
                  <div key={item} className={`px-4 py-2.5 rounded-lg text-sm font-medium ${i === 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/40'}`}>
                    {item}
                  </div>
                ))}
              </div>
              
              {/* Main Content */}
              <div className="col-span-1 md:col-span-3 flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Receita", val: "R$ 142.590", trend: "+24.5%" },
                    { label: "Investimento", val: "R$ 18.240", trend: "+5.2%" },
                    { label: "ROAS Global", val: "7.8x", trend: "+1.2x" },
                    { label: "CPL", val: "R$ 12,40", trend: "-8.3%" },
                  ].map((metric, i) => (
                    <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                      <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                      <div className="text-2xl font-black text-white">{metric.val}</div>
                      <div className="text-green-400 text-[10px] font-bold mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {metric.trend}</div>
                    </div>
                  ))}
                </div>

                {/* Big Chart Area */}
                <div className="glass-panel h-48 rounded-xl border border-white/5 bg-white/[0.01] p-5 relative overflow-hidden flex items-end">
                  <div className="absolute top-4 left-4 text-xs font-bold text-white/60 uppercase tracking-widest">Performance de Conversões</div>
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
