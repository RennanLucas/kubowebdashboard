import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { COMPARISON_ROWS } from "./data";
import { fadeUp, viewportOnce } from "./motion";

export function Comparison() {
  return (
    <section id="comparative" className="lp-comparison">
      <div className="lp-shell">
        <motion.div className="lp-section-head lp-section-head--center" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>Comparativo direto</span>
          <h2>Por que agências e empresas<br />estão migrando para o Kubo.</h2>
          <p>Uma comparação clara entre a complexidade do passado e a velocidade do presente.</p>
        </motion.div>

        <motion.div className="lp-comparison__table-wrap" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <table className="lp-comparison__table" aria-label="Tabela comparativa entre Google Analytics e Kubo">
            <thead>
              <tr>
                <th>Recurso / diferencial</th>
                <th>Google Analytics (GA4)</th>
                <th className="is-kubo"><span>Kubo Analytics</span></th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="lp-comparison__feature"><strong>{row.feature}</strong></td>
                  <td className="lp-comparison__ga4"><span className="lp-cross"><X size={13} /></span>{row.ga4}</td>
                  <td className="lp-comparison__kubo"><span className="lp-check"><Check size={13} /></span><strong>{row.kubo}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
