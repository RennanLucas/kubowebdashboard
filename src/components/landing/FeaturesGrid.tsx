import { Activity, Layers, Link2, FileBarChart, MonitorSmartphone, BrainCircuit } from "lucide-react";

export const FeaturesGrid = () => {
  const features = [
    {
      icon: Activity,
      title: "Performance em tempo real",
      desc: "Acompanhe investimento, receita, ROAS, CAC, CPL e conversões em um único ambiente."
    },
    {
      icon: Layers,
      title: "Google Ads + Meta Ads",
      desc: "Compare canais, campanhas e resultados sem precisar alternar entre plataformas."
    },
    {
      icon: Link2,
      title: "CRM conectado",
      desc: "Descubra quais campanhas realmente geram leads, clientes e receita."
    },
    {
      icon: FileBarChart,
      title: "Relatórios inteligentes",
      desc: "Crie relatórios profissionais automaticamente e compartilhe com seus clientes."
    },
    {
      icon: MonitorSmartphone,
      title: "White-label",
      desc: "Sua marca, seu domínio e uma experiência completamente personalizada."
    },
    {
      icon: BrainCircuit,
      title: "Kubo AI",
      desc: "Transforme grandes volumes de dados em insights e recomendações práticas."
    }
  ];

  return (
    <section id="features" className="py-32 bg-black border-y border-white/5 relative">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="mb-20 reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-white max-w-2xl">
            Tudo o que você precisa para operar performance em escala.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="glass-panel p-8 rounded-[1.5rem] premium-hover reveal-scroll border border-white/5 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 transition-colors group-hover:bg-primary group-hover:text-white">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/50 text-[15px] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
