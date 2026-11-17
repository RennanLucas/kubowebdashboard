import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { INSTALL_SNIPPET, SETUP_STEPS } from "./data";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

export function GetStarted() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(INSTALL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="lp-setup">
      <div className="lp-shell">
        <motion.div className="lp-section-head" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>Comece sem complexidade</span>
          <h2>Do zero aos primeiros sinais<br />em quatro passos.</h2>
          <p>Instale em minutos e tenha total clareza do tráfego sem depender de configurações complexas.</p>
        </motion.div>

        <motion.div className="lp-deck-wrap" variants={staggerContainer(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce}>
          {SETUP_STEPS.map((step) => (
            <motion.article key={step.number} variants={fadeUp} className="lp-deck-card">
              <span className="lp-deck-card__num">Etapa {step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div className="lp-terminal" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <div className="lp-terminal__header">
            <div className="lp-terminal__controls"><span className="lp-terminal__dot is-red" /><span className="lp-terminal__dot is-yellow" /><span className="lp-terminal__dot is-green" /></div>
            <span className="lp-terminal__label">instalação · 1 linha</span>
            <button type="button" onClick={handleCopy} className={`lp-terminal__copy-btn ${copied ? "is-copied" : ""}`} aria-label="Copiar código de instalação">
              {copied ? <><Check size={12} /><span>Copiado!</span></> : <><Copy size={12} /><span>Copiar snippet</span></>}
            </button>
          </div>
          <div className="lp-terminal__body">
            <pre className="lp-terminal__code"><code>{INSTALL_SNIPPET}</code></pre>
          </div>
          <div className="lp-terminal__footer">
            <span className="lp-terminal__badge"><span className="lp-live-dot" /> Snippet ativo e assíncrono</span>
            <div className="lp-terminal__meta">
              <span>Peso: <b>2.1 KB</b></span>
              <span>Cookies: <b>Zero</b></span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
