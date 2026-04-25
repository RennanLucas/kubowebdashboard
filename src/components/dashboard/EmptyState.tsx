import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Standard empty-state for dashboard widgets.
 *
 * Mirrors the existing pattern: centered icon bubble + title + muted
 * description, used by TopPages, TopReferrers, etc.
 */
export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center py-10 text-center", className)}>
    {icon && (
      <div className="h-12 w-12 rounded-full bg-muted/70 flex items-center justify-center mb-3 text-muted-foreground">
        {icon}
      </div>
    )}
    {title && <p className="text-sm font-medium text-foreground">{title}</p>}
    {description && (
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
    )}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
