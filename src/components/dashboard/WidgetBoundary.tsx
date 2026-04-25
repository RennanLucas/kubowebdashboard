import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface WidgetBoundaryProps {
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Title shown in the error state */
  title?: string;
  /** Skeleton height in px (default 160) */
  skeletonHeight?: number;
  children: React.ReactNode;
}

/**
 * Wraps an individual dashboard widget with isolated loading/error states,
 * so a failure in one card doesn't break the rest of the dashboard.
 */
export const WidgetBoundary = ({
  isLoading,
  error,
  onRetry,
  title = "Não foi possível carregar este widget",
  skeletonHeight = 160,
  children,
}: WidgetBoundaryProps) => {
  if (isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="w-full" style={{ height: skeletonHeight }} />
      </Card>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Erro desconhecido";
    return (
      <Card className="p-5 border-destructive/30 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-1 break-words">{message}</p>
            {onRetry && (
              <Button variant="outline" size="sm" className="h-7 mt-3 text-xs" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return <WidgetErrorBoundary title={title}>{children}</WidgetErrorBoundary>;
};

/** Catches render-time exceptions inside a single widget. */
class WidgetErrorBoundary extends React.Component<
  { title: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[WidgetBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="p-5 border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{this.props.title}</p>
              <p className="text-xs text-muted-foreground mt-1 break-words">
                {this.state.error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 mt-3 text-xs"
                onClick={() => this.setState({ error: null })}
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Recarregar widget
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
