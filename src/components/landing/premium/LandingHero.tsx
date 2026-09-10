import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, Play, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-kuboweb-white.png";
import { ProductDashboard } from "./ProductDashboard";

const navigation = [
  ["Produto", "#product-story"],
  ["Recursos", "#capabilities"],
  ["Comparativo", "#comparative"],
  ["Planos", "#pricing"],
  ["Dúvidas", "#faq"],
];

/* ─── Cursor Glow — follows pointer across entire page ─── */
export function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = -1000, ty = -1000;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
    };
    const tick = () => {
      if (orbRef.current) {
        orbRef.current.style.left = tx + "px";
        orbRef.current.style.top = ty + "px";
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

/* ─── Floating Particles ─── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.round(Math.random() * 100),
  y: Math.round(55 + Math.random() * 35),
  sz: `${1.5 + Math.random() * 2.5}px`,
  dur: `${7 + Math.random() * 9}s`,
  del: `${Math.random() * 8}s`,
  opacity: 0.3 + Math.random() * 0.4,
}));

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <nav className={`lp-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Navegação principal">
      <div className="lp-shell lp-nav__inner">
        <Link to="/" className="lp-nav__brand" aria-label="Kubo Analytics — início">
          <img src={logo} alt="Kubo Analytics" />
        </Link>
        <div className="lp-nav__links">
          {navigation.map(([label, href]) => (
            <a key={href} href={href} className="lp-pill">
              <span className="lp-pill__circulo" aria-hidden="true" />
              <span className="lp-pill__box">
                <span className="lp-pill__sobe">{label}</span>
                <span className="lp-pill__entra">{label}</span>
              </span>
            </a>
          ))}
        </div>
        <div className="lp-nav__actions">
          <Link to="/login" className="lp-nav__login">Entrar</Link>
          <Link to="/login" className="lp-feixe-btn lp-feixe-btn--compact" aria-label="Começar grátis">
            <span className="lp-feixe-border" aria-hidden="true" />
            <span className="lp-feixe-inner">Começar grátis <ArrowRight size={14} /></span>
          </Link>
          <button className="lp-nav__menu" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lp-nav__mobile" role="group" aria-label="Navegação móvel">
          {navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
          <Link to="/login" onClick={() => setOpen(false)}>Entrar no Kubo</Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Typing Effect Hook ─── */
function useTyping(phrases: string[], speed = 65, pause = 2200) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2.5);
    } else {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    }
    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return displayed;
}

export function LandingHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const typedText = useTyping(["do primeiro clique", "de cada visitante", "de cada conversão", "em tempo real"]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        stage.style.setProperty("--mx", x.toFixed(3));
        stage.style.setProperty("--my", y.toFixed(3));
      });
    };
    const reset = () => { stage.style.setProperty("--mx", "0"); stage.style.setProperty("--my", "0"); };
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", reset);
    return () => { cancelAnimationFrame(frame); stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", reset); };
  }, []);

  return (
    <section id="hero" className="lp-hero">
      {/* Background elements */}
      <div className="lp-hero__grid" aria-hidden="true" />
      <div className="lp-hero__light" aria-hidden="true" />
      <div className="lp-hero__blob" aria-hidden="true" />
      <div className="lp-hero__blob-2" aria-hidden="true" />

      {/* Floating particles */}
      <div className="lp-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="lp-particle"
            style={{
              "--x": `${p.x}%`,
              "--y": `${p.y}%`,
              "--sz": p.sz,
              "--dur": p.dur,
              "--del": p.del,
              opacity: p.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="lp-shell lp-hero__content">
        {/* Eyebrow with typing effect */}
        <div className="lp-eyebrow lp-enter lp-enter--1">
          <span className="lp-live-dot" />
          Analytics claro,{" "}
          <span style={{ color: "#93c5fd", minWidth: "140px", display: "inline-block" }}>
            {typedText}
            <span className="lp-typing-cursor" aria-hidden="true" />
          </span>
        </div>

        {/* Headline with animated gradient */}
        <h1 className="lp-enter lp-enter--2">
          <span className="lp-grad-text">Veja o que acontece.</span>
          <br />
          <span className="lp-underline-wrap">
            Decida o que muda.
            <svg className="lp-underline-svg" viewBox="0 0 280 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
        </h1>

        <p className="lp-enter lp-enter--3">Visitantes, páginas, fontes, conversões e insights em uma leitura simples — para você entender seu site sem depender de planilhas.</p>

        <div className="lp-hero__actions lp-enter lp-enter--4">
          <Link to="/login" className="lp-feixe-btn" aria-label="Começar 7 dias grátis">
            <span className="lp-feixe-border" aria-hidden="true" />
            <span className="lp-feixe-inner">Começar 7 dias grátis <ArrowRight size={17} /></span>
          </Link>
          <a href="#product-story" className="lp-button lp-button--ghost"><Play size={15} fill="currentColor" /> Ver o produto</a>
        </div>

        <div className="lp-hero__trust lp-enter lp-enter--4" aria-label="Benefícios do plano">
          <span>Sem cartão para começar</span><i />
          <span>Instalação em minutos</span><i />
          <span>Consentimento LGPD</span>
        </div>

        <div ref={stageRef} className="lp-stage lp-enter lp-enter--5">
          <div className="lp-stage__halo" aria-hidden="true" />
          <div className="lp-float-card lp-float-card--live" aria-hidden="true"><span className="lp-live-dot" /><small>Agora</small><strong>24 visitantes</strong></div>
          <div className="lp-float-card lp-float-card--lead" aria-hidden="true"><small>Conversão</small><strong>Lead recebido</strong><span>WhatsApp · agora</span></div>
          <ProductDashboard />
        </div>
      </div>
    </section>
  );
}
