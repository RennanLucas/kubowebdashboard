import { ArrowRight, Activity, ArrowUpRight, CheckCircle2, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./professional-landing.css";

export const ProfessionalHero = () => {
  return (
    <section className="kubo-hero" id="hero">
      <div className="kubo-hero-content">
        
        {/* Left: Copy */}
        <div className="kubo-copy">
          <div className="kubo-eyebrow fade-up">
            <Activity className="w-4 h-4" />
            <span>Kubo Web Analytics</span>
          </div>
          
          <h1 className="kubo-title fade-up fade-up-delay-1">
            Seu site <br className="hidden md:block" />
            <span className="text-shimmer">em perspectiva.</span>
          </h1>
          
          <p className="kubo-description fade-up fade-up-delay-2">
            Entenda de onde vêm seus visitantes, quais botões clicam e quantas conversões no WhatsApp você gera. Simples de usar, sem a complexidade do GA4.
          </p>
          
          <div className="kubo-actions fade-up fade-up-delay-3">
            <Link to="/login" className="kubo-btn-primary glow-pulse">
              Começar gratuitamente
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="kubo-btn-secondary">
              Como funciona
            </a>
          </div>
          
          <div className="kubo-footnote fade-up fade-up-delay-4">
            <span>Plano gratuito para sempre</span>
            <div className="kubo-footnote-dot" />
            <span>Script ultraleve</span>
            <div className="kubo-footnote-dot hidden sm:block" />
            <span className="hidden sm:block">Sem cookies invasivos</span>
          </div>
        </div>

        {/* Right: 3D Stage */}
        <div className="kubo-stage blur-in fade-up-delay-2">
          
          {/* Main Dashboard Board */}
          <div className="kubo-board">
            <div className="kubo-toolbar">
              <div className="kubo-toolbar-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="kubo-board-title">Visão geral</div>
              <div className="kubo-board-badge">DEMONSTRAÇÃO</div>
            </div>
            
            <div className="kubo-board-content">
              {/* Metrics Row */}
              <div className="kubo-metrics">
                <div className="kubo-metric-card scale-in fade-up-delay-3">
                  <span className="kubo-metric-label">Visitantes</span>
                  <div className="kubo-metric-value">12.840</div>
                  <div className="kubo-metric-trend">
                    <ArrowUpRight className="w-3 h-3" />
                    +14% esse mês
                  </div>
                </div>
                <div className="kubo-metric-card scale-in fade-up-delay-4">
                  <span className="kubo-metric-label">Conv. WhatsApp</span>
                  <div className="kubo-metric-value">386</div>
                  <div className="kubo-metric-trend">
                    <ArrowUpRight className="w-3 h-3" />
                    +5.2%
                  </div>
                </div>
                <div className="kubo-metric-card scale-in fade-up-delay-5">
                  <span className="kubo-metric-label">Taxa de Conv.</span>
                  <div className="kubo-metric-value">3,0%</div>
                  <div className="kubo-metric-trend text-white/50">
                    Estável
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="kubo-chart-container fade-up fade-up-delay-5">
                <div className="kubo-chart">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                    <div key={i} className="kubo-bar-col">
                      <div 
                        className="kubo-bar" 
                        style={{ 
                          height: `${height}%`,
                          animation: `scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + (i * 0.1)}s forwards`,
                          opacity: 0 
                        }} 
                      />
                    </div>
                  ))}
                </div>
                <div className="kubo-days">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="kubo-day">{day}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Card Top Right */}
          <div className="kubo-float top float-gentle scale-in fade-up-delay-4">
            <div className="kubo-float-icon">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div className="kubo-float-text">
              <span className="kubo-float-label">Tráfego ao vivo</span>
              <span className="kubo-float-value">+24 agora</span>
            </div>
          </div>

          {/* Floating Card Bottom Left */}
          <div className="kubo-float bottom float-gentle-delayed scale-in fade-up-delay-5">
            <div className="kubo-float-icon !text-primary">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="kubo-float-text">
              <span className="kubo-float-label">WhatsApp</span>
              <span className="kubo-float-value">12 cliques hoje</span>
            </div>
          </div>

        </div>
      </div>

      <div className="kubo-bottom fade-up fade-up-delay-5">
        <div>01 / ENTENDA SEU PÚBLICO</div>
        <div>Menos suposição. Mais clareza.</div>
      </div>
    </section>
  );
};
