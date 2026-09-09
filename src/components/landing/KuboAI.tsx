import React, { useEffect, useRef } from 'react';
import { Sparkles, Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const KuboAI = () => {
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
    <section ref={sectionRef} className="py-24 relative overflow-hidden bg-[#080c13]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="reveal-scroll slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">Inteligência Artificial</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight">
              Seus dados agora <span className="linear-text-gradient">pensam junto com você.</span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              O Kubo AI analisa seus padrões de tráfego, identifica os horários de pico e sugere melhorias para o seu conteúdo, transformando dados em ações claras.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-1">Diagnóstico semanal automático</h3>
                  <p className="text-gray-400">Receba um resumo inteligente toda semana direto no seu painel.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-1">Detecção de anomalias</h3>
                  <p className="text-gray-400">Alertas em tempo real quando o tráfego cai ou sobe drasticamente.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                  <Lightbulb className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-1">Sugestões de conteúdo</h3>
                  <p className="text-gray-400">Descubra quais páginas precisam de atenção e quais estão performando bem.</p>
                </div>
              </div>
            </div>

            <Link to="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl text-lg font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(108,60,225,0.4)]">
                Conhecer o Kubo AI
              </Button>
            </Link>
          </div>

          <div className="reveal-scroll slide-in-right relative">
            <div className="relative z-10 glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-white font-semibold text-lg">Insights da Semana</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 premium-hover">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Pico de Tráfego Identificado</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Suas visitas aumentaram 45% ontem às 20h. Isso coincide com o envio da sua campanha de e-mail.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5 premium-hover">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="text-white font-medium">Atenção na Página de Preços</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    A taxa de rejeição na página de preços aumentou em 12% nos últimos 3 dias. Verifique se há algum erro no mobile.
                  </p>
                </div>

                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 premium-hover">
                  <div className="flex items-center gap-3 mb-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span className="text-white font-medium">Recomendação do AI</span>
                  </div>
                  <p className="text-primary-100 text-sm">
                    Os visitantes estão clicando 3x mais no botão de WhatsApp do que no formulário. Considere dar mais destaque ao botão.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/30 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
};

export default KuboAI;
