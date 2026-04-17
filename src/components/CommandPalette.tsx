import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Sparkles,
  Bell,
  Settings,
  CreditCard,
  HelpCircle,
  Shield,
  LogOut,
  Download,
  Target,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, ações ou métricas..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/insights")}>
            <Sparkles className="mr-2 h-4 w-4" /> Insights
          </CommandItem>
          <CommandItem onSelect={() => go("/alerts")}>
            <Bell className="mr-2 h-4 w-4" /> Alertas
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Configurações
          </CommandItem>
          <CommandItem onSelect={() => go("/pricing")}>
            <CreditCard className="mr-2 h-4 w-4" /> Assinatura
          </CommandItem>
          <CommandItem onSelect={() => go("/help")}>
            <HelpCircle className="mr-2 h-4 w-4" /> Ajuda / Glossário
          </CommandItem>
          {isAdmin && (
            <CommandItem onSelect={() => go("/admin")}>
              <Shield className="mr-2 h-4 w-4" /> Admin
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Atalhos rápidos">
          <CommandItem onSelect={() => go("/dashboard")}>
            <Target className="mr-2 h-4 w-4" /> Definir metas do período
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard")}>
            <Clock className="mr-2 h-4 w-4" /> Ver heatmap de horários
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Download className="mr-2 h-4 w-4" /> Copiar código de rastreamento
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Conta">
          <CommandItem
            onSelect={async () => {
              setOpen(false);
              await signOut();
              navigate("/login");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
