import { SplitSquareHorizontal, FileClock, EyeOff, Activity, Link2, Zap } from "lucide-react";

export const ProblemSolution = () => {
  return (
    <section className="py-32 bg-black relative">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Problem Section */}
        <div className="mb-40">
          <div className="max-w-3xl mb-16 reveal-scroll">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-white">
              Pare de administrar campanhas em dezenas de lugares.
            </h2>
            <p className="text-lg text-white/50 font-medium">
              Planilhas, PDFs, dashboards desconectados e dados espalhados tornam decisões simples desnecessariamente complicadas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: SplitSquareHorizontal, title: "Dados fragmentados", desc: "Cada plataforma mostra apenas uma parte da operação." },
              { icon: FileClock, title: "Relatórios manuais", desc: "Horas gastas consolidando informações para apresentar resultados." },
              { icon: EyeOff, title: "Decisões sem contexto", desc: "Você vê métricas, mas não enxerga o impacto real no negócio." }
            ].map((item, i) => (
              <div key={i} className="glass-panel p-8 rounded-[1.5rem] border border-white/5 reveal-scroll premium-hover">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 mb-6">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/50 text-[15px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution Section */}
        <div className="relative pt-20 border-t border-white/5 reveal-scroll">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 linear-text-gradient">
              O Kubo Web conecta tudo.
            </h2>
            <p className="text-lg text-white/50 font-medium">
              Uma visão centralizada da sua operação de marketing, performance e receita.
            </p>
          </div>

          {/* Visual Connection Graphic */}
          <div className="relative max-w-4xl mx-auto h-64 md:h-96 flex items-center justify-center glass-panel rounded-3xl overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,60,225,0.1)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="relative z-10 w-full px-10 flex flex-col items-center justify-center">
              
              <div className="flex justify-between w-full mb-12 relative">
                {/* Connecting Lines SVG */}
                <svg className="absolute inset-0 w-full h-full -z-10 opacity-30" preserveAspectRatio="none">
                  <path d="M 50 10 Q 300 100 450 150" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
                  <path d="M 850 10 Q 600 100 450 150" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
                </svg>

                <div className="flex flex-col gap-4">
                  <div className="glass-panel px-6 py-3 rounded-full text-sm font-bold text-white border border-white/10 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Meta Ads
                  </div>
                  <div className="glass-panel px-6 py-3 rounded-full text-sm font-bold text-white border border-white/10 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-400" /> Google Ads
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="glass-panel px-6 py-3 rounded-full text-sm font-bold text-white border border-white/10 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" /> CRM
                  </div>
                  <div className="glass-panel px-6 py-3 rounded-full text-sm font-bold text-white border border-white/10 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" /> Receita
                  </div>
                </div>
              </div>

              {/* Central Hub */}
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(108,60,225,0.6)] relative z-20">
                <Zap className="w-8 h-8 text-white" />
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
