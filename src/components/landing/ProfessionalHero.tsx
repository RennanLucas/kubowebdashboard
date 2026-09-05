import { ArrowRight, ArrowUpRight, Activity, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import "./professional-landing.css";

export function ProfessionalHero() {
  return (
    <section id="hero" className="kubo-hero">
      <div className="kubo-copy">
        <p className="kubo-eyebrow">
          <span /> KUBOWEB ANALYTICS
        </p>
        <h1>
          Seu tráfego conta uma história.
          <br />
          <em>Entenda o próximo passo.</em>
        </h1>
        <p className="kubo-description">
          Descubra de onde vêm seus visitantes, acompanhe conversões e
          transforme os dados do seu site em decisões mais claras.
        </p>
        <div className="kubo-actions">
          <Link to="/login">
            Começar gratuitamente <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works">
            Como funciona <ArrowUpRight size={17} />
          </a>
        </div>
        <p className="kubo-footnote">
          Plano gratuito disponível · Evolua para o Pro quando precisar
        </p>
      </div>
      <div
        className="kubo-stage"
        role="img"
        aria-label="Painel ilustrativo em três dimensões. Dados fictícios de demonstração."
      >
        <div className="kubo-orbit" />
        <div className="kubo-board">
          <div className="kubo-toolbar">
            <span>
              <Layers size={16} /> Visão geral
            </span>
            <small>DEMONSTRAÇÃO</small>
          </div>
          <div className="kubo-board-title">
            <small>SEU SITE, EM PERSPECTIVA</small>
            <h2>Os números fazem sentido.</h2>
          </div>
          <div className="kubo-metrics">
            {[
              ["Visitantes", "12.840"],
              ["Conversões", "386"],
              ["Conversão", "3,0%"],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="kubo-chart-label">
            Visitas ao longo do tempo <span>Últimos 7 dias</span>
          </p>
          <div className="kubo-bars">
            {[28, 43, 35, 62, 49, 78, 94].map((height, i) => (
              <div key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="kubo-days">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>
        <div className="kubo-float kubo-float-top">
          <Activity size={22} />
          <div>
            <small>Tráfego em movimento</small>
            <strong>Uma visão mais clara</strong>
          </div>
        </div>
        <div className="kubo-float kubo-float-bottom">
          <ArrowUpRight size={24} />
          <div>
            <small>Do clique à conversão</small>
            <strong>Encontre oportunidades</strong>
          </div>
        </div>
      </div>
      <div className="kubo-bottom">
        <span>01 / CONHEÇA SEU PÚBLICO</span>
        <span>Menos planilhas. Mais contexto.</span>
      </div>
    </section>
  );
}
