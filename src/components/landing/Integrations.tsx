import React, { useEffect, useRef } from 'react';
import { BarChart3, MessageCircle, FileText, Bot, Webhook, MousePointerClick, Table2, Link as LinkIcon, Code } from 'lucide-react';

const categories = [
  {
    title: "Analytics",
    items: [
      { name: "Google Analytics 4", icon: BarChart3 },
      { name: "Search Console", icon: BarChart3 },
      { name: "Tag Manager", icon: Webhook }
    ]
  },
  {
    title: "Rastreamento",
    items: [
      { name: "WhatsApp", icon: MessageCircle },
      { name: "Formulários", icon: FileText },
      { name: "Links Externos", icon: LinkIcon }
    ]
  },
  {
    title: "Exportação",
    items: [
      { name: "PDF Profissional", icon: FileText },
      { name: "Excel (XLSX)", icon: Table2 },
      { name: "CSV", icon: Table2 }
    ]
  },
  {
    title: "Automação",
    items: [
      { name: "Webhooks", icon: Webhook },
      { name: "API REST", icon: Code },
      { name: "Kubo AI", icon: Bot }
    ]
  }
];

const Integrations = () => {
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
    <section ref={sectionRef} className="py-24 bg-[#080c13]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="linear-text-gradient">Integrações</span> e Exportações
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            O Kubo trabalha com as ferramentas que você já usa e exporta seus dados nos formatos que você precisa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {categories.map((category, index) => {
            const delayClass = `fade-up-delay-${index + 1}`;
            return (
              <div key={index} className={`reveal-scroll fade-up ${delayClass} glass-panel p-6 rounded-2xl border border-white/5 premium-hover`}>
                <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">
                  {category.title}
                </h3>
                <ul className="space-y-4">
                  {category.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <li key={itemIdx} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
