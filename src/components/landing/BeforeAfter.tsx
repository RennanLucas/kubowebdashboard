import { XCircle, CheckCircle2 } from "lucide-react";

export const BeforeAfter = () => {
  const beforeList = [
    "Planilhas", "PDFs", "Dados espalhados", "Relatórios manuais", "Plataformas desconectadas", "Decisões demoradas"
  ];
  
  const afterList = [
    "Dados centralizados", "Atualização automática", "Relatórios profissionais", "Insights inteligentes", "Gestão de clientes", "Visão completa do ROI"
  ];

  return (
    <section className="py-32 bg-black relative">
      <div className="mx-auto max-w-5xl px-6 relative z-10">
        
        <div className="grid md:grid-cols-2 gap-8 reveal-scroll">
          
          {/* Before */}
          <div className="glass-panel p-10 rounded-[2rem] border border-white/5 opacity-60">
            <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Antes do Kubo Web</h3>
            <ul className="space-y-5">
              {beforeList.map(item => (
                <li key={item} className="flex items-center gap-3 text-white/50">
                  <XCircle className="w-5 h-5 text-red-400/50" />
                  <span className="font-medium text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="glass-panel p-10 rounded-[2rem] border border-primary/30 shadow-[0_0_60px_rgba(108,60,225,0.1)] relative overflow-hidden transform md:-translate-y-4">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <h3 className="text-2xl font-black text-white mb-8 border-b border-white/10 pb-4 relative z-10">Com o Kubo Web</h3>
            <ul className="space-y-5 relative z-10">
              {afterList.map(item => (
                <li key={item} className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-bold text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};
