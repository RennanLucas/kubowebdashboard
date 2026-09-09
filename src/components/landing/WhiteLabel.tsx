import React, { useEffect, useRef } from 'react';
import { Palette, Link as LinkIcon, Download, Ghost, Box, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const features = [
  { icon: Palette, text: 'Logo personalizado' },
  { icon: LinkIcon, text: 'Domínio próprio' },
  { icon: PenTool, text: 'Cores da marca' },
  { icon: Download, text: 'Relatórios com sua identidade' },
  { icon: Box, text: 'Favicon exclusivo' },
  { icon: Ghost, text: 'Sem menção ao Kubo' }
];

const WhiteLabel = () => {
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
    <section ref={sectionRef} className="py-24 relative bg-black overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1 reveal-scroll slide-in-left">
            <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-[#1a1f2c] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex-1 bg-black/50 rounded-md py-1.5 px-3 flex items-center justify-center border border-white/5">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    app.suaagencia.com.br
                  </span>
                </div>
              </div>
              <div className="p-8 bg-[#080c13] relative">
                <div className="absolute top-8 left-8 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center animate-pulse">
                  <span className="text-white/50 text-xs font-bold">LOGO</span>
                </div>
                
                <div className="mt-20 space-y-4">
                  <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 reveal-scroll slide-in-right">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Sua agência, <span className="primary-text-gradient">sua plataforma.</span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Apresente o Kubo como sua própria plataforma para seus clientes. Entregue relatórios incríveis e um painel de analytics completo com a identidade da sua agência.
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-10">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            <Link to="/login">
              <Button className="bg-white hover:bg-gray-100 text-black px-8 py-6 rounded-xl text-lg font-medium transition-all duration-300">
                Ativar White-Label
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhiteLabel;
