import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

const comparisonData = [
  { feature: "Setup inicial", ga: "GTM + dataLayer + eventos", kubo: "Uma linha de código" },
  { feature: "Dados e relatórios", ga: "Atrasados 24-48h", kubo: "Tempo real instantâneo" },
  { feature: "WhatsApp tracking", ga: "Manual e complexo", kubo: "Automático (0 config)" },
  { feature: "Exportar relatórios (PDF)", ga: "Não possui nativo", kubo: "Em 1 clique com logo" },
  { feature: "Peso do script", ga: "~45KB (gtag.js pesada)", kubo: "~2KB (ultraleve)" },
  { feature: "Impacto no PageSpeed", ga: "Alto (atrasa LCP)", kubo: "Mínimo" },
  { feature: "Inteligência Artificial", ga: "Não possui", kubo: "Insights semanais automáticos" },
  { feature: "Privacidade (LGPD)", ga: "Cookies (exige banner)", kubo: "Sem cookies invasivos" },
  { feature: "Preço", ga: "\"Grátis\" (pagando com seus dados)", kubo: "Grátis de verdade (plano base)" },
];

export default function ComparisonSection() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });
    
    const elements = document.querySelectorAll('.reveal-scroll');
    elements.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 px-4 md:px-6 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Por que agências estão <br/>
            <span className="primary-text-gradient">migrando do GA4.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comparação direta entre o que você enfrenta hoje e o que o Kubo oferece.
          </p>
        </div>

        <div className="reveal-scroll fade-up overflow-x-auto pb-6">
          <div className="min-w-[700px] glass-panel rounded-2xl border border-white/10 overflow-hidden bg-black/50">
            {/* Header */}
            <div className="grid grid-cols-3 bg-white/5 border-b border-white/10 p-6">
              <div className="font-semibold text-gray-400 text-lg">Recurso</div>
              <div className="font-semibold text-gray-400 text-lg text-center">Google Analytics</div>
              <div className="font-bold text-white text-lg text-center flex items-center justify-center gap-2">
                <span className="primary-text-gradient">Kubo Web</span>
                <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] uppercase rounded-full border border-primary/30">Vencedor</span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {comparisonData.map((row, idx) => (
                <div 
                  key={idx} 
                  className={`grid grid-cols-3 p-4 md:p-6 hover:bg-white/[0.02] transition-colors reveal-scroll fade-up-delay-${(idx % 5) + 1}`}
                >
                  <div className="flex items-center text-gray-300 font-medium">
                    {row.feature}
                  </div>
                  
                  <div className="flex items-center justify-center text-center px-4 text-gray-500 gap-2">
                    <X size={16} className="text-red-500/70 shrink-0" />
                    <span className="text-sm">{row.ga}</span>
                  </div>
                  
                  <div className="flex items-center justify-center text-center px-4 bg-primary/[0.03] rounded-lg border border-primary/10 py-2 gap-2 text-white font-medium glow-pulse relative">
                    <Check size={18} className="text-primary shrink-0" />
                    <span className="text-sm">{row.kubo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center reveal-scroll fade-up">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-full text-lg transition-all shadow-[0_0_20px_rgba(108,60,225,0.4)] hover:shadow-[0_0_30px_rgba(108,60,225,0.6)] transform hover:-translate-y-1">
            Mudar para o Kubo Agora
          </button>
        </div>
      </div>
    </section>
  );
}
