import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, Play, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-kuboweb-white.png";
import { ProductDashboard } from "./ProductDashboard";

const navigation = [
  ["Produto", "#product-story"],
  ["Recursos", "#capabilities"],
  ["Planos", "#pricing"],
  ["Dúvidas", "#faq"],
];

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
          {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </div>
        <div className="lp-nav__actions">
          <Link to="/login" className="lp-nav__login">Entrar</Link>
          <Link to="/login" className="lp-button lp-button--compact">Começar grátis <ArrowRight size={14} /></Link>
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

export function LandingHero() {
  const stageRef = useRef<HTMLDivElement>(null);

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
      <div className="lp-hero__grid" aria-hidden="true" />
      <div className="lp-hero__light" aria-hidden="true" />
      <div className="lp-shell lp-hero__content">
        <div className="lp-eyebrow lp-enter lp-enter--1"><span className="lp-live-dot" /> Analytics claro, do primeiro acesso à conversão</div>
        <h1 className="lp-enter lp-enter--2">Veja o que acontece.<br /><span>Decida o que muda.</span></h1>
        <p className="lp-enter lp-enter--3">Visitantes, páginas, fontes, conversões e insights em uma leitura simples — para você entender seu site sem depender de planilhas.</p>
        <div className="lp-hero__actions lp-enter lp-enter--4">
          <Link to="/login" className="lp-button">Começar 7 dias grátis <ArrowRight size={17} /></Link>
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
