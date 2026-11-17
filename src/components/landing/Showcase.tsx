import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { STORY_STEPS } from "./data";
import { ProductPreview } from "./ProductPreview";

function StoryStep({ index, step, onActivate }: { index: number; step: (typeof STORY_STEPS)[number]; onActivate: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-35% 0px -40% 0px" });

  useEffect(() => {
    if (inView) onActivate(index);
  }, [inView, index, onActivate]);

  return (
    <article ref={ref} className={inView ? "is-active" : ""}>
      <span>{step.kicker}</span>
      <h3>{step.title}</h3>
      <p>{step.copy}</p>
    </article>
  );
}

export function Showcase() {
  const [active, setActive] = useState(0);
  const current = STORY_STEPS[active];

  return (
    <section id="product-story" className="lp-story">
      <div className="lp-shell">
        <div className="lp-section__head">
          <span className="lp-label">O que o painel mostra</span>
          <h2 className="lp-h2">A mesma tela, em quatro perguntas.</h2>
          <p>
            Cada etapa é uma pergunta que você faz sobre o site. O painel responde com os sinais que
            já coleta — sem inventar métricas nem prometer integrações.
          </p>
        </div>

        <div className="lp-story__grid">
          <div className="lp-story__visual">
            <div className="lp-story__frame">
              <ProductPreview step={active} interactive={false} />
            </div>
            <div className="lp-story__readout" aria-live="polite">
              <span>{current.kicker}</span>
              <strong>{current.stat}</strong>
              <small>{current.label}</small>
            </div>
            <div className="lp-story__progress" aria-hidden="true">
              {STORY_STEPS.map((s, i) => <i key={s.title} className={i === active ? "is-active" : ""} />)}
            </div>
          </div>

          <div className="lp-story__steps">
            {STORY_STEPS.map((step, i) => (
              <StoryStep key={step.title} index={i} step={step} onActivate={setActive} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
