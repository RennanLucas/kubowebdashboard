import { Check, Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "ghost" | "outline";
}

export const ThemeToggle = ({ className, variant = "ghost" }: Props) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const themeLabel =
    theme === "light"
      ? "Claro"
      : theme === "dark"
      ? "Escuro"
      : "Sistema";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="icon"
          aria-label={`Tema: ${themeLabel}. Clique para alterar.`}
          title={`Tema: ${themeLabel}`}
          className={cn("h-8 w-8 rounded-full focus-visible:ring-1", className)}
        >
          {theme === "system" ? (
            <Laptop className="h-4 w-4 text-foreground transition-all" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-foreground transition-all" />
          ) : (
            <Sun className="h-4 w-4 text-foreground transition-all" />
          )}
          <span className="sr-only">Alternar tema (atual: {themeLabel})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between cursor-pointer text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors",
            theme === "light" && "bg-accent text-accent-foreground font-semibold"
          )}
        >
          <span className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>☀️ Claro</span>
          </span>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between cursor-pointer text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors",
            theme === "system" && "bg-accent text-accent-foreground font-semibold"
          )}
        >
          <span className="flex items-center gap-2">
            <Laptop className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>💻 Sistema</span>
          </span>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between cursor-pointer text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors",
            theme === "dark" && "bg-accent text-accent-foreground font-semibold"
          )}
        >
          <span className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>🌙 Escuro</span>
          </span>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
