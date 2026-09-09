import React, { useEffect, useRef } from 'react';
import { AlertCircle, Clock, Smartphone, Settings, LayoutDashboard, Zap, MessageCircle, Code } from 'lucide-react';

const problems = [
  { icon: AlertCircle, title: "Interface confusa", desc: "O GA4 mudou tudo e os relatórios estão cada vez mais difíceis de entender." },
  { icon: Clock, title: "Dados atrasados", desc: "Precisa esperar de 24h a 48h para ver os resultados da sua campanha de hoje." },
  { icon: Smartphone, title: "Sem WhatsApp", desc: "Não rastreia cliques no botão de WhatsApp sem configurações complexas." },
  { icon: Settings, title: "Setup técnico pesado", desc: "GTM, dataLayer, eventos customizados. Uma dor de cabeça para configurar." },
];

const solutions = [
  { icon: LayoutDashboard, title: "Painel intuitivo", desc: "Tudo que importa em uma única tela, fácil de entender para você e seu cliente." },
  { icon: Zap, title: "Dados em tempo real", desc: "Veja quem está no seu site agora e acompanhe as conversões no mesmo segundo." },
  { icon: MessageCircle, title: "WhatsApp nativo", desc: "Rastreie automaticamente cada clique no WhatsApp, sem configurar nada." },
  { icon: Code, title: "Uma linha de código", desc: "Copie, cole na tag <head> do site e pronto. O Kubo faz o resto por você." },
];

export default function ProblemSolution() {
  const sectionRef = useRef<HTMLDivElement>(null);

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
    <section className="py-24 px-4 md:px-6 relative overflow-hidden" ref={sectionRef}>
      <div className="max-w-6xl mx-auto">
        {/* Problems */}
        <div className="mb-20">
          <div className="text-center mb-12 reveal-scroll fade-up">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O Google Analytics ficou <span className="text-red-500">complicado demais.</span>
            </h2>
            <p className="text-xl text-gray-400">A ferramenta que deveria ajudar, virou um problema.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((item, idx) => (
              <div key={idx} className={`glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-950/10 reveal-scroll fade-up-delay-${(idx % 5) + 1}`}>
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-center mb-20 reveal-scroll scale-in">
          <div className="h-24 w-px bg-gradient-to-b from-red-500/50 via-purple-500/50 to-primary/80 section-divider"></div>
        </div>

        {/* Solutions */}
        <div>
          <div className="text-center mb-12 reveal-scroll fade-up">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O Kubo resolve isso em <span className="primary-text-gradient">2 minutos.</span>
            </h2>
            <p className="text-xl text-gray-400">Simples, rápido e feito para conversão.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((item, idx) => (
              <div key={idx} className={`glass-panel p-6 rounded-2xl border border-primary/20 bg-primary/5 premium-hover reveal-scroll fade-up-delay-${(idx % 5) + 1}`}>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary glow-pulse">
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
