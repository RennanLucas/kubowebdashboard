import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const FAQ = () => {
  const faqs = [
    { q: "O Kubo Web funciona com Google Ads?", a: "Sim, integração nativa via OAuth para trazer dados em tempo real." },
    { q: "Posso conectar Meta Ads?", a: "Absolutamente. Centralizamos os dados de campanhas do Facebook e Instagram." },
    { q: "Posso adicionar meus clientes?", a: "Sim, você pode criar workspaces separados para cada cliente, mantendo os dados isolados." },
    { q: "O dashboard é atualizado automaticamente?", a: "Sim, os dados são processados e atualizados sem necessidade de refresh manual." },
    { q: "Posso personalizar a plataforma com minha marca?", a: "Sim, oferecemos whitelabel completo (cores, logo, favicon)." },
    { q: "Posso usar meu próprio domínio?", a: "Sim, você pode mapear um subdomínio como app.suaagencia.com.br." },
    { q: "Como funciona o Kubo AI?", a: "Nossa IA analisa padrões de gastos e conversões para sugerir otimizações de orçamento automaticamente." }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 bg-black border-y border-white/5 relative">
      <div className="mx-auto max-w-4xl px-6 relative z-10">
        
        <div className="mb-20 text-center reveal-scroll">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 text-white">
            Perguntas frequentes
          </h2>
        </div>

        <div className="space-y-4 reveal-scroll">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-bold text-white text-lg">{faq.q}</span>
                <ChevronDown className={\`w-5 h-5 text-white/40 transition-transform duration-300 \${openIndex === i ? 'rotate-180' : ''}\`} />
              </button>
              <div 
                className={\`px-6 overflow-hidden transition-all duration-300 ease-in-out \${openIndex === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}\`}
              >
                <p className="text-white/50 font-medium leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
