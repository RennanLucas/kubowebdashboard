import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fadeUp, viewportOnce } from "./motion";

export function CTA() {
  return (
    <section className="lp-final">
      <div className="lp-final__grid" aria-hidden="true" />
      <motion.div className="lp-shell lp-final__inner" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
        <div className="lp-final__signal"><span /><span /><span /><i /></div>
        <span>Seu site já está gerando sinais.</span>
        <h2>Transforme visitas<br /><span className="lp-aurora-text">em decisões.</span></h2>
        <p>Instale o Kubo em 2 minutos, acompanhe os primeiros acessos e descubra o que realmente merece a sua atenção.</p>
        <Link to="/login" className="lp-cta" aria-label="Começar 7 dias grátis">
          <span>Começar 7 dias grátis</span>
          <ArrowRight size={17} />
        </Link>
      </motion.div>
    </section>
  );
}
