import { Activity, BarChart3, ChevronDown, Eye, MousePointerClick, Users } from "lucide-react";

const chartPath = "M0 77 C 8 72, 13 54, 22 59 S 36 82, 45 49 S 61 37, 70 43 S 83 24, 100 15";

export function ProductDashboard() {
  return (
    <div className="lp-product" aria-label="Demonstração da interface do Kubo Analytics">
      <div className="lp-product__chrome">
        <div className="lp-product__dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="lp-product__address"><span className="lp-live-dot" /> analytics.kuboweb.com.br</div>
        <span className="lp-product__demo">dados demonstrativos</span>
      </div>

      <div className="lp-product__body">
        <aside className="lp-product__sidebar" aria-hidden="true">
          <div className="lp-product__brand"><BarChart3 size={15} /> Kubo</div>
          <span className="is-active">Visão geral</span>
          <span>Ao vivo</span>
          <span>Conversões</span>
          <span>Insights</span>
          <span>Alertas</span>
        </aside>

        <div className="lp-product__main">
          <header className="lp-product__header">
            <div><small>Projeto</small><strong>Loja principal</strong></div>
            <button type="button" tabIndex={-1}>Últimos 30 dias <ChevronDown size={12} /></button>
          </header>

          <div className="lp-metric-grid">
            <Metric icon={<Users />} label="Visitantes" value="12.842" delta="+18,4%" />
            <Metric icon={<Eye />} label="Visualizações" value="31.296" delta="+12,8%" />
            <Metric icon={<MousePointerClick />} label="Leads" value="486" delta="+24,1%" />
            <Metric icon={<Activity />} label="Conversão" value="3,78%" delta="+0,6%" />
          </div>

          <div className="lp-product__analytics">
            <div className="lp-product__chart">
              <div className="lp-product__chart-title"><span>Visitantes e leads</span><small>Atualizado agora</small></div>
              <svg viewBox="0 0 100 90" preserveAspectRatio="none" role="img" aria-label="Gráfico demonstrativo de crescimento de visitantes">
                <defs>
                  <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#3b82f6" stopOpacity=".42" />
                    <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${chartPath} L100 90 L0 90 Z`} fill="url(#lp-area)" />
                <path d={chartPath} fill="none" stroke="#60a5fa" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="lp-product__axis"><span>01 set</span><span>10 set</span><span>20 set</span><span>30 set</span></div>
            </div>
            <div className="lp-product__sources">
              <div className="lp-product__chart-title"><span>Fontes</span><small>Visitas</small></div>
              <Source label="Orgânico" value="42%" width="42%" />
              <Source label="Direto" value="31%" width="31%" />
              <Source label="Social" value="18%" width="18%" />
              <Source label="Referência" value="9%" width="9%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: string }) {
  return (
    <div className="lp-metric">
      <div className="lp-metric__top"><span>{icon}</span><small>{label}</small></div>
      <strong>{value}</strong>
      <em>{delta}</em>
    </div>
  );
}

function Source({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div className="lp-source">
      <div><span>{label}</span><b>{value}</b></div>
      <i><span style={{ width }} /></i>
    </div>
  );
}
