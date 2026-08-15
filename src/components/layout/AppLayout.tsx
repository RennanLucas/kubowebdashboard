import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { GlobalProjectSwitcher } from "./GlobalProjectSwitcher";
import { UserMenu } from "./UserMenu";
import { PlanPreviewBanner } from "@/components/PlanPreviewBanner";
import { CommandPalette } from "@/components/CommandPalette";
import { HelpButton } from "@/components/HelpButton";
import { useAlertsCount } from "@/hooks/useAlertsCount";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { hasCompletedTour, startProductTour } from "@/lib/product-tour";

interface AppLayoutProps {
  children: ReactNode;
}

const HeaderActions = () => {
  const { count, criticalCount } = useAlertsCount();
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  return (
    <div className="flex items-center gap-1.5">
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
            className="hidden sm:inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-border/70 bg-background hover:bg-muted/60 text-[12px] text-muted-foreground transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar</span>
            <span className="ml-1 inline-flex items-center gap-0.5">
              <kbd className="kbd">{isMac ? "⌘" : "Ctrl"}</kbd>
              <kbd className="kbd">K</kbd>
            </span>
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

      <div className="hidden sm:block w-px h-5 bg-border/70 mx-1" />
      <UserMenu />
    </div>
  );
};

function AppLayoutContent({ children }: { children: ReactNode }) {
  const { state, isMobile } = useSidebar();
  
  return (
    <div 
      className="main-area flex-1 flex flex-col min-w-0 transition-all duration-200 ease-linear"
      style={{
        marginLeft: isMobile ? 0 : (state === "collapsed" ? "var(--sidebar-width-icon)" : "var(--sidebar-width)"),
        width: isMobile ? "100%" : (state === "collapsed" ? "calc(100% - var(--sidebar-width-icon))" : "calc(100% - var(--sidebar-width))")
      }}
    >
      <header className="h-14 flex items-center gap-3 border-b-0 bg-background/60 backdrop-blur-2xl sticky top-0 z-30 px-3 sm:px-4 shadow-sm after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0 transition-colors" />
        <div className="hidden sm:block w-px h-5 bg-border/70 shrink-0" />

        {/* Left cluster: project switcher + breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <GlobalProjectSwitcher />
          <Breadcrumbs />
        </div>

        {/* Right cluster: search, alerts, user */}
        <div className="flex-shrink-0">
          <HeaderActions />
        </div>
      </header>
      <PlanPreviewBanner />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  // Auto-start tour on first visit to dashboard
  useEffect(() => {
    if (location.pathname === "/dashboard" && !hasCompletedTour()) {
      const t = setTimeout(() => startProductTour(), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <CommandPalette />
      <div className="app-layout flex min-h-screen w-full bg-background relative">
        <AppSidebar />
        <AppLayoutContent>{children}</AppLayoutContent>
        <HelpButton />
      </div>
    </SidebarProvider>
  );
}
