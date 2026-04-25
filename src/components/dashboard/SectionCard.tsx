import { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/InfoTooltip";

interface SectionCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card title (rendered in the standard section-title style) */
  title?: ReactNode;
  /** Optional subtitle below the title */
  subtitle?: ReactNode;
  /** Optional icon shown before the title */
  icon?: ReactNode;
  /** Tooltip content shown next to the title via InfoTooltip */
  tooltip?: ReactNode;
  /** Optional content rendered on the right side of the header (e.g. badges, dropdowns) */
  actions?: ReactNode;
  /** Use the lighter padding (p-5) instead of the default sm:p-6 step */
  compact?: boolean;
  /** Hide the default header wrapper (used when the card needs a fully custom header) */
  hideHeader?: boolean;
  children: ReactNode;
}

/**
 * Standardized dashboard card shell.
 *
 * Wraps the recurring `glass-card` + section-title + InfoTooltip + subtitle
 * pattern used across KPI/chart/table widgets so we don't repeat the same
 * 8-line header in every component.
 *
 * Visual output is intentionally identical to the previous inline markup —
 * this is a refactor, not a redesign.
 */
export const SectionCard = ({
  title,
  subtitle,
  icon,
  tooltip,
  actions,
  compact,
  hideHeader,
  className,
  children,
  ...rest
}: SectionCardProps) => {
  const hasHeader = !hideHeader && (title || subtitle || actions || icon);

  return (
    <div
      className={cn(
        "glass-card",
        compact ? "p-5" : "p-5 sm:p-6",
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
              {title && <h3 className="section-title">{title}</h3>}
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
