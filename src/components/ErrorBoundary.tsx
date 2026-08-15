import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("kuboweb.plan-preview");
      sessionStorage.clear();
    } catch {}
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
          <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card shadow-xl text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Algo deu errado ao carregar</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Uma falha temporária ocorreu na interface. Clique abaixo para recarregar o painel.
              </p>
            </div>
            <Button onClick={this.handleReset} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
