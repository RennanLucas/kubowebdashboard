import { Cpu, Lock, Server, ShieldCheck } from "lucide-react";
import { SECURITY_ITEMS } from "./data";

const ICONS = [ShieldCheck, Lock, Server, Cpu];

export function Security() {
  return (
    <section className="lp-section" aria-label="Segurança e infraestrutura">
      <div className="lp-shell">
        <div className="lp-section__head">
          <span className="lp-label">Infraestrutura</span>
          <h2 className="lp-h2">Privacidade não é um item da tabela de preços.</h2>
          <p>
            Sem cookies de terceiros, sem fingerprinting e com isolamento entre organizações no
            próprio banco de dados.
          </p>
        </div>

        <div className="lp-security__grid">
          {SECURITY_ITEMS.map(({ title, desc }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={title} className="lp-security__card">
                <div className="lp-security__icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
