import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlans } from "@/hooks/usePlans";
import { FALLBACK_PRO_PLAN, FREE_PLAN_FEATURES } from "./data";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

function PricingCard({
  name, tierLabel, badgeText, tagline, price, cadence, billingSubtext,
  featuresLabel, features, cta, recommended, disabled,
}: {
  name: string; tierLabel?: string; badgeText?: string; tagline: string; price: string; cadence: string;
  billingSubtext?: string; featuresLabel?: string; features: string[]; cta: string;
  recommended?: boolean; disabled?: boolean;
}) {
  return (
    <motion.article variants={fadeUp} className={`lp-price-card ${recommended ? "is-recommended" : ""}`}>
      {recommended && badgeText && (
        <div className="lp-price-badge"><Sparkles size={11} /><span>{badgeText}</span></div>
      )}
      <div className="lp-price-card__header">
        <span className={`lp-price-tier ${recommended ? "is-pro" : ""}`}>{tierLabel}</span>
        <h3 className="lp-price-card__title">{name}</h3>
        <p className="lp-price-card__tagline">{tagline}</p>
      </div>
      <div className="lp-price">
        <div className="lp-price__main"><strong className="lp-price__amount">{price}</strong><small className="lp-price__cadence">{cadence}</small></div>
        {billingSubtext && <div className="lp-price__sub">{billingSubtext}</div>}
      </div>
      <div className="lp-price-card__features-wrap">
        {featuresLabel && <span className="lp-price-card__features-title">{featuresLabel}</span>}
        <ul className="lp-price-card__list">
          {features.map((feature) => (
            <li key={feature}><span className={`lp-check-badge ${recommended ? "is-pro" : ""}`}><Check size={11} /></span><span>{feature}</span></li>
          ))}
        </ul>
      </div>
      <div className="lp-price-card__action">
        {disabled ? (
          <span className="lp-price-btn is-disabled" aria-disabled="true">Indisponível <ArrowRight size={13} /></span>
        ) : recommended ? (
          <Link to="/login" className="lp-cta" style={{ width: "100%" }} aria-label={cta}><span>{cta}</span><ArrowRight size={13} /></Link>
        ) : (
          <Link to="/login" className="lp-cta lp-cta--ghost" aria-label={cta}><span>{cta}</span><ArrowRight size={13} /></Link>
        )}
      </div>
    </motion.article>
  );
}

export function Pricing() {
  const { plans, loading, error } = usePlans();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const isAnnual = billingPeriod === "annual";

  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-shell">
        <motion.div className="lp-section-head lp-section-head--center" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>Planos transparentes</span>
          <h2>Comece grátis.<br />Evolua quando fizer sentido.</h2>
          <p>Sem surpresas ou contratos de fidelidade. Teste o plano Pro completo por 7 dias grátis.</p>
          <div className="lp-pricing__toggle" role="group" aria-label="Ciclo de faturamento">
            <button type="button" className={billingPeriod === "monthly" ? "is-active" : ""} onClick={() => setBillingPeriod("monthly")}>Mensal</button>
            <button type="button" className={billingPeriod === "annual" ? "is-active" : ""} onClick={() => setBillingPeriod("annual")}>
              Anual <span className="lp-pricing__discount-pill">-20% OFF</span>
            </button>
          </div>
        </motion.div>

        <motion.div className="lp-pricing__grid" variants={staggerContainer(0.1)} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <PricingCard
            name="Gratuito"
            tierLabel="Iniciante"
            tagline="Para validar o Kubo no seu site sem custos."
            price="R$ 0,00"
            cadence="/mês"
            billingSubtext="Sem cartão de crédito necessário"
            featuresLabel="O que está incluso:"
            features={FREE_PLAN_FEATURES}
            cta="Criar conta grátis"
          />

          {loading && <div className="lp-price-card lp-price-card--loading is-recommended" aria-label="Carregando plano Pro"><i /><i /><i /><i /></div>}

          {!loading && plans.map((plan) => {
            const isPro = plan.name.toLowerCase().includes("pro");
            const displayPrice = isPro && isAnnual ? "R$ 39,90" : plan.price;
            const subtext = isPro && isAnnual
              ? "Faturado R$ 478,80/ano · Economia de R$ 120/ano"
              : "7 dias grátis — cancele a qualquer momento";
            return (
              <PricingCard
                key={plan.id}
                name={plan.name}
                tierLabel="Completo"
                badgeText="★ MAIS ESCOLHIDO POR AGÊNCIAS"
                tagline={plan.tagline || FALLBACK_PRO_PLAN.tagline}
                price={displayPrice}
                cadence={plan.cadence}
                billingSubtext={subtext}
                featuresLabel="Tudo do Gratuito, mais:"
                features={plan.features.length >= 7 ? plan.features : FALLBACK_PRO_PLAN.features}
                cta={plan.cta || "Começar 7 dias grátis"}
                recommended
                disabled={!plan.enabled}
              />
            );
          })}

          {!loading && (error || plans.length === 0) && (
            <PricingCard
              {...FALLBACK_PRO_PLAN}
              tierLabel="Completo"
              badgeText="★ MAIS ESCOLHIDO POR AGÊNCIAS"
              price={isAnnual ? "R$ 39,90" : FALLBACK_PRO_PLAN.price}
              billingSubtext={isAnnual ? "Faturado R$ 478,80/ano · Economia de R$ 120/ano" : "7 dias grátis — cancele a qualquer momento"}
              featuresLabel="Tudo do Gratuito, mais:"
              recommended
            />
          )}
        </motion.div>

        <motion.div className="lp-pricing__guarantees" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <div className="lp-guarantee-item"><Check size={14} /><span>Ativação imediata em menos de 2 minutos</span></div>
          <div className="lp-guarantee-item"><Check size={14} /><span>Sem cobrança durante o período de 7 dias</span></div>
          <div className="lp-guarantee-item"><Check size={14} /><span>Cancelamento direto no painel com 1 clique</span></div>
        </motion.div>
      </div>
    </section>
  );
}
