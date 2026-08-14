import { Search, Facebook, LineChart, Target, Box, Database, Webhook, Code } from "lucide-react";

export const Integrations = () => {
  const categories = [
    {
      title: "Publicidade",
      items: [
        { name: "Google Ads", icon: Search },
        { name: "Meta Ads", icon: Facebook }
      ]
    },
    {
      title: "Analytics",
      items: [
        { name: "Google Analytics", icon: LineChart },
        { name: "Tag Manager", icon: Target },
        { name: "Search Console", icon: Box }
      ]
    },
    {
      title: "CRM",
      items: [
        { name: "HubSpot", icon: Database },
        { name: "RD Station", icon: Database },
        { name: "Pipedrive", icon: Database },
        { name: "Salesforce", icon: Database }
      ]
    },
    {
      title: "Integrações Livres",
      items: [
        { name: "Webhooks", icon: Webhook },
        { name: "API Nativa", icon: Code }
      ]
    }
  ];

  return (
    <section id="integrations" className="py-32 bg-black relative">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="mb-20 text-center max-w-3xl mx-auto reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 linear-text-gradient">
            Conecte as ferramentas que já fazem parte da sua operação.
          </h2>
          <p className="text-lg text-white/50 font-medium">Plataforma open-hub, pronta para consolidar as suas principais fontes de dados.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 reveal-scroll">
          {categories.map((cat, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                {cat.title}
              </h3>
              <div className="space-y-4">
                {cat.items.map(item => (
                  <div key={item.name} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-white/60" />
                    <span className="font-semibold text-white/80">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
