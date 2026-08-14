import { Search, Facebook, Database, BarChart2, Webhook, Code } from "lucide-react";

export const TrustBar = () => {
  return (
    <section className="py-12 border-y border-white/5 bg-black/50 backdrop-blur-xl relative z-20 -mt-20">
      <div className="mx-auto max-w-5xl px-6 text-center reveal-scroll">
        <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8">
          Tudo o que sua operação precisa para transformar dados em decisões
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60">
          
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-white" />
            <span className="font-semibold text-white">Google Ads</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Facebook className="w-6 h-6 text-white" />
            <span className="font-semibold text-white">Meta Ads</span>
          </div>

          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-white" />
            <span className="font-semibold text-white">CRM</span>
          </div>

          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-white" />
            <span className="font-semibold text-white">Analytics</span>
          </div>

          <div className="flex items-center gap-3">
            <Webhook className="w-6 h-6 text-white" />
            <span className="font-semibold text-white">Webhooks</span>
          </div>

          <div className="flex items-center gap-3">
            <Code className="w-6 h-6 text-white" />
            <span className="font-semibold text-white">API</span>
          </div>

        </div>
      </div>
    </section>
  );
};
