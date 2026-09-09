import React, { useEffect, useRef } from 'react';
import { UserPlus, Code2, LineChart, Target } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastre-se gratuitamente em menos de 1 minuto."
  },
  {
    icon: Code2,
    title: "Cole o script",
    description: "Adicione uma única linha de código ao seu site."
  },
  {
    icon: LineChart,
    title: "Veja seus dados",
    description: "Em segundos, visitantes e conversões começam a aparecer."
  },
  {
    icon: Target,
    title: "Tome decisões",
    description: "Use os insights do Kubo AI para otimizar seu site."
  }
];

const HowItWorks = () => {
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
    <section ref={sectionRef} className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 reveal-scroll fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Como <span className="linear-text-gradient">funciona</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Configuração rápida e sem complicação. Comece a rastrear em poucos minutos.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative max-w-6xl mx-auto">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 -z-10" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const delayClass = `fade-up-delay-${index + 1}`;
            
            return (
              <div key={index} className={`reveal-scroll fade-up ${delayClass} relative flex flex-col items-center text-center group`}>
                <div className="w-24 h-24 rounded-full bg-[#080c13] border border-white/10 flex items-center justify-center mb-6 relative group-hover:border-primary/50 transition-colors duration-300 z-10 glass-panel shadow-lg">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Icon className="w-10 h-10 text-primary relative z-10" />
                  
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-4 border-black">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
