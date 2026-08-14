import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";

export const Footer = () => {
  return (
    <footer className="bg-black py-20 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          
          <div className="col-span-2 md:col-span-2">
            <img src={logoKubowebWhite} alt="Kubo Web" className="h-6 w-auto mb-6" />
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xs">
              Plataforma de inteligência e performance desenhada para agências e empresas exigentes.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-4">
              {['Dashboard', 'Performance', 'Relatórios', 'Kubo AI'].map(item => (
                <li key={item}><a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-medium">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Empresa</h4>
            <ul className="space-y-4">
              {['Sobre', 'Contato', 'Suporte'].map(item => (
                <li key={item}><a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-medium">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-4">
              {['Termos', 'Privacidade'].map(item => (
                <li key={item}><a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-medium">{item}</a></li>
              ))}
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs font-bold text-white/30 uppercase tracking-widest">
            © {new Date().getFullYear()} Kubo Web. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};
