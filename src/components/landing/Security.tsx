import { motion } from "framer-motion";
import { Cpu, Lock, Server, ShieldCheck } from "lucide-react";
import { SECURITY_ITEMS } from "./data";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

const ICONS = [ShieldCheck, Lock, Server, Cpu];

export function Security() {
  return (
    <section className="lp-security" aria-label="Segurança e infraestrutura">
      <div className="lp-shell">
        <motion.div className="lp-section-head lp-section-head--center" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>Infraestrutura e conformidade</span>
          <h2>Desenvolvido para empresas<br />que levam privacidade a sério.</h2>
          <p>Confiabilidade pensada para o dia a dia, sem a burocracia dos gigantes legados.</p>
        </motion.div>

        <motion.div className="lp-security__grid" variants={staggerContainer(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce}>
          {SECURITY_ITEMS.map(({ title, desc }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <motion.div key={title} variants={fadeUp} className="lp-security__card">
                <div className="lp-security__icon"><Icon size={20} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
