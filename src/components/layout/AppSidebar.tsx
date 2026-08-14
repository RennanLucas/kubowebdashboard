import { LayoutDashboard, Settings, Shield, Sparkles, CreditCard, LogOut, Bell, HelpCircle, GitCompare, Maximize2, Activity, Download, Lock } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import type { FeatureKey } from "@/lib/plan-features";
import logoKuboweb from "@/assets/logo-kuboweb-white.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const mainItems: {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  tour?: string;
  feature?: FeatureKey;
}[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, tour: "sidebar-dashboard" },
  { title: "Live", url: "/live", icon: Activity, tour: "sidebar-live", feature: "live" },
  { title: "IA / Insights", url: "/insights", icon: Sparkles, tour: "sidebar-insights", feature: "ai_insights" },
  { title: "Alertas", url: "/alerts", icon: Bell, tour: "sidebar-alerts" },
  { title: "Comparar", url: "/compare", icon: GitCompare, tour: "sidebar-compare", feature: "compare" },
  { title: "Apresentação", url: "/presentation", icon: Maximize2, tour: "sidebar-presentation", feature: "presentation" },
];

const accountItems = [
  { title: "Configurações", url: "/settings", icon: Settings, tour: "sidebar-settings" },
  { title: "Assinatura", url: "/subscription", icon: CreditCard, tour: "sidebar-pricing" },
  { title: "Instalar app", url: "/install", icon: Download },
  { title: "Ajuda", url: "/help", icon: HelpCircle },
];

interface NavItemProps {
  url: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tour?: string;
  active: boolean;
  locked?: boolean;
}

const NavItem = ({ url, title, icon: Icon, tour, active, locked }: NavItemProps) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={active}
      tooltip={locked ? `${title} · disponível em planos pagos` : title}
      className={[
        "h-9 rounded-md text-[13px] font-medium",
        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80",
        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold",
        "transition-all duration-200 ease-in-out",
      ].join(" ")}
    >
      <NavLink
        to={url}
        end
        data-tour={tour}
        className="flex items-center gap-2.5 px-2"
      >
        <Icon className={`h-[15px] w-[15px] shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"} ${locked ? "opacity-55" : ""}`} />
        <span className={`truncate ${locked ? "opacity-55" : ""}`}>{title}</span>
        {locked && <Lock className="ml-auto h-3 w-3 shrink-0 opacity-60" />}
      </NavLink>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const plan = usePlan();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = (user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/30 relative"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      <SidebarHeader className="border-b border-sidebar-border/70">
        <div className="flex items-center gap-2 px-2 py-3">
          {collapsed ? (
            <img src={logoKuboweb} alt="KUBOWEB" className="h-7 w-7 object-contain mx-auto" />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <img src={logoKuboweb} alt="KUBOWEB" className="h-7 w-auto shrink-0" />
              <span
                className={[
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all duration-300",
                  plan.isFree
                    ? "bg-sidebar-accent text-sidebar-foreground/70"
                    : "bg-primary text-primary-foreground animate-pulse hover:animate-none",
                ].join(" ")}
              >
                {plan.loading ? "..." : plan.label}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45 font-semibold px-2 mb-1">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainItems.map(({ feature, ...item }) => (
                <NavItem
                  key={item.title}
                  {...item}
                  active={isActive(item.url)}
                  locked={!!feature && !plan.loading && !plan.can(feature) && !isAdmin}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-2 mx-2 border-t border-sidebar-border/60" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45 font-semibold px-2 mb-1">
            Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {accountItems.map((item) => (
                <NavItem key={item.title} {...item} active={isActive(item.url)} />
              ))}
              {isAdmin && (
                <NavItem
                  url="/admin"
                  title="Admin"
                  icon={Shield}
                  active={isActive("/admin")}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 bg-sidebar/40">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-[11px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-sidebar-foreground truncate leading-tight">
                  {user?.email}
                </div>
                {isAdmin && (
                  <div className="text-[10px] text-sidebar-foreground/55 font-medium leading-tight mt-0.5">
                    Administrador
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleSignOut}
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
