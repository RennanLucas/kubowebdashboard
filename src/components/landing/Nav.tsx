import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-kuboweb-white.png";
import { NAV_LINKS } from "./data";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className={`lp-nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="lp-shell lp-nav__inner">
        <Link to="/" className="lp-nav__brand" aria-label="Kubo Analytics — início">
          <img src={logo} alt="Kubo Analytics" />
        </Link>

        <nav className="lp-nav__links" aria-label="Navegação principal">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} className="lp-nav__link">{label}</a>
          ))}
        </nav>

        <div className="lp-nav__actions">
          <Link to="/login" className="lp-nav__login">Entrar</Link>
          <Link to="/login" className="lp-cta lp-cta--compact" aria-label="Começar grátis">
            <span>Começar grátis</span>
            <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            className="lp-nav__menu"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lp-nav__mobile"
            role="group"
            aria-label="Navegação móvel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>Entrar no Kubo</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
