export const HowItWorks = () => {
  const steps = [
    { title: "Crie sua conta", desc: "Configure seu workspace em segundos." },
    { title: "Conecte plataformas", desc: "Integre Google Ads, Meta Ads e CRM via OAuth oficial." },
    { title: "Organize clientes", desc: "Crie ambientes separados para cada operação da sua agência." },
    { title: "Comece a acompanhar", desc: "Visualize os dados sendo atualizados automaticamente." }
  ];

  return (
    <section className="py-32 bg-black border-y border-white/5 relative">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="mb-20 reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-white">
            Comece em poucos minutos.
          </h2>
          <p className="text-lg text-white/50 font-medium">Setup rápido, sem implementações técnicas complexas.</p>
        </div>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 hidden md:block -translate-y-1/2" />
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left reveal-scroll" style={{ transitionDelay: \`\${i * 100}ms\` }}>
                <div className="w-12 h-12 rounded-full bg-black border-2 border-primary flex items-center justify-center text-primary font-black mb-6 shadow-[0_0_30px_rgba(108,60,225,0.4)]">
                  0{i + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
