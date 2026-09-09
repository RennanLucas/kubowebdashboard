import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Pricing = () => {
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
    <section ref={sectionRef} className="py-24 bg-black relative" id="pricing">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black to-black pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Planos <span className="linear-text-gradient">Simples e Transparentes</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Comece de graça e faça o upgrade quando precisar de mais poder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          
          {/* Free Plan */}
          <div className="reveal-scroll scale-in glass-panel rounded-3xl p-8 border border-white/10 bg-[#080c13]/80">
            <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
            <p className="text-gray-400 mb-6">Para quem está começando</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">R$ 0</span>
              <span className="text-gray-400">/mês</span>
            </div>

            <Link to="/login" className="block w-full mb-8">
              <Button variant="outline" className="w-full py-6 text-lg rounded-xl border-white/20 text-white hover:bg-white/10">
                Começar grátis
              </Button>
            </Link>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>1 projeto</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Histórico de 7 dias</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Painel completo</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Script de rastreamento</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Alertas básicos</span>
              </li>
              
              {/* Not included */}
              <li className="flex items-center gap-3 text-gray-500 pt-4 border-t border-white/5">
                <X className="w-5 h-5 shrink-0" />
                <span>Sem visitantes em tempo real</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <X className="w-5 h-5 shrink-0" />
                <span>Sem IA</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <X className="w-5 h-5 shrink-0" />
                <span>Sem heatmaps</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <X className="w-5 h-5 shrink-0" />
                <span>Sem relatórios PDF/Excel</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="reveal-scroll scale-in md:scale-105 glass-panel rounded-3xl p-8 border border-primary relative bg-[#080c13] shadow-[0_0_40px_rgba(108,60,225,0.2)]">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
              MAIS ESCOLHIDO
            </div>

            <h3 className="text-2xl font-bold text-primary-100 mb-2">Pro</h3>
            <p className="text-gray-400 mb-6">Para quem quer resultados</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">R$ 49,90</span>
              <span className="text-gray-400">/mês</span>
            </div>

            <Link to="/login" className="block w-full mb-8">
              <Button className="w-full py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white font-medium hover:shadow-[0_0_20px_rgba(108,60,225,0.4)] transition-all">
                Assinar Pro
              </Button>
            </Link>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span className="font-medium">Projetos ilimitados</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>Histórico de 365 dias</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>Visitantes em tempo real</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>Kubo AI semanal</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>Mapas de calor</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>Relatórios PDF e Excel</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                <span>White-label</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pricing;
