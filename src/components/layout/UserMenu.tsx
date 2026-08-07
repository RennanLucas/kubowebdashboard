import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings as SettingsIcon, CreditCard, User as UserIcon, Eye, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePlanPreview } from "@/hooks/usePlanPreview";
import { PLAN_CAPABILITIES, type PlanTier } from "@/lib/plan-features";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PREVIEW_TIERS: PlanTier[] = ["free", "pro", "pro_plus"];

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const initials = (user?.email || "U").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-1">
    <ThemeToggle />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-muted/60"
          aria-label="Menu do usuário"
        >
          <Avatar className="h-7 w-7 ring-1 ring-border">
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-medium text-foreground truncate">
              {user?.email}
            </span>
            {isAdmin && (
              <span className="text-[11px] text-primary font-medium">
                Administrador
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <SettingsIcon className="h-3.5 w-3.5 mr-2" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/subscription" className="cursor-pointer">
            <CreditCard className="h-3.5 w-3.5 mr-2" />
            Assinatura
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <UserIcon className="h-3.5 w-3.5 mr-2" />
              Painel admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
};
