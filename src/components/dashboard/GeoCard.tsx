import { MapPin } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "./SectionCard";

interface GeoItem {
  name: string;
  count: number;
  percentage: number;
}

const countryNames: Record<string, string> = {
  BR: "Brasil", US: "Estados Unidos", PT: "Portugal", AR: "Argentina",
  DE: "Alemanha", FR: "França", GB: "Reino Unido", ES: "Espanha",
  MX: "México", CO: "Colômbia", CL: "Chile", IT: "Itália",
  CA: "Canadá", JP: "Japão", AU: "Austrália", IN: "Índia",
  UY: "Uruguai", PY: "Paraguai", PE: "Peru", EC: "Equador",
};

const flagEmoji = (code: string) => {
  if (!code || code.length !== 2) return "🌍";
  const base = 0x1F1E6;
  return String.fromCodePoint(base + code.charCodeAt(0) - 65, base + code.charCodeAt(1) - 65);
};

interface GeoCardProps {
  countries: GeoItem[];
  cities?: GeoItem[];
}

const GeoCard = ({ countries, cities = [] }: GeoCardProps) => {
  const [tab, setTab] = useState<"cities" | "countries">(cities.length > 0 ? "cities" : "countries");
  const items = tab === "cities" ? cities : countries;
  const maxCount = items.length > 0 ? items[0].count : 1;

  return (
    <SectionCard
      icon={<MapPin className="h-4 w-4 text-primary" />}
      title="Localização dos Visitantes"
      tooltip="De onde estão vindo os seus visitantes — alterne entre cidades e países."
      compact
    >
      <div className="flex gap-1 mb-4 p-0.5 bg-muted rounded-lg">
        <button
          onClick={() => setTab("cities")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all duration-150 ${
            tab === "cities" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cidades
        </button>
        <button
          onClick={() => setTab("countries")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all duration-150 ${
            tab === "countries" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Países
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {tab === "cities" ? "Sem dados de cidade ainda" : "Sem dados de localização ainda"}
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 10).map((c, i) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {tab === "countries" && <span className="text-base">{flagEmoji(c.name)}</span>}
                  {tab === "cities" && <span className="text-xs">📍</span>}
                  <span className="text-sm text-card-foreground">
                    {tab === "countries" ? (countryNames[c.name] || c.name) : c.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{c.count.toLocaleString("pt-BR")} · {c.percentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(c.count / maxCount) * 100}%`, opacity: 1 - i * 0.07 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default GeoCard;
