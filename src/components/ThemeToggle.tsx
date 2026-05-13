import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "ghost" | "outline";
}

export const ThemeToggle = ({ className, variant = "ghost" }: Props) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className={cn("h-8 w-8 rounded-full", className)}
    >
      <Sun className={cn("h-4 w-4 transition-all", isDark ? "scale-0 -rotate-90 absolute" : "scale-100 rotate-0")} />
      <Moon className={cn("h-4 w-4 transition-all", isDark ? "scale-100 rotate-0" : "scale-0 rotate-90 absolute")} />
    </Button>
  );
};

export default ThemeToggle;
