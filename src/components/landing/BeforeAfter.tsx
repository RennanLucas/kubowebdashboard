import React, { useEffect, useRef } from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';

const beforeItems = [
  "Google Analytics confuso",
  "Dados com 48h de atraso",
  "Sem rastreamento de WhatsApp",
  "Relatórios manuais em planilha",
  "Script pesado que trava o site",
  "Sem visão de conversões reais"
];

const afterItems = [
  "Painel intuitivo e limpo",
  "Dados em tempo real",
  "WhatsApp rastreado automaticamente",
  "Relatórios PDF em 1 clique",
  "Script de 2KB, PageSpeed 100",
  "Funil completo de conversão"
];

const BeforeAfter = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.reveal-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative bg-[#080c13]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Por que mudar para o <span className="linear-text-gradient">Kubo?</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Diga adeus à complexidade das ferramentas tradicionais e tenha clareza sobre o que realmente acontece no seu site.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Before */}
          <div className="reveal-scroll slide-in-left glass-panel p-8 rounded-3xl border border-red-500/20 bg-red-950/10">
            <h3 className="text-2xl font-bold text-red-400 mb-8 flex items-center justify-center gap-3">
              <XCircle className="w-8 h-8" />
              Ferramentas Antigas
            </h3>
            
            <ul className="space-y-6">
              {beforeItems.map((item, index) => (
                <li key={index} className="flex items-center gap-4 text-gray-400">
                  <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="reveal-scroll slide-in-right glass-panel p-8 rounded-3xl border border-primary/30 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center justify-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              Com o Kubo
            </h3>
            
            <ul className="space-y-6 relative z-10">
              {afterItems.map((item, index) => (
                <li key={index} className="flex items-center gap-4 text-white">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;
