import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { PROBLEM_POINTS, SOLUTION_POINTS } from "./data";
import { fadeUp, viewportOnce } from "./motion";

export function ProblemSolution() {
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSliderPos(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <section className="lp-bridge">
      <div className="lp-shell">
        <motion.div className="lp-section-head lp-section-head--center" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>O contraste que muda o jogo</span>
          <h2>Por que o Google Analytics<br />ficou para trás.</h2>
          <p>O GA4 se tornou um labirinto de configurações, dados com atraso de até 48 horas e zero foco em conversão rápida de WhatsApp.</p>
        </motion.div>

        <motion.div className="lp-split-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <div className="lp-split-controls">
            <button type="button" className={`lp-split-mode-btn ${sliderPos === 50 ? "is-active" : ""}`} onClick={() => setSliderPos(50)}>
              <SlidersHorizontal size={12} /><span>Dividido (50 / 50)</span>
            </button>
            <button type="button" className={`lp-split-mode-btn is-ga4 ${sliderPos >= 90 ? "is-active" : ""}`} onClick={() => setSliderPos(100)}>
              <X size={12} /><span>Ver 100% GA4</span>
            </button>
            <button type="button" className={`lp-split-mode-btn is-kubo ${sliderPos <= 10 ? "is-active" : ""}`} onClick={() => setSliderPos(0)}>
              <Check size={12} /><span>Ver 100% Kubo Analytics</span>
            </button>
          </div>

          <div
            ref={viewportRef}
            className="lp-split-viewport"
            onPointerDown={(e) => { setDragging(true); updatePosition(e.clientX); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => dragging && updatePosition(e.clientX)}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            style={{ cursor: dragging ? "ew-resize" : "default" }}
            aria-label="Comparador interativo entre GA4 e Kubo"
          >
            {/* Two real side-by-side panes (not an overlapping clip-path) so each
                side's content stays fully readable at any slider position. */}
            <div className="lp-split-pane lp-split-pane--before" style={{ width: `${sliderPos}%` }}>
              <div className="lp-split-pane__content">
                <div className="lp-split-header">
                  <span className="lp-split-badge lp-split-badge--ga4"><AlertTriangle size={12} /> Google Analytics (GA4)</span>
                  <span className="lp-split-latency">Atraso: <b>24h a 48h</b></span>
                </div>
                <div className="lp-split-points">
                  {PROBLEM_POINTS.map((p) => (
                    <div className="lp-split-point" key={p.title}>
                      <X size={14} className="is-bad" />
                      <div><strong>{p.title}</strong><p>{p.copy}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lp-split-pane lp-split-pane--after" style={{ width: `${100 - sliderPos}%` }}>
              <div className="lp-split-pane__content">
                <div className="lp-split-header">
                  <span className="lp-split-badge lp-split-badge--kubo"><Sparkles size={12} /> Kubo Analytics</span>
                  <span className="lp-split-latency">Latência: <b>tempo real</b></span>
                </div>
                <div className="lp-split-points">
                  {SOLUTION_POINTS.map((p) => (
                    <div className="lp-split-point" key={p.title}>
                      <Check size={14} className="is-good" />
                      <div><strong>{p.title}</strong><p>{p.copy}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lp-split-handle" style={{ left: `${sliderPos}%` }} onPointerDown={(e) => { setDragging(true); updatePosition(e.clientX); }}>
              <div className="lp-split-handle__btn"><span>◀ ▶</span></div>
              <div className="lp-split-handle__pill">{sliderPos < 35 ? "Kubo" : sliderPos > 65 ? "GA4" : `${Math.round(sliderPos)}%`}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
