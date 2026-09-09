import React, { useEffect } from 'react';
import { Activity, MousePointerClick, BarChart3, Flame, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: "Visitantes em tempo real",
    desc: "Veja quem está no seu site agora. Sem delay, sem amostragem. Monitore o pico de tráfego instantaneamente."
  },
  {
    icon: MousePointerClick,
    title: "Conversões de WhatsApp",
    desc: "Rastreie automaticamente cada clique no botão de WhatsApp do seu site. Saiba exatamente quais campanhas geram leads."
  },
  {
    icon: BarChart3,
    title: "Relatórios profissionais",
    desc: "Exporte PDF e Excel com a identidade visual do seu cliente em um clique. Acabe com as horas montando apresentações."
  },
  {
    icon: Flame,
    title: "Mapa de calor por horário",
    desc: "Descubra em quais horários seu site recebe mais visitas e conversões para otimizar os lances das suas campanhas."
  },
  {
    icon: Shield,
    title: "Conformidade LGPD",
    desc: "Script ultraleve de apenas 2KB sem cookies invasivos. Não exige banners de consentimento complexos que derrubam a conversão."
  },
  {
    icon: Sparkles,
    title: "Kubo AI Insights",
    desc: "Receba análises semanais automáticas com recomendações baseadas nos seus dados reais para melhorar os resultados."
  }
];

export default function FeaturesGrid() {
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
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Tudo que você precisa para <br/>
            <span className="primary-text-gradient">analisar e converter</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Recursos projetados para agências e profissionais de performance que não têm tempo a perder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, idx) => {
            const delayClass = `fade-up-delay-${(idx % 5) + 1}`;
            return (
              <div 
                key={idx} 
                className={`glass-panel premium-hover p-8 rounded-2xl border border-white/5 bg-white/[0.02] reveal-scroll ${delayClass} group`}
              >
                <div className="w-14 h-14 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center mb-6 border border-white/10 group-hover:border-primary/50 text-gray-400 group-hover:text-primary">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
