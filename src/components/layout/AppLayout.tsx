import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { useAlertsCount } from "@/hooks/useAlertsCount";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: ReactNode;
}

const HeaderBadges = () => {
  const { count, criticalCount } = useAlertsCount();
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  return (
    <div className="ml-auto mr-2 flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              const evt = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: !isMac,
                metaKey: isMac,
                bubbles: true,
              });
              document.dispatchEvent(evt);
            }}
            className="hidden sm:inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-border/60 bg-muted/30 text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar</span>
            <kbd className="ml-1 inline-flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground/80">
              {isMac ? "⌘" : "Ctrl"}<span>K</span>
            </kbd>
          </button>
        </TooltipTrigger>
        <TooltipContent>Busca rápida ({isMac ? "⌘" : "Ctrl"}+K)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/alerts"
            className={`relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/60 transition-colors ${
              criticalCount > 0 ? "text-destructive" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={`Alertas${count > 0 ? ` (${count})` : ""}`}
          >
            <Bell className={`h-4 w-4 ${criticalCount > 0 ? "animate-pulse" : ""}`} />
            {count > 0 && (
              <>
                {criticalCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive/40 animate-ping" />
                )}
                <Badge
                  variant={criticalCount > 0 ? "destructive" : "secondary"}
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center rounded-full"
                >
                  {count > 9 ? "9+" : count}
                </Badge>
              </>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          {count === 0 ? "Sem alertas" : `${count} alerta${count > 1 ? "s" : ""} ativo${count > 1 ? "s" : ""}`}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <CommandPalette />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="ml-2" />
            <HeaderBadges />
          </header>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
