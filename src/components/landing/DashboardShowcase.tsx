import { BarChart3, TrendingUp } from "lucide-react";

export const DashboardShowcase = () => {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20 reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 linear-text-gradient">
            Veja o que realmente está acontecendo com seu marketing.
          </h2>
          <p className="text-lg text-white/50 font-medium">
            Todas as métricas importantes, organizadas em uma visão clara e acionável.
          </p>
        </div>

        {/* Dashboard Mockup - Massive Full Width */}
        <div className="w-full glass-panel rounded-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden reveal-scroll">
          {/* Header */}
          <div className="h-16 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-white/60 text-sm font-semibold">
                <BarChart3 className="w-4 h-4" />
                Painel de Performance Geral
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-md bg-white/5 text-xs text-white/60 font-medium border border-white/5">
                Últimos 30 dias
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: "Receita", val: "R$ 84.250", trend: "+14.2%" },
                { label: "Investimento", val: "R$ 12.480", trend: "+2.1%" },
                { label: "ROAS", val: "6,75x", trend: "+0.8x", highlight: true },
                { label: "Conversões", val: "428", trend: "+12%" },
                { label: "CAC", val: "R$ 29,16", trend: "-5.4%" },
                { label: "CPL", val: "R$ 12,40", trend: "-8.1%" }
              ].map((metric, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${metric.highlight ? 'bg-primary/10 border-primary/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${metric.highlight ? 'text-primary' : 'text-white/40'}`}>
                    {metric.label}
                  </div>
                  <div className="text-2xl font-black text-white">{metric.val}</div>
                  <div className="text-green-400 text-[10px] font-bold mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3"/> {metric.trend}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Graph Area */}
            <div className="w-full h-80 bg-white/[0.01] rounded-2xl border border-white/5 p-6 relative flex flex-col">
              <div className="text-sm font-bold text-white mb-6">Evolução de Receita vs Investimento</div>
              <div className="flex-1 flex items-end relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <path d="M0,20 L1000,20 M0,80 L1000,80 M0,140 L1000,140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  
                  {/* Revenue Line (Primary) */}
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,150 L0,100 C 100,80 200,120 300,70 C 400,20 500,80 600,40 C 700,0 800,50 900,10 L1000,30 L1000,150 Z" fill="url(#revGrad)" vectorEffect="non-scaling-stroke" />
                  <path d="M0,100 C 100,80 200,120 300,70 C 400,20 500,80 600,40 C 700,0 800,50 900,10 L1000,30" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  
                  {/* Ad Spend Line (Muted) */}
                  <path d="M0,130 C 100,120 200,130 300,125 C 400,110 500,120 600,115 C 700,100 800,110 900,105 L1000,100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
            
            <p className="text-center text-xs text-white/30 mt-6 font-medium">*Dados meramente demonstrativos</p>
          </div>
        </div>

      </div>
    </section>
  );
};
