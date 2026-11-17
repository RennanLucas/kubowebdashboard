import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="lp-final">
      <div className="lp-shell lp-final__inner">
        <span>Seu site já está gerando sinais.</span>
        <h2 className="lp-h2">Comece a ver quais deles importam.</h2>
        <p>
          Instale o Kubo em dois minutos, acompanhe os primeiros acessos e decida com o que o site
          já está dizendo.
        </p>
        <Link to="/login" className="lp-cta" aria-label="Começar 7 dias grátis">
          Começar 7 dias grátis
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
