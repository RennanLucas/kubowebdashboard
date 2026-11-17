import { useRef, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { PROBLEM_POINTS, SOLUTION_POINTS } from "./data";

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
    <section className="lp-section">
      <div className="lp-shell">
        <div className="lp-section__head">
          <span className="lp-label">Comparação</span>
          <h2 className="lp-h2">O Google Analytics foi feito para outra década.</h2>
          <p>
            Filas de configuração, dados que chegam um dia depois e nenhuma noção de conversão em
            WhatsApp. O Kubo foi construído para o que você precisa ver hoje.
          </p>
        </div>

        <div className="lp-split-section">
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
                  <span className="lp-split-badge lp-split-badge--ga4">Google Analytics (GA4)</span>
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
                  <span className="lp-split-badge lp-split-badge--kubo">Kubo Analytics</span>
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
        </div>
      </div>
    </section>
  );
}
