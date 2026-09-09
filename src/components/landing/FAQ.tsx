import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Preciso de conhecimento técnico?",
    answer: "Não. Basta colar uma linha de código no seu site. Se você usa WordPress, Wix ou qualquer construtor, leva menos de 2 minutos."
  },
  {
    question: "O script deixa meu site lento?",
    answer: "Não. O Kubo carrega um script de apenas 2KB, assíncrono. Seu PageSpeed não é afetado."
  },
  {
    question: "Como funciona o rastreamento de WhatsApp?",
    answer: "O Kubo detecta automaticamente cliques em links e botões de WhatsApp no seu site. Sem configuração extra."
  },
  {
    question: "Preciso de cartão de crédito para começar?",
    answer: "Não. O plano gratuito é 100% grátis, sem limite de tempo e sem necessidade de cartão."
  },
  {
    question: "O Kubo está em conformidade com a LGPD?",
    answer: "Sim. O Kubo não utiliza cookies invasivos e não requer banners de consentimento complexos."
  },
  {
    question: "Posso usar o Kubo para os sites dos meus clientes?",
    answer: "Sim! No plano Pro, você pode criar projetos ilimitados e até personalizar a plataforma com a marca da sua agência (white-label)."
  },
  {
    question: "Como funciona o Kubo AI?",
    answer: "Nossa IA analisa seus dados de tráfego e conversão semanalmente e gera um relatório com insights, anomalias detectadas e sugestões de melhoria."
  }
];

const FAQ = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
    <section ref={sectionRef} className="py-24 bg-[#080c13]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Dúvidas <span className="linear-text-gradient">Frequentes</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tudo o que você precisa saber sobre o Kubo.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const delayClass = `fade-up-delay-${(index % 5) + 1}`;
            
            return (
              <div 
                key={index} 
                className={`reveal-scroll fade-up ${delayClass} glass-panel border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/50 bg-white/5' : 'hover:border-white/20'}`}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-white font-medium text-lg pr-8">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
