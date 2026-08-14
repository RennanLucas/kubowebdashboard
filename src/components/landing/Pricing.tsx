import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Pricing = () => {
  const plans = [
    { name: "Starter", target: "Para operações menores.", highlight: false },
    { name: "Growth", target: "Para agências em crescimento.", highlight: true },
    { name: "Scale", target: "Para operações maiores.", highlight: false },
    { name: "Enterprise", target: "Para grandes estruturas.", highlight: false }
  ];

  return (
    <section className="py-32 bg-black border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20 reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-white">
            Um plano para cada estágio da sua operação.
          </h2>
          <p className="text-lg text-white/50 font-medium">Soluções escaláveis que acompanham o crescimento da sua agência e dos seus clientes.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal-scroll">
          {plans.map((plan) => (
            <div key={plan.name} className={\`glass-panel p-8 rounded-[2rem] border \${plan.highlight ? 'border-primary/50 shadow-[0_0_50px_rgba(108,60,225,0.2)]' : 'border-white/5'} flex flex-col premium-hover\`}>
              {plan.highlight && (
                <div className="mb-4 inline-flex px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full self-start">
                  Mais escolhido
                </div>
              )}
              <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-white/50 font-medium mb-10 h-10">{plan.target}</p>
              
              <div className="mt-auto pt-8 border-t border-white/5">
                <Button asChild className={\`w-full h-12 rounded-xl font-bold \${plan.highlight ? 'bg-primary text-white hover:bg-primary-glow' : 'bg-white/5 text-white hover:bg-white/10'}\`}>
                  <Link to="/login">Falar com vendas</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
