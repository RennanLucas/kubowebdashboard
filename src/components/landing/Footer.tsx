import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "./data";

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-shell lp-footer__top">
        <div>
          <strong>Kubo Analytics</strong>
          <p>Analytics próprio para transformar sinais do seu site em decisões mais claras.</p>
        </div>
        <nav aria-label="Links do rodapé">
          {NAV_LINKS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          <Link to="/login">Entrar</Link>
        </nav>
      </div>
      <div className="lp-shell lp-footer__bottom">
        <span>© {new Date().getFullYear()} Kubo Web</span>
        <span><ShieldCheck size={12} /> Privacidade por princípio · LGPD</span>
      </div>
    </footer>
  );
}
