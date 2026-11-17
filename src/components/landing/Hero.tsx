import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { HERO_TYPING_PHRASES, LIVE_FEED } from "./data";
import { EASE } from "./motion";

/**
 * A ticker of signals as they arrive. This is the page's one orchestrated
 * motion moment: the product demonstrating itself rather than a mockup
 * screenshot. It keeps running, because the product does.
 */
function LiveReader() {
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(24);
  const [rows, setRows] = useState(LIVE_FEED.slice(0, 4));
  const nextRef = useRef(4);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      const incoming = LIVE_FEED[nextRef.current % LIVE_FEED.length];
      nextRef.current += 1;
      setRows((prev) => [incoming, ...prev.slice(0, 3)]);
      setCount((c) => Math.max(18, Math.min(41, c + (Math.random() > 0.55 ? 1 : -1))));
    }, 3200);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="lp-reader" aria-label="Exemplo de eventos que o Kubo registra" role="img">
      <div className="lp-reader__head">
        <span><span className="lp-live-dot" /> ao vivo</span>
        <span>exemplo</span>
      </div>

      <div className="lp-reader__count">
        <strong>{count}</strong>
        <small>visitantes neste instante</small>
      </div>

      <div className="lp-reader__rows">
        {rows.map((row) => (
          <motion.div
            key={row.id}
            className={`lp-reader__row ${row.lead ? "is-lead" : ""}`}
            initial={reducedMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <span className="lp-reader__time">{row.time}</span>
            <span className="lp-reader__what">
              {row.what}
              <small>{row.detail}</small>
            </span>
            <span className="lp-reader__where">{row.where}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const typedText = useTyping(HERO_TYPING_PHRASES);

  return (
    <section className="lp-hero">
      <div className="lp-shell lp-hero__inner">
        <div className="lp-hero__copy">
          <motion.div
            className="lp-eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="lp-live-dot" />
            <span>Analytics claro,</span>
            <span className="lp-eyebrow__typed">{typedText}</span>
          </motion.div>

          <motion.h1
            className="lp-display"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.06, ease: EASE }}
          >
            Veja o que acontece.
            <br />
            Decida o que muda.
          </motion.h1>

          <motion.p
            className="lp-hero__lede"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
          >
            Visitantes, páginas, fontes, conversões e insights em uma leitura simples — para você
            entender seu site sem depender de planilhas.
          </motion.p>

          <motion.div
            className="lp-hero__actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
          >
            <Link to="/login" className="lp-cta" aria-label="Começar 7 dias grátis">
              Começar 7 dias grátis
              <ArrowRight size={16} />
            </Link>
            <a href="#product-story" className="lp-cta lp-cta--ghost">
              Ver o produto
            </a>
          </motion.div>

          <motion.div
            className="lp-hero__trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.32, ease: EASE }}
          >
            <span>Sem cartão para começar</span><i />
            <span>Instalação em minutos</span><i />
            <span>Consentimento LGPD</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
        >
          <LiveReader />
        </motion.div>
      </div>
    </section>
  );
}

function useTyping(phrases: string[], speed = 68, pause = 2400) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) { setDisplayed(phrases[0]); return; }
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx((i) => i + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((i) => i - 1), speed / 2.6);
    } else {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause, reducedMotion]);

  return displayed;
}
