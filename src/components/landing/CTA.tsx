import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const CTA = () => {
  return (
    <section className="py-40 relative bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,60,225,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="mx-auto max-w-4xl px-6 relative z-10 text-center reveal-scroll">
        
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 text-white">
          Sua operação de marketing merece <br/><span className="linear-text-gradient">mais do que planilhas.</span>
        </h2>
        
        <p className="text-xl text-white/50 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          Centralize dados. Entenda resultados. Tome decisões melhores.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <Button asChild size="lg" className="h-16 px-12 rounded-full bg-white text-black font-black text-lg hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <Link to="/login">
              Começar gratuitamente
            </Link>
          </Button>
          <span className="text-sm font-bold text-white/30 uppercase tracking-widest">
            Setup rápido. Sem complexidade desnecessária.
          </span>
        </div>
      </div>
    </section>
  );
};
