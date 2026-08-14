import { ArrowRight, Search, Facebook, Combine } from "lucide-react";

export const ComparisonSection = () => {
  return (
    <section className="py-32 bg-black border-y border-white/5 relative">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20 reveal-scroll">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-white">
            Google Ads, Meta Ads e CRM. <br/>
            <span className="linear-text-gradient">Finalmente, na mesma visão.</span>
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center reveal-scroll">
          
          {/* Google Ads */}
          <div className="flex-1 w-full glass-panel p-6 rounded-[2rem] border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-5 h-5 text-red-400" />
              <span className="font-bold text-white">Google Ads</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">Investimento</span><span className="text-white font-bold">R$ 5.200</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">Leads</span><span className="text-white font-bold">124</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">CPL</span><span className="text-white font-bold">R$ 41,93</span>
              </div>
            </div>
          </div>

          <div className="text-white/20">
            <ArrowRight className="w-8 h-8 hidden lg:block" />
          </div>

          {/* Meta Ads */}
          <div className="flex-1 w-full glass-panel p-6 rounded-[2rem] border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Facebook className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white">Meta Ads</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">Investimento</span><span className="text-white font-bold">R$ 3.100</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">Leads</span><span className="text-white font-bold">210</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">CPL</span><span className="text-white font-bold">R$ 14,76</span>
              </div>
            </div>
          </div>

          <div className="text-white/20">
            <ArrowRight className="w-8 h-8 hidden lg:block" />
          </div>

          {/* Kubo Web - Total */}
          <div className="flex-[1.5] w-full glass-panel p-8 rounded-[2rem] border border-primary/30 shadow-[0_0_40px_rgba(108,60,225,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <Combine className="w-6 h-6 text-primary" />
              <span className="font-black text-xl text-white">Total Consolidado</span>
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center text-base border-b border-white/10 pb-3">
                <span className="text-white/60">Investimento Total</span><span className="text-white font-black">R$ 8.300</span>
              </div>
              <div className="flex justify-between items-center text-base border-b border-white/10 pb-3">
                <span className="text-white/60">Leads Totais</span><span className="text-white font-black">334</span>
              </div>
              <div className="flex justify-between items-center text-lg pt-2">
                <span className="text-primary font-bold">ROAS Unificado</span><span className="text-green-400 font-black">5.2x</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
