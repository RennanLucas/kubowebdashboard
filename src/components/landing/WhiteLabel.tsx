import { MonitorSmartphone, Lock } from "lucide-react";

export const WhiteLabel = () => {
  return (
    <section className="py-32 bg-black border-y border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Mockup */}
          <div className="order-2 lg:order-1 relative reveal-scroll">
            <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="glass-panel rounded-[2rem] border border-white/10 overflow-hidden relative z-10">
              {/* Browser Bar */}
              <div className="h-12 border-b border-white/5 bg-black/40 flex items-center px-4 gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="flex-1 bg-white/5 rounded-md h-7 flex items-center justify-center gap-2 border border-white/5 text-xs text-white/50 font-mono">
                  <Lock className="w-3 h-3" /> app.suaagencia.com.br
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 h-64 bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center border-t border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-xl">
                  <div className="w-8 h-8 bg-black rounded-md" />
                </div>
                <div className="text-xl font-bold text-white mb-2">Sua Agência Hub</div>
                <div className="text-white/40 text-sm">Painel exclusivo do cliente</div>
                
                {/* Fake inputs */}
                <div className="mt-8 space-y-3 w-64 opacity-50">
                  <div className="h-10 w-full bg-white/10 rounded-lg border border-white/10" />
                  <div className="h-10 w-full bg-white text-black rounded-lg font-bold flex items-center justify-center text-sm">Entrar</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Copy */}
          <div className="order-1 lg:order-2 reveal-scroll">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-8">
              <MonitorSmartphone className="w-7 h-7" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white leading-tight">
              Entregue uma experiência <br/>premium <span className="linear-text-gradient">com a sua marca.</span>
            </h2>
            <p className="text-lg text-white/50 font-medium mb-8 leading-relaxed max-w-lg">
              Personalize o ambiente com sua identidade visual, domínio e marca. Seus clientes enxergam uma plataforma profissional, integrada à experiência da sua agência.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {['Logo Personalizado', 'Domínio Próprio', 'Cores da Marca', 'Relatórios Custom', 'Favicon Exclusivo', 'Sem menção Kubo'].map(item => (
                <div key={item} className="flex items-center gap-2 text-white/70 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
