import { MapPin } from "lucide-react";

interface CountryItem {
  name: string;
  count: number;
  percentage: number;
}

const countryNames: Record<string, string> = {
  BR: "Brasil", US: "Estados Unidos", PT: "Portugal", AR: "Argentina",
  DE: "Alemanha", FR: "França", GB: "Reino Unido", ES: "Espanha",
  MX: "México", CO: "Colômbia", CL: "Chile", IT: "Itália",
  CA: "Canadá", JP: "Japão", AU: "Austrália", IN: "Índia",
};

const flagEmoji = (code: string) => {
  if (!code || code.length !== 2) return "🌍";
  const base = 0x1F1E6;
  return String.fromCodePoint(base + code.charCodeAt(0) - 65, base + code.charCodeAt(1) - 65);
};

const GeoCard = ({ countries }: { countries: CountryItem[] }) => {
  const maxCount = countries.length > 0 ? countries[0].count : 1;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4" /> Localização dos Visitantes
      </h3>

      {countries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados de localização ainda</p>
      ) : (
        <div className="space-y-3">
          {countries.slice(0, 10).map((c, i) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{flagEmoji(c.name)}</span>
                  <span className="text-sm text-card-foreground">
                    {countryNames[c.name] || c.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{c.count} · {c.percentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(c.count / maxCount) * 100}%`, opacity: 1 - i * 0.08 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeoCard;
