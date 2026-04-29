import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  live: "Live",
  insights: "IA / Insights",
  alerts: "Alertas",
  compare: "Comparar",
  presentation: "Apresentação",
  settings: "Configurações",
  subscription: "Assinatura",
  pricing: "Planos",
  help: "Ajuda",
  admin: "Admin",
  install: "Instalar app",
  onboarding: "Onboarding",
  checkout: "Checkout",
  return: "Confirmação",
};

export const Breadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden md:flex items-center gap-1 text-[13px] text-muted-foreground min-w-0"
    >
      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[seg] || decodeURIComponent(seg);

        return (
          <span key={href} className="flex items-center gap-1 min-w-0">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            )}
            {isLast ? (
              <span className="text-foreground font-medium truncate">{label}</span>
            ) : (
              <Link
                to={href}
                className="hover:text-foreground transition-colors truncate"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};
