import {
  BellRing, FileDown, Flame, Layers3, MousePointerClick, Target,
} from "lucide-react";
import { CAPABILITIES } from "./data";

const ICONS = [MousePointerClick, Flame, BellRing, Target, FileDown, Layers3];

export function Features() {
  return (
    <section id="capabilities" className="lp-section">
      <div className="lp-shell">
        <div className="lp-section__head">
          <span className="lp-label">Recursos</span>
          <h2 className="lp-h2">O que o Kubo faz, sem rodeios.</h2>
          <p>
            Seis coisas. Todas já funcionando hoje no painel — nenhuma delas exige configurar
            tag manager, dataLayer ou uma consultoria.
          </p>
        </div>

        <div className="lp-capability-grid">
          {CAPABILITIES.map(({ title, copy }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article key={title} className="lp-capability">
                <div className="lp-capability__icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
