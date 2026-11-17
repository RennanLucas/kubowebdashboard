import { CAPABILITY_MARQUEE, COMPATIBILITY_PLATFORMS } from "./data";

/**
 * Social proof built only from facts about the product itself — no invented
 * company logos or unverifiable usage numbers. The marquee restates real
 * capabilities; the compatibility row lists platforms the install snippet
 * genuinely supports.
 */
export function SocialProof() {
  const items = [...CAPABILITY_MARQUEE, ...CAPABILITY_MARQUEE];

  return (
    <section className="lp-proof" aria-label="Recursos e compatibilidade do Kubo Analytics">
      <div className="lp-marquee">
        <div className="lp-marquee__track" aria-hidden="true">
          {items.map((text, i) => (
            <span key={i} className="lp-marquee__item">
              {text}
              {i < items.length - 1 && <span className="lp-marquee__sep" />}
            </span>
          ))}
        </div>
      </div>

      <div className="lp-shell lp-proof__compat">
        <p className="lp-proof__compat-label">Instala com uma linha em qualquer stack</p>
        <div className="lp-proof__compat-list">
          {COMPATIBILITY_PLATFORMS.map((name) => (
            <span key={name} className="lp-proof__compat-pill">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
