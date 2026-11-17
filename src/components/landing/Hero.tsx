import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { HERO_TYPING_PHRASES } from "./data";
import { ProductPreview } from "./ProductPreview";
import { EASE } from "./motion";

/** Pointer-follow glow rendered once at the page root (see Landing.tsx). */
export function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = -1000;
    let ty = -1000;
    const onMove = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      if (orbRef.current) {
        orbRef.current.style.left = `${tx}px`;
        orbRef.current.style.top = `${ty}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="lp-cursor-glow" aria-hidden="true">
      <div ref={orbRef} className="lp-cursor-glow__orb" />
    </div>
  );
}

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: Math.round(Math.random() * 100),
  y: Math.round(50 + Math.random() * 40),
  sz: `${1.5 + Math.random() * 2.5}px`,
  dur: `${7 + Math.random() * 9}s`,
  del: `${Math.random() * 8}s`,
  opacity: 0.3 + Math.random() * 0.4,
}));

function useTyping(phrases: string[], speed = 65, pause = 2200) {
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
      timeout = setTimeout(() => setCharIdx((i) => i - 1), speed / 2.5);
    } else {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause, reducedMotion]);

  return displayed;
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const typedText = useTyping(HERO_TYPING_PHRASES);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : 90]);
  const previewScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const previewOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <section id="hero" ref={sectionRef} className="lp-hero">
      <div className="lp-hero__grid" aria-hidden="true" />
      <div className="lp-hero__aurora" aria-hidden="true" />
      <div className="lp-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <span key={p.id} className="lp-particle" style={{
            "--x": `${p.x}%`, "--y": `${p.y}%`, "--sz": p.sz, "--dur": p.dur, "--del": p.del, opacity: p.opacity,
          } as React.CSSProperties} />
        ))}
      </div>

      <div className="lp-shell lp-hero__content">
        <motion.div className="lp-eyebrow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <span className="lp-live-dot" />
          Analytics claro,{" "}
          <span className="lp-eyebrow__typed">
            {typedText}
            <span className="lp-typing-cursor" aria-hidden="true" />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
        >
          <span className="lp-grad-text">Veja o que acontece.</span>
          <br />
          <span className="lp-underline-wrap">
            Decida o que muda.
            <svg className="lp-underline-svg" viewBox="0 0 280 14" fill="none" aria-hidden="true">
              <path d="M4 10C60 3 175 3 276 9" stroke="url(#lp-hero-underline-grad)" strokeWidth="3.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="lp-hero-underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#44e5a8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
        >
          Visitantes, páginas, fontes, conversões e insights em uma leitura simples — para você entender seu site sem depender de planilhas.
        </motion.p>

        <motion.div
          className="lp-hero__actions"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
        >
          <Link to="/login" className="lp-cta" aria-label="Começar 7 dias grátis">
            <span>Começar 7 dias grátis</span>
            <ArrowRight size={17} />
          </Link>
          <a href="#product-story" className="lp-cta lp-cta--ghost">
            <Play size={15} fill="currentColor" /> Ver o produto
          </a>
        </motion.div>

        <motion.div
          className="lp-hero__trust"
          aria-label="Benefícios do plano"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
        >
          <span>Sem cartão para começar</span><i />
          <span>Instalação em minutos</span><i />
          <span>Consentimento LGPD</span>
        </motion.div>

        <motion.div
          className="lp-stage"
          style={{ y: previewY, scale: previewScale, opacity: previewOpacity }}
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.38, ease: EASE }}
        >
          <div className="lp-stage__halo" aria-hidden="true" />
          <div className="lp-float-card lp-float-card--live" aria-hidden="true"><span className="lp-live-dot" /><small>Agora</small><strong>24 visitantes</strong></div>
          <div className="lp-float-card lp-float-card--lead" aria-hidden="true"><small>Conversão</small><strong>Lead recebido</strong><span>WhatsApp · agora</span></div>
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
