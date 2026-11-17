import { motion } from "framer-motion";
import {
  BellRing, FileDown, Flame, Layers3, MousePointerClick, Target,
} from "lucide-react";
import { CAPABILITIES } from "./data";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

const ICONS = [MousePointerClick, Flame, BellRing, Target, FileDown, Layers3];

function handleSpotlight(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}

export function Features() {
  return (
    <section id="capabilities" className="lp-capabilities">
      <div className="lp-shell">
        <motion.div className="lp-section-head" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>Recursos desenhados para resultados</span>
          <h2>Profundidade quando precisa.<br />Simplicidade sempre.</h2>
          <p>Tudo o que sua agência ou empresa precisa para acompanhar performance web sem o excesso do GA4.</p>
        </motion.div>

        <motion.div
          className="lp-capability-grid"
          variants={staggerContainer(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {CAPABILITIES.map(({ title, copy }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <motion.article
                key={title}
                variants={fadeUp}
                className="lp-capability lp-spotlight-card"
                onMouseMove={handleSpotlight}
              >
                <div className="lp-capability__icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
