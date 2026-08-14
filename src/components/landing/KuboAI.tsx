import { BrainCircuit, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

export const KuboAI = () => {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Copy */}
        <div className="flex-1 reveal-scroll">
          <div className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-bold text-primary mb-6">
            <BrainCircuit className="h-4 w-4" /> KUBO AI
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white leading-tight">
            Seus dados agora <br/><span className="primary-text-gradient">pensam junto com você.</span>
          </h2>
          <p className="text-lg text-white/50 font-medium mb-8 leading-relaxed">
            O Kubo AI analisa sua operação 24/7, identifica tendências ocultas e transforma montanhas de dados em decisões claras e acionáveis.
          </p>
          
          <ul className="space-y-4 text-white/60 font-medium">
            <li className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /> Análise preditiva de orçamento</li>
            <li className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /> Alertas de anomalia em campanhas</li>
            <li className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /> Recomendações de otimização de ROAS</li>
          </ul>
        </div>

        {/* Right Interactive Mockup */}
        <div className="flex-1 w-full relative reveal-scroll">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="glass-panel p-8 rounded-3xl border border-white/10 relative z-10 space-y-6">
            
            {/* Insight Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Insight detectado</h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    O CPL da campanha "Leads SP" caiu <strong className="text-green-400">23%</strong> nos últimos 7 dias, enquanto a taxa de conversão aumentou <strong className="text-green-400">14%</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendation Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Recomendação</h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Considere realocar 15% do orçamento das campanhas com menor eficiência para escalar esse resultado.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
                    Aplicar recomendação
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
