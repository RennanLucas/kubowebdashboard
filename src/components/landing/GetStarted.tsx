import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { INSTALL_SNIPPET, SETUP_STEPS } from "./data";

export function GetStarted() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(INSTALL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="lp-section">
      <div className="lp-shell">
        <div className="lp-section__head">
          <span className="lp-label">Instalação</span>
          <h2 className="lp-h2">Quatro passos, uma linha de código.</h2>
          <p>
            Sem SDK, sem conta de anúncios, sem esperar propagação. Você cola o script e os
            primeiros eventos aparecem em segundos.
          </p>
        </div>

        <div className="lp-deck-wrap">
          {SETUP_STEPS.map((step) => (
            <article key={step.number} className="lp-deck-card">
              <span className="lp-deck-card__num">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>

        <div className="lp-terminal">
          <div className="lp-terminal__header">
            <div className="lp-terminal__controls"><span className="lp-terminal__dot" /><span className="lp-terminal__dot" /><span className="lp-terminal__dot" /></div>
            <span className="lp-terminal__label">antes de &lt;/head&gt;</span>
            <button type="button" onClick={handleCopy} className={`lp-terminal__copy-btn ${copied ? "is-copied" : ""}`} aria-label="Copiar código de instalação">
              {copied ? <><Check size={12} /><span>Copiado</span></> : <><Copy size={12} /><span>Copiar</span></>}
            </button>
          </div>
          <div className="lp-terminal__body">
            <pre className="lp-terminal__code"><code>{INSTALL_SNIPPET}</code></pre>
          </div>
          <div className="lp-terminal__footer">
            <span className="lp-terminal__badge"><span className="lp-live-dot" /> assíncrono, não bloqueia a página</span>
            <div className="lp-terminal__meta">
              <span>peso <b>2.1 KB</b></span>
              <span>cookies <b>zero</b></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
