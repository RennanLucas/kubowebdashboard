import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTA = () => {
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
    <section ref={sectionRef} className="py-24 relative overflow-hidden bg-black">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] glow-pulse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center glass-panel p-12 lg:p-20 rounded-[3rem] border border-white/10 reveal-scroll scale-in relative overflow-hidden">
          {/* Subtle grid pattern background inside card */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Chega de adivinhar. <br className="hidden md:block" />
              <span className="linear-text-gradient">Comece a entender.</span>
            </h2>
            
            <p className="text-gray-400 text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
              Instale em 2 minutos. Veja seus dados em tempo real. Tome decisões melhores com base no que realmente acontece no seu site.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <Link to="/login">
                <Button className="bg-white hover:bg-gray-100 text-black px-10 py-7 rounded-2xl text-xl font-semibold transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Começar gratuitamente
                </Button>
              </Link>
              <p className="text-sm text-gray-500 font-medium">
                Sem cartão de crédito · Plano gratuito para sempre
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
