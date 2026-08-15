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
      localStorage.clear();
      sessionStorage.clear();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    } catch {}
    
    // Force a hard reload from the server, bypassing cache
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
          <div className="max-w-lg w-full p-6 rounded-2xl border border-border bg-card shadow-xl text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Falha ao renderizar o painel</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Detalhes do erro detectado:
              </p>
              {this.state.error && (
                <pre className="mt-2 p-3 bg-muted/60 border border-border rounded-md text-[11px] text-destructive text-left overflow-auto max-h-40 font-mono whitespace-pre-wrap">
                  {this.state.error.message || String(this.state.error)}
                </pre>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/dashboard"; }} className="flex-1 text-xs">
                Limpar Cache e Recarregar
              </Button>
              <Button onClick={this.handleReset} className="flex-1 text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Recarregar Painel
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
