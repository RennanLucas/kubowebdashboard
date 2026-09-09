import React, { useEffect } from 'react';

export default function DashboardShowcase() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });
    
    const elements = document.querySelectorAll('.reveal-scroll');
    elements.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 reveal-scroll fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Veja o que realmente está <br/>
            <span className="primary-text-gradient">acontecendo no seu site.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Métricas claras, sem complexidade. Tudo que você precisa em uma única tela.
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl reveal-scroll scale-in mt-10 perspective-[1000px]">
          {/* Decorative glows */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur-xl opacity-50 glow-pulse pointer-events-none"></div>
          
          <div className="relative glass-panel rounded-2xl border border-white/10 bg-[#080c13] shadow-2xl overflow-hidden float-gentle transform hover:rotate-x-[2deg] hover:rotate-y-[2deg] transition-transform duration-700">
            {/* Browser chrome */}
            <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="mx-auto bg-black/40 border border-white/10 rounded-md px-4 py-1 text-xs text-gray-500 flex items-center gap-2">
                <span className="text-gray-400 text-[10px]">🔒</span>
                app.kuboweb.com.br
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 md:p-8 flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Visão Geral</h3>
                  <p className="text-sm text-gray-400">Últimos 14 dias</p>
                </div>
                <div className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium border border-primary/30">
                  Exportar PDF
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Visitantes Únicos", value: "2.847", trend: "+12%" },
                  { label: "Conversões (WhatsApp)", value: "186", trend: "+24%" },
                  { label: "Taxa de Conversão", value: "6,5%", trend: "+1,2%" },
                  { label: "Tempo Médio", value: "2:34", trend: "-5s", neg: true }
                ].map((kpi, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">{kpi.label}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl md:text-3xl font-bold text-white">{kpi.value}</p>
                      <span className={`text-xs font-medium ${kpi.neg ? 'text-red-400' : 'text-green-400'}`}>
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                {/* Chart Area */}
                <div className="md:col-span-2 bg-white/5 border border-white/5 rounded-xl p-6 h-64 flex flex-col justify-end gap-2 relative">
                  <p className="absolute top-4 left-4 text-sm font-medium text-gray-300">Tráfego vs Conversões</p>
                  <div className="flex items-end gap-2 h-40 w-full px-2 justify-between">
                    {[40, 65, 45, 80, 55, 90, 70, 60, 85, 50, 75, 45, 95, 60].map((h, i) => (
                      <div key={i} className="w-full relative group h-full flex items-end">
                        <div className="w-full bg-primary/80 rounded-t-sm transition-all duration-500 hover:bg-primary absolute bottom-0" style={{ height: `${h}%` }}></div>
                        <div className="w-1/2 bg-purple-400/50 rounded-t-sm absolute bottom-0 left-1/4" style={{ height: `${h * 0.3}%` }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                    <span>01 Mar</span>
                    <span>14 Mar</span>
                  </div>
                </div>

                {/* Sidebar Sources */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Fontes de Tráfego</h4>
                  <div className="space-y-4 flex-1">
                    {[
                      { name: "Google (Orgânico)", val: "45%", color: "bg-blue-500" },
                      { name: "Direto", val: "28%", color: "bg-purple-500" },
                      { name: "Instagram", val: "15%", color: "bg-pink-500" },
                      { name: "Facebook", val: "8%", color: "bg-blue-700" },
                      { name: "Outros", val: "4%", color: "bg-gray-500" }
                    ].map((source, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${source.color}`}></div>
                          <span className="text-xs text-gray-300">{source.name}</span>
                        </div>
                        <span className="text-xs font-bold text-white">{source.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pages Table */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 overflow-hidden">
                <h4 className="text-sm font-medium text-gray-300 mb-3 px-2">Páginas mais visitadas</h4>
                <div className="w-full">
                  <div className="grid grid-cols-4 text-xs text-gray-500 border-b border-white/5 pb-2 px-2">
                    <div className="col-span-2">Página</div>
                    <div>Visitas</div>
                    <div>Tempo</div>
                  </div>
                  {[
                    { path: "/", views: "1.240", time: "1:45" },
                    { path: "/produtos", views: "856", time: "2:10" },
                    { path: "/contato", views: "432", time: "0:55" }
                  ].map((page, i) => (
                    <div key={i} className="grid grid-cols-4 text-xs text-gray-300 py-2 border-b border-white/5 px-2 hover:bg-white/5 transition-colors">
                      <div className="col-span-2 truncate">{page.path}</div>
                      <div>{page.views}</div>
                      <div>{page.time}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
