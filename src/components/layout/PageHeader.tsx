import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Stripe-inspired page header. Use at the top of any internal page
 * for consistent typography, spacing and actions placement.
 */
export const PageHeader = ({ title, subtitle, actions, className }: PageHeaderProps) => (
  <header
    className={cn(
      "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 animate-fade-in",
      className,
    )}
  >
    <div className="min-w-0">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle max-w-2xl">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Standard page padding/width wrapper. */
export const PageContainer = ({ children, className }: PageContainerProps) => (
  <div className={cn("px-4 py-6 sm:px-6 sm:py-8 max-w-[1400px] mx-auto w-full", className)}>
    {children}
  </div>
);
