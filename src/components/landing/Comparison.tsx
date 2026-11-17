import { Check, X } from "lucide-react";
import { COMPARISON_ROWS } from "./data";

export function Comparison() {
  return (
    <section id="comparative" className="lp-section">
      <div className="lp-shell">
        <div className="lp-section__head">
          <span className="lp-label">Comparativo</span>
          <h2 className="lp-h2">O que muda na prática.</h2>
          <p>
            Oito diferenças concretas entre manter o GA4 e trocar a leitura do site para o Kubo.
          </p>
        </div>

        <div className="lp-comparison__table-wrap">
          <table className="lp-comparison__table" aria-label="Tabela comparativa entre Google Analytics e Kubo">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Google Analytics (GA4)</th>
                <th className="is-kubo">Kubo Analytics</th>
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
        </div>
      </div>
    </section>
  );
}
